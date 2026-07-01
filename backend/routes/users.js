// backend/routes/users.js
// Team management: list users, approve, deactivate, update role.
// Only Super-Admin and Admin can manage users.
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

function requireAdmin(req, res, next) {
  if (!['Admin'].includes(req.user.user_role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// ── GET /api/users ────────────────────────────────────────────────────────────
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT user_id, email, full_name, user_role, approval_status, created_at
       FROM tbl_app_user ORDER BY created_at DESC`
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── PATCH /api/users/:id ──────────────────────────────────────────────────────
// Approve / Deactivate / change role
router.patch('/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { approval_status, user_role } = req.body;

  const allowed_status = ['Pending','Active','Deactivated'];
  const allowed_roles  = ['Admin','Candidate','Volunteer'];

  const updates = [];
  const params  = [];
  if (approval_status && allowed_status.includes(approval_status)) {
    updates.push('approval_status = ?'); params.push(approval_status);
  }
  if (user_role && allowed_roles.includes(user_role)) {
    updates.push('user_role = ?'); params.push(user_role);
  }
  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  updates.push('updated_by = ?', 'updated_at = NOW()');
  params.push(req.user.user_id, id);

  try {
    await pool.execute(
      `UPDATE tbl_app_user SET ${updates.join(', ')} WHERE user_id = ?`, params
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── PATCH /api/users/:id/password ───────────────────────────────────────────
// Admin sets a new password for a team member. There's no email service wired
// up yet, so this is the "forgot password" remedy for now — the admin sets a
// new password and tells the user out-of-band. Does not touch first_login_at,
// since the account isn't new.
router.patch('/:id/password', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: 'new_password must be at least 6 characters' });
  }

  try {
    const hash = await bcrypt.hash(new_password, 12);
    const [result] = await pool.execute(
      'UPDATE tbl_user_auth SET password_hash = ? WHERE user_id = ?',
      [hash, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
