// backend/services/pvs.js
// ============================================================================
//  Predictive Voter Score (PVS) engine.
//  Implements the campaign scoring table. Each voter starts at a Base Score and
//  accumulates points across independent parameters. The total is clamped to
//  0..1000 and stored in tbl_voter_preference.pvs_score (previous value is
//  shifted into pvs_score_previous so momentum/delta can be shown).
//
//  Data availability note:
//    - Branch Density and Firm Size source data is NOT in the DB yet, so those
//      parameters resolve to the 0-point bucket until the data is added. The
//      bucket logic is implemented and ready.
//    - CPE Speaker is intentionally ON HOLD (contributes 0) per current scope.
//    - Everything else is derived from existing tables.
// ============================================================================

const pool = require('../config/db');

// ── Points tables ───────────────────────────────────────────────────────────
const BASE_SCORE = 100;

// CA vintage (years since associate/enrollment)
function caVintagePoints(years) {
  if (years == null)      return 0;
  if (years < 5)          return 0;
  if (years <= 14)        return 50;
  if (years <= 24)        return 80;
  return 100; // 25+
}

// Practice type (derived from current work_type)
//   Practice / Firm Partner = 60 ; Mixed / Consultant = 40 ; Industry/Employment = 0
function practiceTypePoints(workType) {
  switch (workType) {
    case 'Practice':   return 60;
    case 'Consultant': return 40; // not a current enum value; reserved
    case 'Articleship':return 40; // dual/independent-ish
    case 'Employment': return 0;
    default:           return 0;
  }
}

// Gender + female voting behaviour
//   Male = 0
//   Female + voted all 3 = 30 ; 2/3 = 15 ; 1/3 = 10 ; not voted = 0
function genderPoints(gender, votedCountLast3) {
  if (gender !== 'F') return 0;
  if (votedCountLast3 >= 3) return 30;
  if (votedCountLast3 === 2) return 15;
  if (votedCountLast3 === 1) return 10;
  return 0;
}

// Branch density (source data not in DB yet -> defaults to Low/Unknown = 0)
//   Low/Unknown = 0 ; Medium = 30 ; High = 50
function branchDensityPoints(tier) {
  switch (tier) {
    case 'High':   return 50;
    case 'Medium': return 30;
    default:       return 0;
  }
}

// Voting history
//   Never = 0 ; Voted once = 80 ; Regular (all 3) = 150
function votingHistoryPoints(votedCountLast3) {
  if (votedCountLast3 >= 3) return 150;
  if (votedCountLast3 >= 1) return 80;
  return 0;
}

// Postal voter
//   Walk-in (No) = 30 ; Postal (Yes) = 0
function postalPoints(voterType) {
  return voterType === 'Postal' ? 0 : 30;
}

// CPE speaker — ON HOLD: contributes 0 for now.
function cpePoints() {
  return 0;
}

// Firm size (source headcount not in DB yet -> defaults to smallest bucket = 10
//  only when we actually know the firm; with no data we contribute 0)
//   1-5 = 10 ; 5-15 = 30 ; 15-30 = 50 ; 30-50 = 80 ; 50+ = 100
function firmSizePoints(size) {
  if (size == null) return 0;
  if (size <= 5)    return 10;
  if (size <= 15)   return 30;
  if (size <= 30)   return 50;
  if (size <= 50)   return 80;
  return 100;
}

// Membership grade
//   FCA = 80 ; ACA = 40 ; Non-CA = 0
function gradePoints(grade) {
  if (grade === 'FCA') return 80;
  if (grade === 'ACA') return 40;
  return 0;
}

// ICAI / council / branch role points. We take the single HIGHEST-value role a
// voter holds (roles don't stack — the strongest standing wins).
const ROLE_POINTS = [
  { match: /central council member/i,                value: 500 },
  { match: /past central council/i,                  value: 400 },
  { match: /pre.?previous central council/i,         value: 300 },
  { match: /regional council member|rcm/i,           value: 300 },
  { match: /past regional council/i,                 value: 200 },
  { match: /pre.?previous regional council/i,        value: 100 },
  { match: /branch (chairman|president)/i,           value: 120 },
  { match: /past branch (chairman|president)/i,      value: 60  },
  { match: /vice.?(chairman|president)/i,            value: 90  },
  { match: /branch secretary/i,                      value: 80  },
  { match: /branch treasurer/i,                      value: 70  },
  { match: /committee member.*co.?opted|co.?opted/i, value: 30  },
  { match: /past branch committee/i,                 value: 25  },
  { match: /branch committee member|committee/i,     value: 60  },
];

function rolePoints(roleRows) {
  let best = 0;
  for (const r of roleRows || []) {
    const text = `${r.role_type || ''} ${r.role_value || ''}`;
    for (const rule of ROLE_POINTS) {
      if (rule.match.test(text) && rule.value > best) best = rule.value;
    }
  }
  return best;
}

