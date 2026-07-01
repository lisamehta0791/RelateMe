// backend/routes/universe.js
// Persistent per-user member universe. Each logged-in user maintains their own
// working set of members (stored in tbl_user_universe, keyed by icai_membership_no
// — member identity, not a voter-roll row, which may not exist for everyone).
// On add, the member's PVS is (re)calculated so universe members always have a
// fresh score.
const router = require('express').Router();
const pool   = require('../config/db');
const pvs    = require('../services/pvs');

// ── GET /api/universe ───────────────────────────────────────────────────────
// Returns the list of icai_membership_no's in the current user's universe.
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT icai_membership_no FROM tbl_user_universe WHERE user_id = ?',
      [req.user.user_id]
    );
    res.json({ ids: rows.map(r => r.icai_membership_no) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch universe' });
  }
});

// ── POST /api/universe/:mno ─────────────────────────────────────────────────
// Add a member to the current user's universe (idempotent) + recalc PVS.
router.post('/:mno', async (req, res) => {
  const mno = req.params.mno;
  const uid = req.user.user_id;
  try {
    await pool.execute(
      `INSERT INTO tbl_user_universe (user_id, icai_membership_no)
       VALUES (?, ?)
       ON CONFLICT (user_id, icai_membership_no) DO NOTHING`,
      [uid, mno]
    );
    // Refresh PVS for this member (non-fatal if it fails)
    let pvsResult = null;
    try { pvsResult = await pvs.recalcVoter(mno, uid); } catch (e) { /* ignore */ }
    res.json({ success: true, in_universe: true, pvs: pvsResult ? pvsResult.score : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to universe' });
  }
});

// ── POST /api/universe (bulk) ───────────────────────────────────────────────
// Body: { ids: [icai_membership_no, ...] }
router.post('/', async (req, res) => {
  const uid = req.user.user_id;
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String).filter(Boolean) : [];
  if (!ids.length) return res.status(400).json({ error: 'No member ids provided' });
  try {
    for (const mno of ids) {
      await pool.execute(
        `INSERT INTO tbl_user_universe (user_id, icai_membership_no)
         VALUES (?, ?) ON CONFLICT (user_id, icai_membership_no) DO NOTHING`,
        [uid, mno]
      );
      try { await pvs.recalcVoter(mno, uid); } catch (e) { /* ignore */ }
    }
    res.json({ success: true, added: ids.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to universe' });
  }
});

// ── DELETE /api/universe/:mno ───────────────────────────────────────────────
router.delete('/:mno', async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM tbl_user_universe WHERE user_id = ? AND icai_membership_no = ?',
      [req.user.user_id, req.params.mno]
    );
    res.json({ success: true, in_universe: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove from universe' });
  }
});

module.exports = router;





