// backend/routes/auth.js
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool     = require('../config/db');
const auth     = require('../middleware/auth');

// ── POST /api/auth/register ────────────────────────────────────────────────
// Creates a new user (starts with approval_status = 'Pending').
// A Super-Admin must activate the account before the user can log in.
router.post('/register', async (req, res) => {
  const { email, full_name, password, user_role } = req.body;
  if (!email || !full_name || !password) {
    return res.status(400).json({ error: 'email, full_name and password are required' });
  }

  const allowedRoles = ['Admin','Candidate','Volunteer'];
  const role = allowedRoles.includes(user_role) ? user_role : 'Volunteer';

  try {
    const [existing] = await pool.execute(
      'SELECT user_id FROM tbl_app_user WHERE email = ?', [email]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash    = await bcrypt.hash(password, 12);
    const user_id = uuidv4();

    // NOTE: passwords are stored in a separate simple table because tbl_app_user
    // (CONFIRMED) has no password column. We create it below on first run.
    await pool.execute(
      `INSERT INTO tbl_app_user (user_id, email, full_name, user_role, approval_status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [user_id, email, full_name, role]
    );
    await pool.execute(
      `INSERT INTO tbl_user_auth (user_id, password_hash) VALUES (?, ?)`,
      [user_id, hash]
    );

    res.status(201).json({ message: 'Registration successful. Awaiting admin approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ── POST /api/auth/check-email ──────────────────────────────────────────────
// Drives the two-step sign-in: email first, then password. Tells the frontend
// whether to show the "Forgot password" link — hidden for an account that has
// never logged in (they were just emailed credentials; nothing to recover yet).
// Deliberately does not reveal whether the email exists at all.
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  try {
    const [rows] = await pool.execute(
      `SELECT a.first_login_at
       FROM tbl_app_user u
       JOIN tbl_user_auth a ON a.user_id = u.user_id
       WHERE u.email = ?`,
      [email]
    );
    const show_forgot_password = rows.length > 0 && rows[0].first_login_at != null;
    res.json({ show_forgot_password });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT u.user_id, u.email, u.full_name, u.user_role, u.approval_status,
              a.password_hash, a.first_login_at, a.onboarding_completed_at
       FROM tbl_app_user u
       JOIN tbl_user_auth a ON a.user_id = u.user_id
       WHERE u.email = ?`,
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    if (user.approval_status === 'Pending') {
      return res.status(403).json({ error: 'Account pending admin approval' });
    }
    if (user.approval_status === 'Deactivated') {
      return res.status(403).json({ error: 'Account deactivated' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.first_login_at) {
      await pool.execute('UPDATE tbl_user_auth SET first_login_at = NOW() WHERE user_id = ?', [user.user_id]);
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.user_role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        user_id:     user.user_id,
        email:       user.email,
        full_name:   user.full_name,
        user_role:   user.user_role,
      },
      needs_onboarding: !user.onboarding_completed_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ── POST /api/auth/complete-onboarding ──────────────────────────────────────
// Marks the first-run setup wizard as finished, so future logins skip straight
// to My Universe instead of the wizard.
router.post('/complete-onboarding', auth, async (req, res) => {
  try {
    await pool.execute(
      'UPDATE tbl_user_auth SET onboarding_completed_at = NOW() WHERE user_id = ?',
      [req.user.user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────
// Returns the logged-in user's profile. Requires valid JWT (handled by caller).
// Also reports needs_onboarding so a page refresh mid-wizard still gates correctly.
router.get('/me', auth, async (req, res) => {
  try {
    const [[row]] = await pool.execute(
      'SELECT onboarding_completed_at FROM tbl_user_auth WHERE user_id = ?',
      [req.user.user_id]
    );
    res.json({ user: req.user, needs_onboarding: !(row && row.onboarding_completed_at) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
