// backend/config/db.js
// Postgres (Neon) connection pool using `pg`, wrapped to stay drop-in
// compatible with the mysql2 call style every route file already uses:
// `const [rows] = await pool.execute('... WHERE x = ?', [params])`.
const { Pool, types } = require('pg');
require('dotenv').config();

// Return DATE/TIMESTAMP columns as plain 'YYYY-MM-DD'/'YYYY-MM-DD HH:MM:SS'
// strings instead of JS Date objects — same reasoning as the old mysql2
// `dateStrings: true` option this replaces. JS Date objects serialize to
// JSON as UTC ISO strings, which silently shifts the calendar day for any
// timezone east of UTC (e.g. IST) once the frontend reads just the date
// part — confirmed happening with DOB/DND/activity dates.
types.setTypeParser(1082, val => val); // DATE
types.setTypeParser(1114, val => val); // TIMESTAMP WITHOUT TIME ZONE
// BIGINT columns: pg returns these as strings by default (precision safety),
// but mysql2 returned them as JS numbers — every id column here comfortably
// fits in a safe integer, so parse to number to match the prior behavior
// (avoids "5" !== 5 surprises in any strict comparisons).
types.setTypeParser(20, val => parseInt(val, 10));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  // Default (10) was a bottleneck once routes started firing several queries
  // concurrently via Promise.all (the member profile route alone fires 11 at
  // once) — bumped so a single request's fan-out doesn't queue against itself.
  max: 20,
});

pool.on('error', err => console.error('Unexpected Postgres pool error:', err));

// Test connection on startup
pool.connect()
  .then(client => {
    console.log('✅  Postgres connected → Neon');
    client.release();
  })
  .catch(err => {
    console.error('❌  Postgres connection failed:', err.message);
    process.exit(1);
  });

// Translate mysql2-style '?' placeholders to Postgres's $1/$2/... — skips
// '?' found inside single-quoted string literals or '--' line comments
// (some queries have inline comments containing apostrophes, e.g. "profile's
// own work" — without comment-awareness, that apostrophe would be mistaken
// for the start of a string literal and desync every '?' after it).
function toPositionalParams(sql) {
  let out = '';
  let count = 0;
  let inString = false;
  let inLineComment = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (inLineComment) {
      out += ch;
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (!inString && ch === '-' && sql[i + 1] === '-') {
      inLineComment = true;
      out += ch;
    } else if (ch === "'") {
      inString = !inString;
      out += ch;
    } else if (ch === '?' && !inString) {
      count += 1;
      out += `$${count}`;
    } else {
      out += ch;
    }
  }
  return out;
}

// mysql2's pool.execute()/query() resolve to `[rows, fields]` for SELECT,
// or `[ResultSetHeader, undefined]` (with .affectedRows/.insertId) for a
// plain INSERT/UPDATE/DELETE. We replicate that two-shape contract: any
// statement that returns columns (SELECT, or INSERT/UPDATE/DELETE with an
// explicit RETURNING clause) yields a rows array; anything else yields an
// object exposing .affectedRows so existing `result.affectedRows` checks
// keep working unmodified.
async function run(sql, params = []) {
  const result = await pool.query(toPositionalParams(sql), params);
  if (result.fields && result.fields.length > 0) {
    return [result.rows, result.fields];
  }
  return [{ affectedRows: result.rowCount }, undefined];
}

module.exports = { execute: run, query: run };
