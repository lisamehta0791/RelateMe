// backend/routes/onboarding.js
// First-run onboarding questionnaire answers (Phase 2 — simple fields only:
// city/firm pickers, ICAI branch, articleship, CA Final year, college,
// outreach date). One row per user, upserted on every save.
const router = require('express').Router();
const pool   = require('../config/db');

// ── GET /api/onboarding/profile ─────────────────────────────────────────────
router.get('/profile', async (req, res) => {
  try {
    const [[row]] = await pool.execute(
      'SELECT * FROM tbl_candidate_onboarding_profile WHERE user_id = ?',
      [req.user.user_id]
    );
    res.json({ profile: row || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch onboarding profile' });
  }
});

// ── PUT /api/onboarding/profile ─────────────────────────────────────────────
// Body: any subset of the fields below — saved as a full upsert each time
// (the frontend always sends the complete current form state).
router.put('/profile', async (req, res) => {
  const uid = req.user.user_id;
  const {
    seeking_vote_cities = [],
    icai_branch = null,
    practice_cities = [],
    past_firm_org_ids = [],
    is_articleship_principal = null,
    articleship_student_count = null,
    coaching_institutes = [],
    ca_final_year = null,
    graduation_college = null,
    outreach_start_date = null,
    senior_fca_supporter_ids = [],
    backing_firm_org_ids = [],
    influencer_member_ids = [],
    social_connects = {},
  } = req.body;

  if (is_articleship_principal !== null && !['Y','N'].includes(is_articleship_principal)) {
    return res.status(400).json({ error: 'is_articleship_principal must be Y or N' });
  }

  try {
    await pool.execute(
      `INSERT INTO tbl_candidate_onboarding_profile
         (user_id, seeking_vote_cities, icai_branch, practice_cities, past_firm_org_ids,
          is_articleship_principal, articleship_student_count, coaching_institutes,
          ca_final_year, graduation_college, outreach_start_date,
          senior_fca_supporter_ids, backing_firm_org_ids, influencer_member_ids, social_connects)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET
         seeking_vote_cities = EXCLUDED.seeking_vote_cities,
         icai_branch = EXCLUDED.icai_branch,
         practice_cities = EXCLUDED.practice_cities,
         past_firm_org_ids = EXCLUDED.past_firm_org_ids,
         is_articleship_principal = EXCLUDED.is_articleship_principal,
         articleship_student_count = EXCLUDED.articleship_student_count,
         coaching_institutes = EXCLUDED.coaching_institutes,
         ca_final_year = EXCLUDED.ca_final_year,
         graduation_college = EXCLUDED.graduation_college,
         outreach_start_date = EXCLUDED.outreach_start_date,
         senior_fca_supporter_ids = EXCLUDED.senior_fca_supporter_ids,
         backing_firm_org_ids = EXCLUDED.backing_firm_org_ids,
         influencer_member_ids = EXCLUDED.influencer_member_ids,
         social_connects = EXCLUDED.social_connects,
         updated_at = NOW()`,
      [
        uid,
        JSON.stringify(seeking_vote_cities || []),
        icai_branch || null,
        JSON.stringify(practice_cities || []),
        JSON.stringify(past_firm_org_ids || []),
        is_articleship_principal || null,
        articleship_student_count != null ? parseInt(articleship_student_count) : null,
        JSON.stringify(coaching_institutes || []),
        ca_final_year != null ? parseInt(ca_final_year) : null,
        graduation_college || null,
        outreach_start_date || null,
        JSON.stringify(senior_fca_supporter_ids || []),
        JSON.stringify(backing_firm_org_ids || []),
        JSON.stringify(influencer_member_ids || []),
        JSON.stringify(social_connects || {}),
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save onboarding profile' });
  }
});

// ── POST /api/onboarding/import-contacts ────────────────────────────────────
// Body: { phones: ['+91 98765 43210', ...] } — parsed client-side from an
// uploaded CSV/vCard export (no server-side file upload needed). Matches
// against tbl_member_phones by the last 10 digits (tolerates +91/spacing/
// formatting differences) and adds any matched member straight to My
// Universe, the same way the shortlist rule does.
// NOTE: this only covers "upload a contacts export from your phone/laptop" —
// live native contact-list sync isn't possible from a plain web app (no
// device contacts API), so there's no separate "sync" action, just upload.
router.post('/import-contacts', async (req, res) => {
  const uid = req.user.user_id;
  const phones = Array.isArray(req.body.phones) ? req.body.phones : [];
  const normalized = [...new Set(
    phones.map(p => String(p).replace(/\D/g, '').slice(-10)).filter(d => d.length === 10)
  )];
  if (!normalized.length) return res.json({ success: true, uploaded: phones.length, matched: 0, added: 0 });

  try {
    const [matches] = await pool.execute(
      `SELECT DISTINCT icai_membership_no FROM tbl_member_phones
       WHERE RIGHT(REGEXP_REPLACE(phone_number_full, '[^0-9]', '', 'g'), 10) IN (${normalized.map(() => '?').join(',')})`,
      normalized
    );
    let added = 0;
    for (const { icai_membership_no } of matches) {
      const [result] = await pool.execute(
        `INSERT INTO tbl_user_universe (user_id, icai_membership_no) VALUES (?, ?) ON CONFLICT DO NOTHING`,
        [uid, icai_membership_no]
      );
      added += result.affectedRows;
    }
    res.json({ success: true, uploaded: phones.length, matched: matches.length, added });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to import contacts' });
  }
});

// ── Contestant tagging (competitor / ex_colleague / ally) ───────────────────
// overlap_pct is a rough heuristic, not a real probability: computed from how
// many of {city, current firm} the contestant shares with the candidate's own
// onboarding answers (seeking/practice cities, past firms) — 0/50/100.
// ex_colleague is always stored as 0 (tagging someone as a known ex-colleague/
// batchmate/firm-mate is itself the signal that they're low-conflict — no
// overlap computation needed). ally has no percentage concept at all (null).
const CONTESTANT_TAG_TYPES = ['competitor', 'ex_colleague', 'ally'];

async function computeOverlapPct(userId, contestantMno) {
  const [[profile]] = await pool.execute(
    'SELECT seeking_vote_cities, practice_cities, past_firm_org_ids FROM tbl_candidate_onboarding_profile WHERE user_id = ?',
    [userId]
  );
  if (!profile) return 0;
  const cities = [...new Set([...(profile.seeking_vote_cities || []), ...(profile.practice_cities || [])])];
  const orgIds = (profile.past_firm_org_ids || []).map(id => parseInt(id)).filter(Number.isFinite);

  const [[row]] = await pool.execute(`
    SELECT
      bam.booth_city AS city,
      EXISTS (
        SELECT 1 FROM tbl_work_history wh
        WHERE wh.icai_membership_no = ? AND wh.work_status = 'Active'
          AND wh.org_id IN (${orgIds.length ? orgIds.map(() => '?').join(',') : 'NULL'})
      ) AS firm_match
    FROM tbl_ca_member m
    LEFT JOIN tbl_voter v ON v.icai_membership_no = m.icai_membership_no
                          AND v.election_year = (SELECT MAX(election_year) FROM tbl_voter)
    LEFT JOIN tbl_booth_master bm ON bm.election_year = v.election_year AND bm.boothno = v.boothno_new
    LEFT JOIN tbl_booth_address_master bam ON bam.booth_address_id = bm.booth_address_id
    WHERE m.icai_membership_no = ?
  `, [contestantMno, ...orgIds, contestantMno]);

  if (!row) return 0;
  const cityMatch = cities.includes(row.city);
  const firmMatch = !!row.firm_match;
  return (cityMatch ? 50 : 0) + (firmMatch ? 50 : 0);
}

// GET /api/onboarding/contestants — list current user's tagged contestants
router.get('/contestants', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT oc.contestant_id, oc.contestant_icai_membership_no, oc.tag_type, oc.overlap_pct, oc.created_at,
              m.member_display_name
       FROM tbl_onboarding_contestant oc
       JOIN tbl_ca_member m ON m.icai_membership_no = oc.contestant_icai_membership_no
       WHERE oc.user_id = ?
       ORDER BY oc.created_at DESC`,
      [req.user.user_id]
    );
    res.json({ contestants: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contestants' });
  }
});

// POST /api/onboarding/contestants — body: { icai_membership_no, tag_type }
router.post('/contestants', async (req, res) => {
  const uid = req.user.user_id;
  const { icai_membership_no, tag_type } = req.body;
  if (!icai_membership_no) return res.status(400).json({ error: 'icai_membership_no is required' });
  if (!CONTESTANT_TAG_TYPES.includes(tag_type)) return res.status(400).json({ error: 'Invalid tag_type' });

  try {
    let overlap_pct = null;
    if (tag_type === 'competitor') overlap_pct = await computeOverlapPct(uid, icai_membership_no);
    else if (tag_type === 'ex_colleague') overlap_pct = 0;

    const [[result]] = await pool.execute(
      `INSERT INTO tbl_onboarding_contestant (user_id, contestant_icai_membership_no, tag_type, overlap_pct)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (user_id, contestant_icai_membership_no, tag_type) DO UPDATE SET overlap_pct = EXCLUDED.overlap_pct
       RETURNING contestant_id`,
      [uid, icai_membership_no, tag_type, overlap_pct]
    );
    res.status(201).json({ success: true, contestant_id: result.contestant_id, overlap_pct });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to tag contestant' });
  }
});

// DELETE /api/onboarding/contestants/:id
router.delete('/contestants/:id', async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM tbl_onboarding_contestant WHERE contestant_id = ? AND user_id = ?',
      [req.params.id, req.user.user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove contestant tag' });
  }
});

// ── Shortlist rule ───────────────────────────────────────────────────────────
// "Simple overlap match": any member whose current city (via the booth chain)
// is in the candidate's seeking-vote or practice cities, OR who has an active
// work-history row at one of the candidate's past firms, is auto-added to
// tbl_user_universe. Preference tier is deliberately left unset (defaults to
// Unassigned) — the candidate still assigns P1-P4 manually afterward.
// NOTE: icai_branch is NOT matched — tbl_ca_member has no branch/region field
// to join against (member_region_base was dropped from the schema earlier),
// so there's nothing on the member side to compare it to.
async function applyShortlistRule(userId) {
  const [[profile]] = await pool.execute(
    'SELECT seeking_vote_cities, practice_cities, past_firm_org_ids FROM tbl_candidate_onboarding_profile WHERE user_id = ?',
    [userId]
  );
  if (!profile) return { added: 0 };

  const cities = [...new Set([...(profile.seeking_vote_cities || []), ...(profile.practice_cities || [])])];
  const orgIds = (profile.past_firm_org_ids || []).map(id => parseInt(id)).filter(Number.isFinite);

  if (!cities.length && !orgIds.length) return { added: 0 };

  const conditions = [];
  const params = [];
  if (cities.length) {
    conditions.push(`bam.booth_city IN (${cities.map(() => '?').join(',')})`);
    params.push(...cities);
  }
  if (orgIds.length) {
    conditions.push(`wh.org_id IN (${orgIds.map(() => '?').join(',')})`);
    params.push(...orgIds);
  }

  const [matches] = await pool.execute(`
    SELECT DISTINCT m.icai_membership_no
    FROM tbl_ca_member m
    LEFT JOIN tbl_voter v            ON v.icai_membership_no = m.icai_membership_no
                                     AND v.election_year = (SELECT MAX(election_year) FROM tbl_voter)
    LEFT JOIN tbl_booth_master bm    ON bm.election_year = v.election_year AND bm.boothno = v.boothno_new
    LEFT JOIN tbl_booth_address_master bam ON bam.booth_address_id = bm.booth_address_id
    LEFT JOIN tbl_work_history wh    ON wh.icai_membership_no = m.icai_membership_no AND wh.work_status = 'Active'
    WHERE ${conditions.join(' OR ')}
  `, params);

  let added = 0;
  for (const { icai_membership_no } of matches) {
    const [result] = await pool.execute(
      `INSERT INTO tbl_user_universe (user_id, icai_membership_no) VALUES (?, ?) ON CONFLICT DO NOTHING`,
      [userId, icai_membership_no]
    );
    added += result.affectedRows;
  }
  return { added, matched: matches.length };
}

// ── POST /api/onboarding/apply-shortlist ────────────────────────────────────
// Re-runnable on demand (e.g. after editing onboarding answers) — safe to
// call more than once, existing universe members are left untouched.
router.post('/apply-shortlist', async (req, res) => {
  try {
    const result = await applyShortlistRule(req.user.user_id);
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to apply shortlist rule' });
  }
});

module.exports = router;
module.exports.applyShortlistRule = applyShortlistRule;
