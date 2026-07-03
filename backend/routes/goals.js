// backend/routes/goals.js
// Campaign vote-target goals. Each POST inserts one snapshot row, which also
// serves as a change-history entry. "Current" goal = most recent row.
const router = require('express').Router();
const pool   = require('../config/db');

function currentElectionYear() {
  // Falls back to the calendar year if no voters are loaded yet.
  return null;
}

// ── GET /api/goals ────────────────────────────────────────────────────────────
// Returns the latest goal (current) + the full history (newest first).
router.get('/', async (req, res) => {
  try {
    // Resolve election year from voter data; default to current calendar year.
    const [[yr]] = await pool.execute(
      'SELECT MAX(election_year) AS y FROM tbl_voter'
    );
    const electionYear = yr && yr.y ? yr.y : new Date().getFullYear();

    const [rows] = await pool.execute(
      `SELECT goal_id, election_year, prev_quota, target_total,
              target_p1, target_p2, target_p3, target_p4, created_at
       FROM tbl_campaign_goal
       WHERE election_year = ?
       ORDER BY created_at DESC, goal_id DESC`,
      [electionYear]
    );

    res.json({
      election_year: electionYear,
      current: rows[0] || null,
      history: rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// ── POST /api/goals ───────────────────────────────────────────────────────────
// Saves a new snapshot. Body: prev_quota, target_total, target_p1..p4
router.post('/', async (req, res) => {
  const uid = req.user.user_id;
  const {
    prev_quota   = 0,
    target_total = 0,
    target_p1    = 0,
    target_p2    = 0,
    target_p3    = 0,
    target_p4    = 0,
  } = req.body;

  const toInt = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  try {
    const [[yr]] = await pool.execute(
      'SELECT MAX(election_year) AS y FROM tbl_voter'
    );
    const electionYear = yr && yr.y ? yr.y : new Date().getFullYear();

    const [[result]] = await pool.execute(
      `INSERT INTO tbl_campaign_goal
         (election_year, prev_quota, target_total, target_p1, target_p2, target_p3, target_p4, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING goal_id`,
      [electionYear, toInt(prev_quota), toInt(target_total),
       toInt(target_p1), toInt(target_p2), toInt(target_p3), toInt(target_p4), uid]
    );

    res.status(201).json({ goal_id: result.goal_id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save goals' });
  }
});

module.exports = router;