// backend/server.js
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const authMiddleware = require('./middleware/auth');

// Route modules
const authRouter      = require('./routes/auth');
const votersRouter    = require('./routes/voters');
const dashboardRouter = require('./routes/dashboard');
const usersRouter     = require('./routes/users');
const goalsRouter     = require('./routes/goals');
const orgsRouter      = require('./routes/orgs');
const institutesRouter = require('./routes/institutes');
const universeRouter  = require('./routes/universe');
const pvsRouter       = require('./routes/pvs');
const onboardingRouter = require('./routes/onboarding');

const app  = express();
const PORT = process.env.PORT || 4000;

// ── CORS ─────────────────────────────────────────────────────────────────────
// In development, reflect any origin (file://, localhost, 127.0.0.1, LAN IP) so
// the local frontend always reaches the API. In production, restrict to FRONTEND_URL.
app.use(cors({
  origin: function(origin, callback) {
    if (process.env.NODE_ENV === 'production') {
      if (!origin || origin === process.env.FRONTEND_URL) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    }
    return callback(null, true);
  },
  credentials: true,
}));

// ── Body parser ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Public routes (no JWT) ────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Protected routes (JWT required) ──────────────────────────────────────────
app.use('/api/dashboard', authMiddleware, dashboardRouter);
app.use('/api/voters',    authMiddleware, votersRouter);
app.use('/api/users',     authMiddleware, usersRouter);
app.use('/api/goals',     authMiddleware, goalsRouter);
app.use('/api/orgs',      authMiddleware, orgsRouter);
app.use('/api/institutes', authMiddleware, institutesRouter);
app.use('/api/universe',  authMiddleware, universeRouter);
app.use('/api/pvs',       authMiddleware, pvsRouter);
app.use('/api/onboarding', authMiddleware, onboardingRouter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }));

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  RelateMe API listening on http://localhost:${PORT}`);
});