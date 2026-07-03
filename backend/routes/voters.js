// backend/routes/voters.js
// All routes require a valid JWT (applied in server.js via router-level auth).
//
// Member identity is anchored on tbl_ca_member.icai_membership_no, NOT on
// tbl_voter.voter_record_id — voter-roll data is per-election and may not be
// loaded for every member, but ICAI membership always is. tbl_voter_voting_history
// has been dropped — tbl_voter (one row per icai_membership_no + election_year,
// enforced by a UNIQUE constraint) is now the single source for voter-roll detail
// AND per-election voting status: voter_status itself is 'Voted'/'Silent'/'Postal',
// so there's no separate `voted` Y/N column anymore (derived below for API/frontend
// shape compatibility). The booth chain (tbl_booth_master -> tbl_booth_address_master)
// is left-joined in purely for city; a member with none of that data still shows
// up everywhere.
const router = require('express').Router();
const pool   = require('../config/db');
const pvs    = require('../services/pvs');

// ── Shared FROM/JOIN chain ──────────────────────────────────────────────────
// Anchors on tbl_ca_member ↔ tbl_ca_member_fact, left-joins the latest voter
// row (if any) ↔ booth chain (city) ↔ preference ↔ dnd ↔ universe (for the
// current user) ↔ current work history. The :uid placeholder MUST be passed
// as the FIRST bound parameter wherever this is used.
function joinsSql() {
  return `
  FROM tbl_ca_member m
  JOIN  tbl_ca_member_fact f ON f.icai_membership_no = m.icai_membership_no
  LEFT JOIN tbl_voter v ON v.icai_membership_no = m.icai_membership_no
                        AND v.election_year = (SELECT MAX(election_year) FROM tbl_voter)
  LEFT JOIN tbl_booth_master bm        ON bm.election_year = v.election_year AND bm.boothno = v.boothno_new
  LEFT JOIN tbl_booth_address_master bam ON bam.booth_address_id = bm.booth_address_id
  LEFT JOIN tbl_voter_preference vp ON vp.icai_membership_no = m.icai_membership_no
  LEFT JOIN tbl_dnd              d  ON d.icai_membership_no  = m.icai_membership_no
                                    AND d.dnd_status = 'Active'
  LEFT JOIN tbl_user_universe    uu ON uu.icai_membership_no = m.icai_membership_no
                                    AND uu.user_id = ?
  LEFT JOIN tbl_work_history     wh ON wh.wh_id = (
                                      -- A member can be an active partner at more than one firm at
                                      -- once, so this picks just the most recent one to show as
                                      -- "the" current org in list views (the profile's own work
                                      -- history table still shows every active entry, unfiltered).
                                      SELECT wh2.wh_id FROM tbl_work_history wh2
                                      WHERE wh2.icai_membership_no = m.icai_membership_no AND wh2.work_status = 'Active'
                                      ORDER BY wh2.from_year DESC, wh2.wh_id DESC LIMIT 1
                                    )
  LEFT JOIN tbl_org_details cur_org ON cur_org.org_id = wh.org_id
`;
}

function baseSql() {
  return `
  SELECT
    m.icai_membership_no                       AS id,
    m.icai_membership_no                       AS mno,
    v.voter_id,
    v.election_year,
    bam.booth_city                             AS region,
    v.boothno_new                              AS booth_no,
    v.voter_type,
    v.voter_sub_type,
    v.voter_status,
    m.member_display_name                      AS name,
    m.member_first_name                        AS first_name,
    m.member_last_name                         AS last_name,
    m.member_gender                            AS gender,
    m.member_dob                               AS dob,
    m.member_status,
    f.membership_grade                         AS catype,
    f.is_fca_member                            AS is_fca,
    f.associate_year,
    f.fellow_year,
    f.cop_status,
    f.member_photo_url                         AS photo_url,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.member_dob))::int AS age,
    COALESCE(vp.preference_tier, 'un')         AS pref,
    COALESCE(vp.support_status, 'Unknown')     AS support,
    vp.pvs_score                               AS pvs,
    vp.pvs_score_previous                      AS pvs_prev,
    vp.pref_id,
    cur_org.org_name                           AS org_name,
    cur_org.org_id                             AS org_id,
    cur_org.org_type                           AS firm_type,
    wh.designation                              AS designation,
    CASE WHEN d.dnd_id IS NOT NULL AND d.dnd_status = 'Active' THEN 1 ELSE 0 END AS dnd,
    CASE WHEN uu.icai_membership_no IS NOT NULL THEN 1 ELSE 0 END AS in_universe
  ${joinsSql()}`;
}

