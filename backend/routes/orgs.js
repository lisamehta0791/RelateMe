// backend/routes/orgs.js
// Organisation (firm/company) master CRUD used by the Firm-wise "Add Org" modal.
const router = require('express').Router();
const pool   = require('../config/db');

const ORG_TYPES      = ['CA', 'NON_CA'];
const ORG_STRUCTURES = ['PARTNERSHIP', 'SOLE_PROP', 'LLP', 'PRIVATE_LTD'];
const ORG_STATUSES   = ['ACTIVE', 'INACTIVE'];

// ── GET /api/orgs ───────────────────────────────────────────────────────────
// List organisations. Optional ?search= matches name / reg no. Always capped —
// the org master has 99k+ rows, so an unfiltered call must not return everything
// (used as a typeahead source for the "pick a firm" search-select fields).
router.get('/', async (req, res) => {
  const { search = '' } = req.query;
  const lim = Math.min(parseInt(req.query.limit) || 20, 50);
  try {
    let sql = `SELECT org_id, org_name, org_reg_no, org_type, org_structure, org_status, created_at
               FROM tbl_org_details`;
    const params = [];
    if (search) {
      sql += ' WHERE org_name ILIKE ? OR org_reg_no ILIKE ?';
      const s = `%${search}%`;
      params.push(s, s);
    }
    sql += ` ORDER BY org_name ASC LIMIT ${lim}`;
    const [rows] = await pool.execute(sql, params);
    res.json({ orgs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch organisations' });
  }
});

// ── POST /api/orgs ──────────────────────────────────────────────────────────
// Create an organisation.
// Rule: org_type = 'CA'  -> org_reg_no (FRN) is MANDATORY
//       org_type = 'NON_CA' -> org_reg_no optional
router.post('/', async (req, res) => {
  const uid = req.user.user_id;
  let {
    org_name,
    org_reg_no   = null,
    org_type,
    org_structure,
    org_status   = 'ACTIVE',
  } = req.body;

  org_name = (org_name || '').trim();
  org_reg_no = org_reg_no ? String(org_reg_no).trim() : null;

  if (!org_name)                          return res.status(400).json({ error: 'org_name is required' });
  if (!ORG_TYPES.includes(org_type))      return res.status(400).json({ error: 'Invalid org_type' });
  if (!ORG_STRUCTURES.includes(org_structure))
                                          return res.status(400).json({ error: 'Invalid org_structure' });
  if (!ORG_STATUSES.includes(org_status)) org_status = 'ACTIVE';

  // CA firm => registration number mandatory
  if (org_type === 'CA' && !org_reg_no) {
    return res.status(400).json({ error: 'Registration number (FRN) is mandatory for CA firms' });
  }

  try {
    // Reject duplicate reg no (column is UNIQUE; give a friendly message)
    if (org_reg_no) {
      const [dup] = await pool.execute(
        'SELECT org_id FROM tbl_org_details WHERE org_reg_no = ?', [org_reg_no]
      );
      if (dup.length) return res.status(409).json({ error: 'An organisation with this registration number already exists' });
    }

    const [[result]] = await pool.execute(
      `INSERT INTO tbl_org_details
         (org_name, org_reg_no, org_type, org_structure, org_status, created_by)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING org_id`,
      [org_name, org_reg_no, org_type, org_structure, org_status, uid]
    );
    res.status(201).json({ org_id: result.org_id, success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create organisation' });
  }
});

// ── PATCH /api/orgs/:id/status ───────────────────────────────────────────────
// Toggle ACTIVE/INACTIVE for an organisation.
router.patch('/:id/status', async (req, res) => {
  const uid = req.user.user_id;
  const { org_status } = req.body;
  if (!ORG_STATUSES.includes(org_status)) return res.status(400).json({ error: 'Invalid org_status' });
  try {
    const [result] = await pool.execute(
      'UPDATE tbl_org_details SET org_status = ?, updated_by = ?, updated_at = NOW() WHERE org_id = ?',
      [org_status, uid, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Organisation not found' });
    res.json({ success: true, org_status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update organisation status' });
  }
});

module.exports = router;