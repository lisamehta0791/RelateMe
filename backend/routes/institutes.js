// backend/routes/institutes.js
// Institution (school/college/university) master CRUD used by the "Add Institution" modal.
const router = require('express').Router();
const pool   = require('../config/db');

const INSTITUTE_TYPES    = ['SCHOOL', 'COLLEGE', 'UNIVERSITY', 'INSTITUTE'];
const AFFILIATION_TYPES  = ['AFFILIATED', 'AUTONOMOUS', 'DEEMED'];
const INSTITUTE_STATUSES = ['ACTIVE', 'INACTIVE'];

// ── GET /api/institutes ──────────────────────────────────────────────────────
// List institutions. Optional ?search= matches name. Capped — used as a
// typeahead source for "pick an institution" search-select fields.
router.get('/', async (req, res) => {
  const { search = '' } = req.query;
  const lim = Math.min(parseInt(req.query.limit) || 20, 50);
  try {
    let sql = `SELECT i.institute_id, i.institute_name, i.institute_type, i.affiliation_type,
                      i.governing_body, i.established_year, i.institute_status, i.created_at,
                      COUNT(DISTINCT eh.icai_membership_no) AS member_count
               FROM tbl_institute_details i
               LEFT JOIN tbl_voter_education_history eh ON eh.institute_id = i.institute_id`;
    const params = [];
    if (search) {
      sql += ' WHERE i.institute_name ILIKE ?';
      params.push(`%${search}%`);
    }
    sql += ` GROUP BY i.institute_id ORDER BY i.institute_name ASC LIMIT ${lim}`;
    const [rows] = await pool.execute(sql, params);
    res.json({ institutes: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

// ── POST /api/institutes ─────────────────────────────────────────────────────
// Create an institution.
router.post('/', async (req, res) => {
  const uid = req.user.user_id;
  let {
    institute_name,
    institute_type,
    affiliation_type = null,
    governing_body    = null,
    established_year  = null,
    institute_status  = 'ACTIVE',
  } = req.body;

  institute_name = (institute_name || '').trim();
  governing_body = governing_body ? String(governing_body).trim() : null;
  affiliation_type = affiliation_type || null;
  established_year = established_year ? parseInt(established_year) : null;

  if (!institute_name)                            return res.status(400).json({ error: 'institute_name is required' });
  if (!INSTITUTE_TYPES.includes(institute_type))  return res.status(400).json({ error: 'Invalid institute_type' });
  if (affiliation_type && !AFFILIATION_TYPES.includes(affiliation_type))
                                                    return res.status(400).json({ error: 'Invalid affiliation_type' });
  if (established_year != null && !Number.isFinite(established_year))
                                                    return res.status(400).json({ error: 'Invalid established_year' });
  if (!INSTITUTE_STATUSES.includes(institute_status)) institute_status = 'ACTIVE';

  try {
    const [[result]] = await pool.execute(
      `INSERT INTO tbl_institute_details
         (institute_name, institute_type, affiliation_type, governing_body, established_year, institute_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING institute_id`,
      [institute_name, institute_type, affiliation_type, governing_body, established_year, institute_status, uid]
    );
    res.status(201).json({ institute_id: result.institute_id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create institution' });
  }
});

// ── PATCH /api/institutes/:id/status ─────────────────────────────────────────
// Toggle ACTIVE/INACTIVE for an institution.
router.patch('/:id/status', async (req, res) => {
  const uid = req.user.user_id;
  const { institute_status } = req.body;
  if (!INSTITUTE_STATUSES.includes(institute_status)) return res.status(400).json({ error: 'Invalid institute_status' });
  try {
    const [result] = await pool.execute(
      'UPDATE tbl_institute_details SET institute_status = ?, updated_by = ?, updated_at = NOW() WHERE institute_id = ?',
      [institute_status, uid, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Institute not found' });
    res.json({ success: true, institute_status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update institute status' });
  }
});

module.exports = router;