// ── Shared filter builder ───────────────────────────────────────────────────
// Builds WHERE conditions from query params. `exclude` skips a dimension's own
// filter — used by /facets to compute "what would this option's count be"
// against every OTHER active filter.
const FILTER_KEYS = ['search', 'pref', 'pvs', 'catype', 'city', 'firm', 'firm_type', 'age', 'universe', 'label', 'tag', 'institute'];
// Facet filters accept comma-separated values for multi-select (e.g. city=Chennai,Mumbai).
function toList(v) {
  if (v == null || v === '') return [];
  return String(v).split(',').map(s => s.trim()).filter(Boolean);
}
function buildVoterConditions(query, exclude = []) {
  const {
    search = '', pref = '', pvs_min = 0, pvs_max = 1000,
    catype = '', firm = '', firm_type = '', city = '',
    age_min = '', age_max = '', universe = '', label = '', tag = '', institute = '',
  } = query;
  const conditions = [];
  const params = [];
  const skip = (k) => exclude.includes(k);

  if (!skip('search') && search) {
    conditions.push(`(
      m.member_display_name ILIKE ?
      OR m.icai_membership_no ILIKE ?
      OR cur_org.org_name ILIKE ?
      OR bam.booth_city ILIKE ?
    )`);
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (!skip('pref') && pref) { conditions.push("COALESCE(vp.preference_tier,'un') = ?"); params.push(pref); }
  if (!skip('pvs') && pvs_min) { conditions.push('COALESCE(vp.pvs_score,0) >= ?');         params.push(parseInt(pvs_min)); }
  if (!skip('pvs') && pvs_max < 1000) { conditions.push('COALESCE(vp.pvs_score,1000) <= ?'); params.push(parseInt(pvs_max)); }
  if (!skip('catype') && catype) {
    const grades = toList(catype).filter(g => g === 'ACA' || g === 'FCA');
    if (grades.length) { conditions.push(`f.membership_grade IN (${grades.map(()=>'?').join(',')})`); params.push(...grades); }
  }
  if (!skip('city') && city) {
    const cities = toList(city);
    if (cities.length) { conditions.push(`bam.booth_city IN (${cities.map(()=>'?').join(',')})`); params.push(...cities); }
  }
  if (!skip('firm') && firm) {
    const firms = toList(firm);
    // a single numeric value is treated as an org_id; otherwise an IN-list of exact org names
    // (multi-select facet) or, with no comma, a LIKE fragment (free-text search use).
    if (firms.length === 1 && /^\d+$/.test(firms[0])) {
      conditions.push('cur_org.org_id = ?'); params.push(parseInt(firms[0]));
    } else if (firms.length > 1) {
      conditions.push(`cur_org.org_name IN (${firms.map(()=>'?').join(',')})`); params.push(...firms);
    } else if (firms.length === 1) {
      conditions.push('cur_org.org_name ILIKE ?'); params.push(`%${firms[0]}%`);
    }
  }
  if (!skip('firm_type') && firm_type) {
    const types = toList(firm_type).filter(t => t === 'CA' || t === 'NON_CA');
    if (types.length) { conditions.push(`cur_org.org_type IN (${types.map(()=>'?').join(',')})`); params.push(...types); }
  }
  if (!skip('age') && age_min !== '' && age_min != null) {
    conditions.push('EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.member_dob)) >= ?'); params.push(parseInt(age_min));
  }
  if (!skip('age') && age_max !== '' && age_max != null) {
    conditions.push('EXTRACT(YEAR FROM AGE(CURRENT_DATE, m.member_dob)) <= ?'); params.push(parseInt(age_max));
  }
  if (!skip('universe')) {
    if (universe === 'in')  conditions.push('uu.icai_membership_no IS NOT NULL');
    if (universe === 'out') conditions.push('uu.icai_membership_no IS NULL');
  }
  // EXISTS, not a JOIN — a member can have several labels/tags, and joining
  // tbl_member_label/tbl_member_action_tag into the shared FROM chain would
  // multiply that member's row in every other query that reuses it.
  if (!skip('label') && label) {
    const labels = toList(label);
    if (labels.length) {
      conditions.push(`EXISTS (
        SELECT 1 FROM tbl_member_label ml2
        WHERE ml2.icai_membership_no = m.icai_membership_no AND ml2.label_text IN (${labels.map(()=>'?').join(',')})
      )`);
      params.push(...labels);
    }
  }
  if (!skip('tag') && tag) {
    conditions.push(`EXISTS (
      SELECT 1 FROM tbl_member_action_tag mat
      WHERE mat.icai_membership_no = m.icai_membership_no AND mat.tag_type = ?
    )`);
    params.push(tag);
  }
  // Institute detail page's member list — education history isn't part of the
  // shared joinsSql() chain (a member can have several entries there too), so
  // this is an EXISTS check against tbl_voter_education_history by institute_id,
  // same reasoning as label/tag above.
  if (!skip('institute') && institute) {
    conditions.push(`EXISTS (
      SELECT 1 FROM tbl_voter_education_history eh2
      WHERE eh2.icai_membership_no = m.icai_membership_no AND eh2.institute_id = ?
    )`);
    params.push(parseInt(institute));
  }
  return { conditions, params };
}

// ── GET /api/voters ─────────────────────────────────────────────────────────
// Query params: search, pref, pvs_min, pvs_max, city, catype, firm, firm_type,
//               age_min, age_max, universe, sort, page, limit
router.get('/', async (req, res) => {
  try {
    const { sort = 'default', page = 1, limit = 100 } = req.query;

    // uid is the FIRST bound param (consumed by the universe join in baseSql)
    const { conditions, params: filterParams } = buildVoterConditions(req.query);
    const params = [req.user.user_id, ...filterParams];
    const WHERE = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const ORDER_MAP = {
      default: 'm.member_display_name ASC',
      name:    'm.member_display_name ASC',
      org:     'cur_org.org_name ASC',
      city:    'bam.booth_city ASC',
      age:     'm.member_dob DESC', // most recent DOB first = youngest (lowest age) first, matching the old ascending-age sort
      pvs:     'vp.pvs_score DESC',
      pref:    "array_position(ARRAY['p1','p2','p3','p4','un'], COALESCE(vp.preference_tier,'un'))",
    };
    const ORDER = ORDER_MAP[sort] || ORDER_MAP.default;

    const lim        = Math.max(1, Math.min(parseInt(limit) || 100, 1000));
    const pg         = Math.max(1, parseInt(page) || 1);
    const offset     = (pg - 1) * lim;
    // The page of rows and the pagination count are independent reads over the
    // same filters — run them concurrently instead of one after the other.
    const [[rows], [cnt]] = await Promise.all([
      pool.execute(
        `${baseSql()} ${WHERE} ORDER BY ${ORDER} LIMIT ${lim} OFFSET ${offset}`,
        params
      ),
      pool.execute(
        `SELECT COUNT(*) AS total ${joinsSql()} ${WHERE}`,
        params
      ),
    ]);

    res.json({ voters: rows, total: cnt[0].total, page: pg, limit: lim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch voters' });
  }
});

// ── GET /api/voters/facets ──────────────────────────────────────────────────
// Facet options + live counts for the All Members filter sidebar, computed
// across the WHOLE dataset (not just the current page). Each dimension's
// counts respect every OTHER active filter but not its own — same "what would
// this checkbox show if I added it" semantics as the old client-side version,
// just computed server-side now that the roll is 19,000+ rows.
// `q` (optional) is the Filters popover's "common search" box — narrows the
// city/org/label facet options to ones actually matching that text (server-
// side, against the full dataset), instead of the old behavior of filtering
// whatever 300-row-capped list happened to already be in memory. `org` also
// matches against org_reg_no, since a registration number is a very common
// way to look up a firm. If `q` is purely digits, it's also checked directly
// against icai_membership_no and returned as `memberMatches` — a membership
// number isn't a facet/category, so it doesn't fit the checkbox-list model;
// it's surfaced as a direct "jump to this member" result instead.
const DIMENSION_SEARCH_EXTRA_COL = { org: 'cur_org.org_reg_no' };

router.get('/facets', async (req, res) => {
  try {
    const uid = req.user.user_id;
    const q = (req.query.q || '').trim();
    const DIMENSIONS = {
      city:     'bam.booth_city',
      org:      'cur_org.org_name',
      catype:   'f.membership_grade',
      firmType: 'cur_org.org_type',
      pref:     "COALESCE(vp.preference_tier,'un')",
    };
    const out = {};

    // Every dimension below is an independent COUNT/GROUP BY over the same
    // joinsSql() chain — none depend on each other's results, so they're all
    // fired concurrently instead of one at a time (was 7 sequential full-join
    // queries per /facets call).
    const dimensionEntries = Object.entries(DIMENSIONS);
    const dimensionPromises = dimensionEntries.map(([key, col]) => {
      const excludeKey = key === 'org' ? 'firm' : key === 'firmType' ? 'firm_type' : key;
      const { conditions, params } = buildVoterConditions(req.query, [excludeKey]);
      const allConditions = [`${col} IS NOT NULL`, `${col} != ''`, ...conditions];
      const qParams = [];
      if (q && (key === 'city' || key === 'org')) {
        const extraCol = DIMENSION_SEARCH_EXTRA_COL[key];
        if (extraCol) { allConditions.push(`(${col} ILIKE ? OR ${extraCol} ILIKE ?)`); qParams.push(`%${q}%`, `%${q}%`); }
        else { allConditions.push(`${col} ILIKE ?`); qParams.push(`%${q}%`); }
      }
      return pool.execute(
        `SELECT ${col} AS val, COUNT(*) AS cnt
         ${joinsSql()}
         WHERE ${allConditions.join(' AND ')}
         GROUP BY ${col}
         ORDER BY cnt DESC
         LIMIT 300`,
        [uid, ...params, ...qParams]
      );
    });

    // Universe is boolean, not a GROUP BY dimension.
    const universePromise = (() => {
      const { conditions, params } = buildVoterConditions(req.query, ['universe']);
      const WHERE = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
      return pool.execute(
        `SELECT
           SUM(CASE WHEN uu.icai_membership_no IS NOT NULL THEN 1 ELSE 0 END) AS in_count,
           SUM(CASE WHEN uu.icai_membership_no IS NULL THEN 1 ELSE 0 END) AS out_count
         ${joinsSql()} ${WHERE}`,
        [uid, ...params]
      );
    })();

    // Label is a separate query (not part of the generic DIMENSIONS loop) — a
    // member can have several labels, and joining tbl_member_label into the
    // shared FROM chain would multiply that member's row everywhere else.
    const labelPromise = (() => {
      const { conditions, params } = buildVoterConditions(req.query, ['label']);
      const conds = [...conditions];
      const qParams = [];
      if (q) { conds.push('ml.label_text ILIKE ?'); qParams.push(`%${q}%`); }
      const WHERE = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      return pool.execute(
        `SELECT ml.label_text AS val, COUNT(DISTINCT m.icai_membership_no) AS cnt
         ${joinsSql()}
         JOIN tbl_member_label ml ON ml.icai_membership_no = m.icai_membership_no
         ${WHERE}
         GROUP BY ml.label_text
         ORDER BY cnt DESC
         LIMIT 300`,
        [uid, ...params, ...qParams]
      );
    })();

    // Membership-number lookup — only meaningful when `q` looks like one
    // (all digits); a name/city search shouldn't try to match it.
    const memberMatchPromise = (q && /^\d+$/.test(q))
      ? pool.execute(
          `SELECT icai_membership_no, member_display_name FROM tbl_ca_member WHERE icai_membership_no ILIKE ? ORDER BY icai_membership_no LIMIT 10`,
          [`%${q}%`]
        )
      : Promise.resolve([[]]);

    const [dimensionResults, [[universeRow]], [labelRows], [memberMatches]] = await Promise.all([
      Promise.all(dimensionPromises),
      universePromise,
      labelPromise,
      memberMatchPromise,
    ]);

    dimensionEntries.forEach(([key], i) => { out[key] = dimensionResults[i][0]; });
    out.universe = [
      { val: 'in',  cnt: universeRow.in_count || 0 },
      { val: 'out', cnt: universeRow.out_count || 0 },
    ];
    out.label = labelRows;
    out.memberMatches = memberMatches;

    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch facets' });
  }
});

// ── GET /api/voters/:id ─────────────────────────────────────────────────────
// :id is icai_membership_no. Full profile including phones, emails, social,
// work, education, icai roles, activities.
router.get('/:id', async (req, res) => {
  const mno = req.params.id;
  try {
    // Core member row
    const [rows] = await pool.execute(`${baseSql()} WHERE m.icai_membership_no = ?`, [req.user.user_id, mno]);
    if (!rows.length) return res.status(404).json({ error: 'Member not found' });
    const voter = rows[0];

    // Everything below is an independent read keyed on the same mno — run them
    // all concurrently instead of round-tripping one at a time (was ~10
    // sequential queries per profile load).
    const [
      [phones], [emails], [socials], [work], [education], [roles],
      [activities], [icai_edu], [dndRow], [voting_history], [tagRows], [labelRows],
    ] = await Promise.all([
      // Phones — all statuses (active shown first, inactive below, see profile UI)
      pool.execute(
        `SELECT phone_id, phone_country_code, phone_number, phone_number_full,
                phone_type, is_whatsapp, phone_status, phone_is_primary
         FROM tbl_member_phones WHERE icai_membership_no = ?
         ORDER BY (phone_status = 'Active') DESC, phone_is_primary DESC, phone_type`,
        [mno]
      ),
      // Emails — all statuses
      pool.execute(
        `SELECT email_id, email_address, email_type, email_status, email_is_primary
         FROM tbl_member_emails WHERE icai_membership_no = ?
         ORDER BY (email_status = 'Active') DESC, email_is_primary DESC, email_type`,
        [mno]
      ),
      // Social profiles
      pool.execute(
        `SELECT social_id, social_platform, social_handle_url, social_media_type, social_status
         FROM tbl_member_social_profiles WHERE icai_membership_no = ?`,
        [mno]
      ),
      // Work history (current — work_status = 'Active' — sorts first)
      pool.execute(
        `SELECT wh.wh_id, o.org_name, o.org_type, o.org_structure, wh.designation,
                wh.org_reg_no, wh.from_year, wh.to_year, wh.work_type, wh.work_status, wh.remark
         FROM tbl_work_history wh
         JOIN tbl_org_details o ON o.org_id = wh.org_id
         WHERE wh.icai_membership_no = ?
         ORDER BY (wh.work_status = 'Active') DESC, wh.from_year DESC`,
        [mno]
      ),
      // Education history
      pool.execute(
        `SELECT eh.edu_hist_id, eh.edu_course_type, eh.qualification_name,
                eh.from_year, eh.to_year, eh.edu_status,
                i.institute_name, o.org_name AS articleship_firm
         FROM tbl_voter_education_history eh
         LEFT JOIN tbl_institute_details i ON i.institute_id = eh.institute_id
         LEFT JOIN tbl_org_details o       ON o.org_id       = eh.org_id
         WHERE eh.icai_membership_no = ?
         ORDER BY eh.from_year DESC`,
        [mno]
      ),
      // ICAI roles / committees
      pool.execute(
        `SELECT role_id, role_type, role_value, from_year, to_year
         FROM tbl_voter_icai_roles WHERE icai_membership_no = ?
         ORDER BY from_year DESC`,
        [mno]
      ),
      // Activities (interactions)
      pool.execute(
        `SELECT a.activity_id, a.activity_type, a.activity_date, a.description,
                a.followup_date, a.followup_note, a.preference_outcome,
                u.full_name AS logged_by
         FROM tbl_activity a
         JOIN tbl_activity_participant ap ON ap.activity_id = a.activity_id
         LEFT JOIN tbl_app_user u ON u.user_id = a.created_by
         WHERE ap.icai_membership_no = ?
         ORDER BY a.activity_date DESC
         LIMIT 50`,
        [mno]
      ),
      // Education from ICAI master
      pool.execute(
        `SELECT qualification, specialisation, institution_name, university_name,
                graduation_year, study_mode, education_status
         FROM tbl_member_education WHERE icai_membership_no = ?`,
        [mno]
      ),
      // DND detail
      pool.execute(
        `SELECT dnd_id, dnd_from, reason, dnd_status FROM tbl_dnd
         WHERE icai_membership_no = ? AND dnd_status = 'Active' LIMIT 1`,
        [mno]
      ),
      // Voter details + voting history — one row per election year in tbl_voter.
      // `voted` is derived (Silent -> N, else Y) to keep the existing API/frontend
      // shape working without a separate voted column.
      pool.execute(
        `SELECT v.voter_record_id AS vh_id, v.election_year, v.voter_id,
                v.boothno_new AS voter_booth_no, v.boothno_old,
                v.voter_type, v.voter_sub_type, v.voter_status,
                CASE WHEN v.voter_status = 'Silent' THEN 'N' ELSE 'Y' END AS voted,
                v.updated_at, u.full_name AS updated_by_name
         FROM tbl_voter v
         LEFT JOIN tbl_app_user u ON u.user_id = v.updated_by
         WHERE v.icai_membership_no = ?
         ORDER BY v.election_year DESC`,
        [mno]
      ),
      // Call list / meet list / competitor tags
      pool.execute('SELECT tag_type FROM tbl_member_action_tag WHERE icai_membership_no = ?', [mno]),
      // Free-text labels
      pool.execute('SELECT label_id, label_text FROM tbl_member_label WHERE icai_membership_no = ? ORDER BY created_at DESC', [mno]),
    ]);

    res.json({
      voter,
      phones,
      emails,
      socials,
      work,
      education,
      icai_education: icai_edu,
      roles,
      activities,
      voting_history,
      dnd: dndRow[0] || null,
      tags: tagRows.map(r => r.tag_type),
      labels: labelRows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch voter profile' });
  }
});

// ── PATCH /api/voters/:id/preference ────────────────────────────────────────
// Update preference_tier, warmth, support_status. :id is icai_membership_no.
router.patch('/:id/preference', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  const { preference_tier, support_status } = req.body;

  const allowed_tiers   = ['p1','p2','p3','p4','un'];
  const allowed_support = ['Confirmed','Lean','Undecided','Opposition','Unknown'];

  if (preference_tier && !allowed_tiers.includes(preference_tier))
    return res.status(400).json({ error: 'Invalid preference_tier' });
  if (support_status && !allowed_support.includes(support_status))
    return res.status(400).json({ error: 'Invalid support_status' });

  try {
    // Upsert preference row
    const [existing] = await pool.execute(
      'SELECT pref_id, preference_tier, pvs_score FROM tbl_voter_preference WHERE icai_membership_no = ?',
      [mno]
    );

    if (existing.length) {
      const updates = [];
      const params  = [];
      if (preference_tier) { updates.push('preference_tier = ?');  params.push(preference_tier); }
      if (support_status)   { updates.push('support_status = ?');   params.push(support_status); }
      updates.push('updated_by = ?', 'updated_at = NOW()');
      params.push(uid, mno);
      await pool.execute(
        `UPDATE tbl_voter_preference SET ${updates.join(', ')} WHERE icai_membership_no = ?`,
        params
      );
    } else {
      await pool.execute(
        `INSERT INTO tbl_voter_preference
           (icai_membership_no, preference_tier, support_status, created_by)
         VALUES (?, ?, ?, ?)`,
        [mno, preference_tier || 'un', support_status || 'Unknown', uid]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update preference' });
  }
});

// ── POST /api/voters/:id/dnd ─────────────────────────────────────────────
// Toggle DND: if no active DND → create one; if active → mark Removed.
router.post('/:id/dnd', async (req, res) => {
  const mno  = req.params.id;
  const uid  = req.user.user_id;
  const { reason } = req.body;

  try {
    const [existing] = await pool.execute(
      "SELECT dnd_id FROM tbl_dnd WHERE icai_membership_no = ? AND dnd_status = 'Active'",
      [mno]
    );

    if (existing.length) {
      // Remove DND
      await pool.execute(
        "UPDATE tbl_dnd SET dnd_status='Removed', removed_at=NOW(), removed_by=?, updated_by=? WHERE dnd_id=?",
        [uid, uid, existing[0].dnd_id]
      );
      res.json({ dnd: false });
    } else {
      // Set DND
      await pool.execute(
        `INSERT INTO tbl_dnd (icai_membership_no, dnd_from, reason, dnd_status, created_by)
         VALUES (?, CURRENT_DATE, ?, 'Active', ?)`,
        [mno, reason || null, uid]
      );
      res.json({ dnd: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to toggle DND' });
  }
});

// ── POST /api/voters/:id/phone ───────────────────────────────────────────────
// Add a phone number. Body: { phone_number, phone_country_code, phone_type, is_whatsapp, is_primary }
// Only one primary phone per member — marking a new one primary demotes any existing one.
router.post('/:id/phone', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  const { phone_number, phone_country_code = '+91', phone_type, is_whatsapp, is_primary } = req.body;
  const PHONE_TYPES = ['Personal', 'Official'];
  const num = String(phone_number || '').trim();
  if (!num) return res.status(400).json({ error: 'phone_number is required' });
  if (!PHONE_TYPES.includes(phone_type)) return res.status(400).json({ error: 'Invalid phone_type' });
  try {
    if (is_primary) {
      await pool.execute('UPDATE tbl_member_phones SET phone_is_primary = 0 WHERE icai_membership_no = ?', [mno]);
    }
    const [[result]] = await pool.execute(
      `INSERT INTO tbl_member_phones
         (icai_membership_no, phone_country_code, phone_number, phone_number_full, phone_type, is_whatsapp, phone_status, phone_is_primary, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, ?)
       RETURNING phone_id`,
      [mno, phone_country_code, num, `${phone_country_code}${num}`, phone_type, is_whatsapp ? 1 : 0, is_primary ? 1 : 0, uid]
    );
    res.status(201).json({ phone_id: result.phone_id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add phone number' });
  }
});

// ── PATCH /api/voters/:id/phone/:phoneId ─────────────────────────────────────
// Body: { phone_status?, is_primary? } — toggle active/inactive or primary flag.
router.patch('/:id/phone/:phoneId', async (req, res) => {
  const { id: mno, phoneId } = req.params;
  const uid = req.user.user_id;
  const { phone_status, is_primary } = req.body;
  const PHONE_STATUSES = ['Active', 'Inactive'];
  if (phone_status !== undefined && !PHONE_STATUSES.includes(phone_status)) {
    return res.status(400).json({ error: 'Invalid phone_status' });
  }
  try {
    if (is_primary) {
      await pool.execute('UPDATE tbl_member_phones SET phone_is_primary = 0 WHERE icai_membership_no = ?', [mno]);
    }
    const updates = [];
    const params = [];
    if (phone_status !== undefined) { updates.push('phone_status = ?'); params.push(phone_status); }
    if (is_primary !== undefined)   { updates.push('phone_is_primary = ?'); params.push(is_primary ? 1 : 0); }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    updates.push('updated_by = ?', 'updated_at = NOW()');
    params.push(uid, phoneId, mno);
    await pool.execute(
      `UPDATE tbl_member_phones SET ${updates.join(', ')} WHERE phone_id = ? AND icai_membership_no = ?`,
      params
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update phone' });
  }
});

// ── POST /api/voters/:id/email ───────────────────────────────────────────────
// Add an email address. Body: { email_address, email_type, is_primary }
router.post('/:id/email', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  const { email_address, email_type, is_primary } = req.body;
  const EMAIL_TYPES = ['Personal', 'Company'];
  const addr = String(email_address || '').trim();
  if (!addr) return res.status(400).json({ error: 'email_address is required' });
  if (!EMAIL_TYPES.includes(email_type)) return res.status(400).json({ error: 'Invalid email_type' });
  try {
    if (is_primary) {
      await pool.execute('UPDATE tbl_member_emails SET email_is_primary = 0 WHERE icai_membership_no = ?', [mno]);
    }
    const [[result]] = await pool.execute(
      `INSERT INTO tbl_member_emails (icai_membership_no, email_address, email_type, email_status, email_is_primary, created_by)
       VALUES (?, ?, ?, 'Active', ?, ?)
       RETURNING email_id`,
      [mno, addr, email_type, is_primary ? 1 : 0, uid]
    );
    res.status(201).json({ email_id: result.email_id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add email address' });
  }
});

// ── PATCH /api/voters/:id/email/:emailId ─────────────────────────────────────
// Body: { email_status?, is_primary? }
router.patch('/:id/email/:emailId', async (req, res) => {
  const { id: mno, emailId } = req.params;
  const uid = req.user.user_id;
  const { email_status, is_primary } = req.body;
  const EMAIL_STATUSES = ['Active', 'Inactive'];
  if (email_status !== undefined && !EMAIL_STATUSES.includes(email_status)) {
    return res.status(400).json({ error: 'Invalid email_status' });
  }
  try {
    if (is_primary) {
      await pool.execute('UPDATE tbl_member_emails SET email_is_primary = 0 WHERE icai_membership_no = ?', [mno]);
    }
    const updates = [];
    const params = [];
    if (email_status !== undefined) { updates.push('email_status = ?'); params.push(email_status); }
    if (is_primary !== undefined)   { updates.push('email_is_primary = ?'); params.push(is_primary ? 1 : 0); }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    updates.push('updated_by = ?', 'updated_at = NOW()');
    params.push(uid, emailId, mno);
    await pool.execute(
      `UPDATE tbl_member_emails SET ${updates.join(', ')} WHERE email_id = ? AND icai_membership_no = ?`,
      params
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update email' });
  }
});

// ── POST /api/voters/:id/activity ───────────────────────────────────────────
// Log a new interaction (Call, Meeting, WhatsApp, SMS, Email, Event, Referral)
router.post('/:id/activity', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  const {
    activity_type,
    activity_date,
    description,
    followup_date,
    followup_note,
    preference_outcome,
  } = req.body;

  const allowed_types = ['Call','Meeting','WhatsApp','SMS','Email','Event','Referral'];
  if (!allowed_types.includes(activity_type))
    return res.status(400).json({ error: 'Invalid activity_type' });
  if (!activity_date)
    return res.status(400).json({ error: 'activity_date is required' });

  try {
    const [[result]] = await pool.execute(
      `INSERT INTO tbl_activity
         (activity_type, activity_date, description, followup_date, followup_note,
          preference_outcome, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING activity_id`,
      [activity_type, activity_date, description || null,
       followup_date || null, followup_note || null,
       preference_outcome || null, uid]
    );

    const activity_id = result.activity_id;

    // Link member as Primary participant
    await pool.execute(
      `INSERT INTO tbl_activity_participant (activity_id, icai_membership_no, participant_role, created_by)
       VALUES (?, ?, 'Primary', ?)`,
      [activity_id, mno, uid]
    );

    // If preference_outcome given, also update preference row
    if (preference_outcome) {
      await pool.execute(
        `INSERT INTO tbl_voter_preference (icai_membership_no, preference_tier, support_status, created_by)
         VALUES (?, 'un', ?, ?)
         ON CONFLICT (icai_membership_no) DO UPDATE SET support_status = EXCLUDED.support_status, updated_by = EXCLUDED.created_by`,
        [mno, preference_outcome, uid]
      );
    }

    res.status(201).json({ activity_id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// ── PATCH /api/voters/:id/cop ───────────────────────────────────────────────
// Update COP (Certificate of Practice) status on the ICAI fact table.
router.patch('/:id/cop', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  const { cop_status } = req.body;
  const allowed = ['Not Holding', 'Full Time', 'Part Time'];
  if (cop_status !== null && !allowed.includes(cop_status))
    return res.status(400).json({ error: 'Invalid cop_status' });

  try {
    const [[m]] = await pool.execute(
      'SELECT icai_membership_no FROM tbl_ca_member WHERE icai_membership_no = ?',
      [mno]
    );
    if (!m) return res.status(404).json({ error: 'Member not found' });

    await pool.execute(
      `UPDATE tbl_ca_member_fact
         SET cop_status = ?, updated_by = ?, updated_at = NOW()
       WHERE icai_membership_no = ?`,
      [cop_status || null, uid, mno]
    );
    res.json({ success: true, cop_status: cop_status || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update COP status' });
  }
});

// ── PUT /api/voters/:id/voting-history ──────────────────────────────────────
// Upsert one election-year voter-roll record into tbl_voter, then recompute PVS.
// Body: { election_year, voted: 'Y'|'N', voter_id?, voter_booth_no?, voter_type?, voter_sub_type? }
// tbl_voter.voter_status is now 'Voted'/'Silent'/'Postal' (it replaced the old
// separate `voted` Y/N column) — derived here from `voted` + voter_type rather
// than accepted directly from the client, since the frontend's legacy
// voter_status options ('Active'/'Inactive'/'Blocked') no longer apply.
// voter_id and voter_type are NOT NULL on tbl_voter (unlike the old
// tbl_voter_voting_history, where they were optional) — both are required
// when creating a voter-roll row for a member for the first time.
const VOTER_TYPES = ['Booth', 'Postal'];
const VOTER_SUB_TYPES = ['Booth-Region', 'Booth-Other Region', 'Postal-Domestic', 'Postal-Foreign'];

router.put('/:id/voting-history', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  const {
    election_year, voted,
    voter_id = null, voter_booth_no = null,
    voter_type = null, voter_sub_type = null,
  } = req.body;
  const yr = parseInt(election_year);
  if (!Number.isFinite(yr)) return res.status(400).json({ error: 'Valid election_year required' });
  if (!['Y', 'N'].includes(voted)) return res.status(400).json({ error: "voted must be 'Y' or 'N'" });
  if (voter_type && !VOTER_TYPES.includes(voter_type)) return res.status(400).json({ error: 'Invalid voter_type' });
  if (voter_sub_type && !VOTER_SUB_TYPES.includes(voter_sub_type)) return res.status(400).json({ error: 'Invalid voter_sub_type' });

  try {
    const [existing] = await pool.execute(
      'SELECT voter_id, voter_type FROM tbl_voter WHERE icai_membership_no = ? AND election_year = ?',
      [mno, yr]
    );
    const finalVoterId = voter_id || (existing[0] && existing[0].voter_id) || null;
    const finalVoterType = voter_type || (existing[0] && existing[0].voter_type) || null;
    if (!finalVoterId || !finalVoterType) {
      return res.status(400).json({ error: 'voter_id and voter_type are required to create a new voter-roll row' });
    }
    const voterStatus = voted === 'N' ? 'Silent' : (finalVoterType === 'Postal' ? 'Postal' : 'Voted');

    await pool.execute(
      `INSERT INTO tbl_voter
         (icai_membership_no, election_year, voter_id, boothno_new, voter_type, voter_sub_type, voter_status, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (icai_membership_no, election_year) DO UPDATE SET
         voter_id = COALESCE(EXCLUDED.voter_id, tbl_voter.voter_id),
         boothno_new = COALESCE(EXCLUDED.boothno_new, tbl_voter.boothno_new),
         voter_type = COALESCE(EXCLUDED.voter_type, tbl_voter.voter_type),
         voter_sub_type = COALESCE(EXCLUDED.voter_sub_type, tbl_voter.voter_sub_type),
         voter_status = EXCLUDED.voter_status,
         updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [mno, yr, finalVoterId, voter_booth_no, finalVoterType, voter_sub_type, voterStatus, uid, uid]
    );
    // Voting history feeds PVS — recompute this member.
    let pvsResult = null;
    try { pvsResult = await pvs.recalcVoter(mno, uid); } catch (e) { /* non-fatal */ }
    res.json({ success: true, pvs: pvsResult ? pvsResult.score : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update voting history' });
  }
});

// ── DELETE /api/voters/:id/voting-history/:year ─────────────────────────────
router.delete('/:id/voting-history/:year', async (req, res) => {
  const mno = req.params.id;
  const yr  = parseInt(req.params.year);
  const uid = req.user.user_id;
  try {
    await pool.execute(
      'DELETE FROM tbl_voter WHERE icai_membership_no = ? AND election_year = ?',
      [mno, yr]
    );
    try { await pvs.recalcVoter(mno, uid); } catch (e) { /* non-fatal */ }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete voting record' });
  }
});

// ── POST /api/voters/:id/work ───────────────────────────────────────────────
// Add a work-history entry. work_status = 'Active' means current — there is
// no separate is_current column, so the "current firm" join used everywhere
// (All Members, My Universe, dashboard) reads off work_status directly.
// designation is restricted to formal firm-partnership titles. org_reg_no is
// captured server-side as a point-in-time snapshot of the org's registration
// number — not trusted from the client. Year precision only (no from_date/to_date).
const WORK_DESIGNATIONS = ['Partner', 'Senior Partner', 'Engagement Partner', 'Managing Partner'];
const WORK_STATUSES = ['Active', 'Inactive', 'Not a member', 'Expired'];

router.post('/:id/work', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  const { org_id, designation, from_year, to_year, work_type, work_status, remark } = req.body;

  const WORK_TYPES = ['Employment', 'Articleship', 'Practice'];
  const orgId = parseInt(org_id);
  const current = work_status === 'Active';
  const fromYear = parseInt(from_year);
  const toYear = current ? null : parseInt(to_year);

  if (!Number.isFinite(orgId))                  return res.status(400).json({ error: 'org_id is required' });
  if (!WORK_DESIGNATIONS.includes(designation))  return res.status(400).json({ error: 'Invalid designation' });
  if (!Number.isFinite(fromYear))                return res.status(400).json({ error: 'Valid from_year is required' });
  if (!WORK_TYPES.includes(work_type))           return res.status(400).json({ error: 'Invalid work_type' });
  if (!WORK_STATUSES.includes(work_status))      return res.status(400).json({ error: 'Invalid work_status' });
  if (!current && !Number.isFinite(toYear))      return res.status(400).json({ error: 'to_year is required unless status is Active' });

  try {
    const [[org]] = await pool.execute('SELECT org_reg_no FROM tbl_org_details WHERE org_id = ?', [orgId]);
    if (!org) return res.status(404).json({ error: 'Organisation not found' });

    // A member can be an active partner at more than one firm at the same
    // time, so adding a new Active entry must NOT auto-close-out any other
    // active entry — only this row's own status is touched.
    const [[result]] = await pool.execute(
      `INSERT INTO tbl_work_history
         (icai_membership_no, org_id, org_reg_no, designation, from_year, to_year, work_type, work_status, remark, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING wh_id`,
      [mno, orgId, org.org_reg_no || null, designation, fromYear, toYear, work_type, work_status, remark || null, uid]
    );
    // Refresh the cached member_count for whichever org(s) this write touched
    // (see /api/dashboard/firm — reads this column instead of GROUP BY-ing
    // all 99k+ orgs on every page load).
    const orgIdsToRefresh = [orgId];
    for (const oid of orgIdsToRefresh) {
      await pool.execute(
        `UPDATE tbl_org_details SET member_count =
           (SELECT COUNT(DISTINCT icai_membership_no) FROM tbl_work_history WHERE org_id = ? AND work_status = 'Active')
         WHERE org_id = ?`,
        [oid, oid]
      );
    }
    res.status(201).json({ wh_id: result.wh_id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add work history entry' });
  }
});

// ── PATCH /api/voters/:id/work/:whId ────────────────────────────────────────
// Edit an existing work-history entry (used by the profile's row-level Edit
// action). Same validation/closeout rules as creating one.
router.patch('/:id/work/:whId', async (req, res) => {
  const mno = req.params.id;
  const whId = req.params.whId;
  const uid = req.user.user_id;
  const { org_id, designation, from_year, to_year, work_type, work_status, remark } = req.body;

  const WORK_TYPES = ['Employment', 'Articleship', 'Practice'];
  const orgId = parseInt(org_id);
  const current = work_status === 'Active';
  const fromYear = parseInt(from_year);
  const toYear = current ? null : parseInt(to_year);

  if (!Number.isFinite(orgId))                  return res.status(400).json({ error: 'org_id is required' });
  if (!WORK_DESIGNATIONS.includes(designation))  return res.status(400).json({ error: 'Invalid designation' });
  if (!Number.isFinite(fromYear))                return res.status(400).json({ error: 'Valid from_year is required' });
  if (!WORK_TYPES.includes(work_type))           return res.status(400).json({ error: 'Invalid work_type' });
  if (!WORK_STATUSES.includes(work_status))      return res.status(400).json({ error: 'Invalid work_status' });
  if (!current && !Number.isFinite(toYear))      return res.status(400).json({ error: 'to_year is required unless status is Active' });

  try {
    const [[existing]] = await pool.execute(
      'SELECT org_id FROM tbl_work_history WHERE wh_id = ? AND icai_membership_no = ?', [whId, mno]
    );
    if (!existing) return res.status(404).json({ error: 'Work history entry not found' });

    const [[org]] = await pool.execute('SELECT org_reg_no FROM tbl_org_details WHERE org_id = ?', [orgId]);
    if (!org) return res.status(404).json({ error: 'Organisation not found' });

    // A member can be an active partner at more than one firm at the same
    // time, so editing this row to Active must NOT auto-close-out any other
    // active entry — only this row's own status is touched.
    await pool.execute(
      `UPDATE tbl_work_history
         SET org_id = ?, org_reg_no = ?, designation = ?, from_year = ?, to_year = ?,
             work_type = ?, work_status = ?, remark = ?, updated_by = ?, updated_at = NOW()
       WHERE wh_id = ? AND icai_membership_no = ?`,
      [orgId, org.org_reg_no || null, designation, fromYear, toYear, work_type, work_status, remark || null, uid, whId, mno]
    );
    // Refresh member_count for both the old and new org (in case it changed).
    const orgIdsToRefresh = [...new Set([orgId, existing.org_id].filter(Boolean))];
    for (const oid of orgIdsToRefresh) {
      await pool.execute(
        `UPDATE tbl_org_details SET member_count =
           (SELECT COUNT(DISTINCT icai_membership_no) FROM tbl_work_history WHERE org_id = ? AND work_status = 'Active')
         WHERE org_id = ?`,
        [oid, oid]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update work history entry' });
  }
});

// ── POST /api/voters/:id/education ──────────────────────────────────────────
// Add an education-history entry. Articleship entries point at a firm (org_id);
// everything else points at an institution (institute_id).
router.post('/:id/education', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  let { edu_course_type, institute_id, org_id, qualification_name, from_year, to_year, edu_status = 'Completed' } = req.body;

  const COURSE_TYPES = ['CA Course', 'Articleship', 'University', 'Coaching', 'Other'];
  const EDU_STATUSES  = ['Active', 'Completed', 'Unknown'];

  if (!COURSE_TYPES.includes(edu_course_type)) return res.status(400).json({ error: 'Invalid edu_course_type' });
  if (!EDU_STATUSES.includes(edu_status))      edu_status = 'Completed';

  institute_id = institute_id ? parseInt(institute_id) : null;
  org_id       = org_id ? parseInt(org_id) : null;
  from_year    = from_year ? parseInt(from_year) : null;
  to_year      = to_year ? parseInt(to_year) : null;
  qualification_name = qualification_name ? String(qualification_name).trim() : null;

  if (edu_course_type === 'Articleship') {
    if (!Number.isFinite(org_id)) return res.status(400).json({ error: 'org_id (articleship firm) is required for Articleship' });
  } else if (!Number.isFinite(institute_id)) {
    return res.status(400).json({ error: 'institute_id is required for this course type' });
  }

  try {
    const [[result]] = await pool.execute(
      `INSERT INTO tbl_voter_education_history
         (icai_membership_no, edu_course_type, institute_id, org_id, qualification_name, from_year, to_year, edu_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING edu_hist_id`,
      [mno, edu_course_type, institute_id, org_id, qualification_name, from_year, to_year, edu_status, uid]
    );
    res.status(201).json({ edu_hist_id: result.edu_hist_id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add education history entry' });
  }
});

// ── PATCH /api/voters/:id/education/:eduHistId ──────────────────────────────
// Edit an existing education-history entry.
router.patch('/:id/education/:eduHistId', async (req, res) => {
  const mno = req.params.id;
  const eduHistId = req.params.eduHistId;
  const uid = req.user.user_id;
  let { edu_course_type, institute_id, org_id, qualification_name, from_year, to_year, edu_status = 'Completed' } = req.body;

  const COURSE_TYPES = ['CA Course', 'Articleship', 'University', 'Coaching', 'Other'];
  const EDU_STATUSES  = ['Active', 'Completed', 'Unknown'];

  if (!COURSE_TYPES.includes(edu_course_type)) return res.status(400).json({ error: 'Invalid edu_course_type' });
  if (!EDU_STATUSES.includes(edu_status))      edu_status = 'Completed';

  institute_id = institute_id ? parseInt(institute_id) : null;
  org_id       = org_id ? parseInt(org_id) : null;
  from_year    = from_year ? parseInt(from_year) : null;
  to_year      = to_year ? parseInt(to_year) : null;
  qualification_name = qualification_name ? String(qualification_name).trim() : null;

  if (edu_course_type === 'Articleship') {
    if (!Number.isFinite(org_id)) return res.status(400).json({ error: 'org_id (articleship firm) is required for Articleship' });
  } else if (!Number.isFinite(institute_id)) {
    return res.status(400).json({ error: 'institute_id is required for this course type' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE tbl_voter_education_history
         SET edu_course_type = ?, institute_id = ?, org_id = ?, qualification_name = ?,
             from_year = ?, to_year = ?, edu_status = ?, updated_by = ?, updated_at = NOW()
       WHERE edu_hist_id = ? AND icai_membership_no = ?`,
      [edu_course_type, institute_id, org_id, qualification_name, from_year, to_year, edu_status, uid, eduHistId, mno]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Education history entry not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update education history entry' });
  }
});

// ── Call list / meet list / competitor tags ─────────────────────────────────
// Simple toggleable flags, persisted (tbl_member_action_tag). One row per
// (member, tag_type) — toggling on inserts, toggling off deletes.
const TAG_TYPES = ['call_list', 'meet_list', 'competitor'];

// POST /api/voters/:id/tag — body: { tag_type, on: true|false }
router.post('/:id/tag', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  const { tag_type, on } = req.body;
  if (!TAG_TYPES.includes(tag_type)) return res.status(400).json({ error: 'Invalid tag_type' });
  try {
    if (on) {
      await pool.execute(
        `INSERT INTO tbl_member_action_tag (icai_membership_no, tag_type, created_by)
         VALUES (?, ?, ?) ON CONFLICT (icai_membership_no, tag_type) DO NOTHING`,
        [mno, tag_type, uid]
      );
    } else {
      await pool.execute(
        'DELETE FROM tbl_member_action_tag WHERE icai_membership_no = ? AND tag_type = ?',
        [mno, tag_type]
      );
    }
    res.json({ success: true, tag_type, on: !!on });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// POST /api/voters/bulk-tag — body: { ids: [icai_membership_no...], tag_type }
// Always adds (bulk actions are additive — use the profile toggle to remove one).
router.post('/bulk-tag', async (req, res) => {
  const uid = req.user.user_id;
  const { tag_type } = req.body;
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String).filter(Boolean) : [];
  if (!TAG_TYPES.includes(tag_type)) return res.status(400).json({ error: 'Invalid tag_type' });
  if (!ids.length) return res.status(400).json({ error: 'No member ids provided' });
  try {
    for (const mno of ids) {
      await pool.execute(
        `INSERT INTO tbl_member_action_tag (icai_membership_no, tag_type, created_by)
         VALUES (?, ?, ?) ON CONFLICT (icai_membership_no, tag_type) DO NOTHING`,
        [mno, tag_type, uid]
      );
    }
    res.json({ success: true, tagged: ids.length, tag_type });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to bulk-tag members' });
  }
});

// ── Free-text labels ─────────────────────────────────────────────────────────
// POST /api/voters/:id/label — body: { label_text }
router.post('/:id/label', async (req, res) => {
  const mno = req.params.id;
  const uid = req.user.user_id;
  const label_text = String(req.body.label_text || '').trim();
  if (!label_text) return res.status(400).json({ error: 'label_text is required' });
  try {
    const [existing] = await pool.execute(
      'SELECT label_id FROM tbl_member_label WHERE icai_membership_no = ? AND label_text = ?',
      [mno, label_text]
    );
    if (existing.length) return res.json({ success: true, label_id: existing[0].label_id, already_existed: true });
    const [[result]] = await pool.execute(
      'INSERT INTO tbl_member_label (icai_membership_no, label_text, created_by) VALUES (?, ?, ?) RETURNING label_id',
      [mno, label_text, uid]
    );
    res.status(201).json({ success: true, label_id: result.label_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add label' });
  }
});

// DELETE /api/voters/:id/label/:labelId
router.delete('/:id/label/:labelId', async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM tbl_member_label WHERE icai_membership_no = ? AND label_id = ?',
      [req.params.id, req.params.labelId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove label' });
  }
});

// POST /api/voters/bulk-label — body: { ids: [...], label_text }
router.post('/bulk-label', async (req, res) => {
  const uid = req.user.user_id;
  const label_text = String(req.body.label_text || '').trim();
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String).filter(Boolean) : [];
  if (!label_text) return res.status(400).json({ error: 'label_text is required' });
  if (!ids.length) return res.status(400).json({ error: 'No member ids provided' });
  try {
    for (const mno of ids) {
      const [existing] = await pool.execute(
        'SELECT label_id FROM tbl_member_label WHERE icai_membership_no = ? AND label_text = ?',
        [mno, label_text]
      );
      if (!existing.length) {
        await pool.execute(
          'INSERT INTO tbl_member_label (icai_membership_no, label_text, created_by) VALUES (?, ?, ?)',
          [mno, label_text, uid]
        );
      }
    }
    res.json({ success: true, labeled: ids.length, label_text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to bulk-label members' });
  }
});

module.exports = router;
