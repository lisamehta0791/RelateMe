// backend/routes/pvs.js
// Endpoints to (re)calculate Predictive Voter Scores.
const router = require('express').Router();
const pvs    = require('../services/pvs');

// ── POST /api/pvs/recalculate ───────────────────────────────────────────────
// Recomputes and stores PVS for all voters in the latest election year.
router.post('/recalculate', async (req, res) => {
  try {
    const updated = await pvs.recalcAll(req.user.user_id);
    res.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to recalculate PVS' });
  }
});

// ── POST /api/pvs/recalculate/:id ───────────────────────────────────────────
// Recompute a single member (id = icai_membership_no); returns the score + breakdown.
router.post('/recalculate/:id', async (req, res) => {
  try {
    const result = await pvs.recalcVoter(req.params.id, req.user.user_id);
    if (!result) return res.status(404).json({ error: 'Member not found' });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to recalculate PVS' });
  }
});

// ── GET /api/pvs/:id ────────────────────────────────────────────────────────
// Preview a member's score + breakdown WITHOUT persisting. id = icai_membership_no.
router.get('/:id', async (req, res) => {
  try {
    const result = await pvs.computeVoterScore(req.params.id);
    if (!result) return res.status(404).json({ error: 'Member not found' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute PVS' });
  }
});

module.exports = router;