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
  } = req.body;

  if (is_articleship_principal !== null && !['Y','N'].includes(is_articleship_principal)) {
    return res.status(400).json({ error: 'is_articleship_principal must be Y or N' });
  }

  try {
    await pool.execute(
      `INSERT INTO tbl_candidate_onboarding_profile
         (user_id, seeking_vote_cities, icai_branch, practice_cities, past_firm_org_ids,
          is_articleship_principal, articleship_student_count, coaching_institutes,
          ca_final_year, graduation_college, outreach_start_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save onboarding profile' });
  }
});

module.exports = router;
