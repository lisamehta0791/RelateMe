// backend/middleware/auth.js
// Validates Bearer JWT on every protected route.
const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

module.exports = async function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }

  // Attach the full user row (so routes can check role / approval_status)
  const [rows] = await pool.execute(
    'SELECT user_id, email, full_name, user_role, approval_status FROM tbl_app_user WHERE user_id = ?',
    [payload.user_id]
  );
  if (!rows.length || rows[0].approval_status !== 'Active') {
    return res.status(403).json({ error: 'Account not active' });
  }

  req.user = rows[0];
  next();
};