// ── Per-voter score computation ───────────────────────────────────────────
// Pulls everything needed for one member and returns { score, breakdown }.
// `mno` is icai_membership_no — member identity, not a voter-roll row, which
// may not exist for every member.
async function computeVoterScore(mno) {
  // Core member + fact, with the latest voter-roll row (if any) left-joined in
  // for voter_type — members with no voter row yet still get scored.
  const [[core]] = await pool.execute(
    `SELECT m.icai_membership_no, v.voter_type, v.election_year,
            m.member_gender,
            f.membership_grade, f.is_fca_member, f.associate_year,
            f.member_enrollment_date
     FROM tbl_ca_member m
     JOIN tbl_ca_member_fact f ON f.icai_membership_no = m.icai_membership_no
     LEFT JOIN tbl_voter_voting_history v ON v.icai_membership_no = m.icai_membership_no
                           AND v.election_year = (SELECT MAX(election_year) FROM tbl_voter_voting_history)
     WHERE m.icai_membership_no = ?`,
    [mno]
  );
  if (!core) return null;

  // CA vintage in years (prefer associate_year like "A2014" or a 4-digit year)
  let vintageYears = null;
  const yr = parseInt(String(core.associate_year || '').replace(/\D/g, ''), 10);
  if (Number.isFinite(yr) && yr > 1900) {
    vintageYears = new Date().getFullYear() - yr;
  } else if (core.member_enrollment_date) {
    vintageYears = new Date().getFullYear() - new Date(core.member_enrollment_date).getFullYear();
  }

  // Current work type (practice type)
  const [[work]] = await pool.execute(
    `SELECT work_type FROM tbl_work_history
     WHERE icai_membership_no = ? AND work_status = 'Active'
     ORDER BY from_year DESC LIMIT 1`,
    [mno]
  );

  // Voting history — count "voted=Y" in the last 3 election years on record
  const [vh] = await pool.execute(
    `SELECT voted FROM tbl_voter_voting_history
     WHERE icai_membership_no = ?
     ORDER BY election_year DESC LIMIT 3`,
    [mno]
  );
  const votedCountLast3 = vh.filter(r => r.voted === 'Y').length;

  // ICAI roles
  const [roles] = await pool.execute(
    `SELECT role_type, role_value FROM tbl_voter_icai_roles
     WHERE icai_membership_no = ?`,
    [mno]
  );

  // Firm size — not tracked yet; left null so it contributes 0.
  const firmSize = null;
  // Branch density — not tracked yet; left null so it contributes 0.
  const densityTier = null;

  const breakdown = {
    base:          BASE_SCORE,
    ca_vintage:    caVintagePoints(vintageYears),
    practice_type: practiceTypePoints(work && work.work_type),
    gender:        genderPoints(core.member_gender, votedCountLast3),
    branch_density:branchDensityPoints(densityTier),
    voting_history:votingHistoryPoints(votedCountLast3),
    postal:        postalPoints(core.voter_type),
    cpe:           cpePoints(),
    firm_size:     firmSizePoints(firmSize),
    grade:         gradePoints(core.membership_grade),
    roles:         rolePoints(roles),
  };

  let score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  score = Math.max(0, Math.min(1000, score));

  return { score, breakdown };
}

// ── Persist a freshly-computed score ────────────────────────────────────────
// Shifts the existing pvs_score into pvs_score_previous, then writes the new one.
async function saveVoterScore(mno, score, uid) {
  const [[existing]] = await pool.execute(
    'SELECT pref_id, pvs_score FROM tbl_voter_preference WHERE icai_membership_no = ?',
    [mno]
  );

  if (existing) {
    await pool.execute(
      `UPDATE tbl_voter_preference
         SET pvs_score_previous = pvs_score,
             pvs_score = ?,
             updated_by = ?, updated_at = NOW()
       WHERE icai_membership_no = ?`,
      [score, uid || null, mno]
    );
  } else {
    await pool.execute(
      `INSERT INTO tbl_voter_preference
         (icai_membership_no, preference_tier, support_status, pvs_score, created_by)
       VALUES (?, 'un', 'Unknown', ?, ?)`,
      [mno, score, uid || null]
    );
  }
}

// Compute + persist for one member; returns the new score. `mno` is icai_membership_no.
async function recalcVoter(mno, uid) {
  const result = await computeVoterScore(mno);
  if (!result) return null;
  await saveVoterScore(mno, result.score, uid);
  return result;
}

// Recompute for every CA member (not just those with a voter-roll row). Returns count updated.
async function recalcAll(uid) {
  const [rows] = await pool.execute('SELECT icai_membership_no FROM tbl_ca_member');
  let updated = 0;
  for (const r of rows) {
    const res = await recalcVoter(r.icai_membership_no, uid);
    if (res) updated += 1;
  }
  return updated;
}

module.exports = {
  computeVoterScore,
  recalcVoter,
  recalcAll,
  BASE_SCORE,
};