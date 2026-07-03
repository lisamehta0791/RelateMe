// backend/routes/dashboard.js
const router = require('express').Router();
const pool   = require('../config/db');

// City/Organisation/Institute list pages' search box supports picking several
// exact options at once (comma-separated from the frontend's multi-select
// dropdown) as well as a single free-text substring — >1 value means the
// user picked specific items from the suggestion list, so match them exactly
// (IN) rather than ILIKE, which would otherwise also match unrelated partial
// substrings shared between the picked names.
function multiSearchCondition(col, searchParam, params) {
  const values = String(searchParam).split(',').map(s => s.trim()).filter(Boolean);
  if (values.length > 1) {
    params.push(...values);
    return `${col} IN (${values.map(() => '?').join(',')})`;
  } else if (values.length === 1) {
    params.push(`%${values[0]}%`);
    return `${col} ILIKE ?`;
  }
  return null;
}

// ── GET /api/dashboard ───────────────────────────────────────────────────────
// KPI cards + preference funnel. Anchored on tbl_ca_member so members with no
// voter-roll row loaded yet are still counted.
router.get('/', async (req, res) => {
  try {
    const [[totals]] = await pool.execute(`
      SELECT
        COUNT(*)                                                         AS total_voters,
        SUM(CASE WHEN vp.preference_tier = 'p1' THEN 1 ELSE 0 END)     AS p1_count,
        SUM(CASE WHEN vp.preference_tier = 'p2' THEN 1 ELSE 0 END)     AS p2_count,
        SUM(CASE WHEN vp.preference_tier = 'p3' THEN 1 ELSE 0 END)     AS p3_count,
        SUM(CASE WHEN vp.preference_tier = 'p4' THEN 1 ELSE 0 END)     AS p4_count,
        SUM(CASE WHEN vp.preference_tier IS NULL
                   OR vp.preference_tier = 'un' THEN 1 ELSE 0 END)     AS un_count,
        SUM(CASE WHEN ap.ap_id IS NOT NULL THEN 1 ELSE 0 END)          AS contacted
      FROM tbl_ca_member m
      LEFT JOIN tbl_voter_preference vp ON vp.icai_membership_no = m.icai_membership_no
      LEFT JOIN (
        SELECT DISTINCT icai_membership_no, MIN(ap_id) AS ap_id
        FROM tbl_activity_participant GROUP BY icai_membership_no
      ) ap ON ap.icai_membership_no = m.icai_membership_no
    `);

    // Activities in the last 7 days
    const [recentActivities] = await pool.execute(`
      SELECT a.activity_type, a.activity_date, a.description,
             m.member_display_name AS voter_name
      FROM tbl_activity a
      JOIN tbl_activity_participant ap ON ap.activity_id = a.activity_id
      JOIN tbl_ca_member m ON m.icai_membership_no = ap.icai_membership_no
      WHERE a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY a.activity_date DESC
      LIMIT 10
    `);

    res.json({ kpi: totals, recent_activities: recentActivities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Dashboard fetch failed' });
  }
});

// Clamp page/limit query params to sane bounds; returns { lim, offset, pg }.
function pagingParams(req, defaultLimit = 50) {
  const lim = Math.max(1, Math.min(parseInt(req.query.limit) || defaultLimit, 500));
  const pg  = Math.max(1, parseInt(req.query.page) || 1);
  return { lim, offset: (pg - 1) * lim, pg };
}

// Columns the frontend can sort summary tables (city/firm/institute) by.
const SUMMARY_SORT_COLUMNS = ['total', 'in_universe', 'not_in_universe', 'p1', 'p2', 'p3', 'p4', 'un'];
function parseSummarySort(req, defaultCol = 'total') {
  const sort = SUMMARY_SORT_COLUMNS.includes(req.query.sort) ? req.query.sort : defaultCol;
  const dir = req.query.dir === 'asc' ? 'ASC' : 'DESC';
  return { sort, dir };
}

// ── GET /api/dashboard/city ──────────────────────────────────────────────────
// Preference breakdown grouped by city. City comes from the booth chain
// (tbl_voter.boothno_new -> tbl_booth_master -> tbl_booth_address_master),
// not from the member directly — members with no voter-roll row have no city yet.
// Paginated — page/limit query params (default 50/page).
router.get('/city', async (req, res) => {
  try {
    const uid = req.user.user_id;
    const { lim, offset, pg } = pagingParams(req);
    const { search = '' } = req.query;
    const { sort, dir } = parseSummarySort(req);
    const params = [uid];
    let JOINS = `
      FROM tbl_ca_member m
      LEFT JOIN tbl_voter v ON v.icai_membership_no = m.icai_membership_no
                            AND v.election_year = (SELECT MAX(election_year) FROM tbl_voter)
      LEFT JOIN tbl_booth_master bm          ON bm.election_year = v.election_year AND bm.boothno = v.boothno_new
      LEFT JOIN tbl_booth_address_master bam ON bam.booth_address_id = bm.booth_address_id
      LEFT JOIN tbl_user_universe uu ON uu.icai_membership_no = m.icai_membership_no AND uu.user_id = ?
      LEFT JOIN tbl_voter_preference vp ON vp.icai_membership_no = m.icai_membership_no
      WHERE bam.booth_city IS NOT NULL
    `;
    if (search) { const c = multiSearchCondition('bam.booth_city', search, params); if (c) JOINS += ' AND ' + c; }
    const [rows] = await pool.execute(`
      SELECT
        bam.booth_city                                                   AS city,
        COUNT(*)                                                         AS total,
        SUM(CASE WHEN uu.icai_membership_no IS NOT NULL THEN 1 ELSE 0 END) AS in_universe,
        SUM(CASE WHEN uu.icai_membership_no IS NULL THEN 1 ELSE 0 END)     AS not_in_universe,
        SUM(CASE WHEN vp.preference_tier = 'p1' THEN 1 ELSE 0 END) AS p1,
        SUM(CASE WHEN vp.preference_tier = 'p2' THEN 1 ELSE 0 END) AS p2,
        SUM(CASE WHEN vp.preference_tier = 'p3' THEN 1 ELSE 0 END) AS p3,
        SUM(CASE WHEN vp.preference_tier = 'p4' THEN 1 ELSE 0 END) AS p4,
        SUM(CASE WHEN vp.preference_tier IS NULL OR vp.preference_tier = 'un' THEN 1 ELSE 0 END) AS un
      ${JOINS}
      GROUP BY bam.booth_city
      ORDER BY ${sort} ${dir}
      LIMIT ${lim} OFFSET ${offset}
    `, params);
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM (SELECT bam.booth_city ${JOINS} GROUP BY bam.booth_city) t`, params
    );
    res.json({ cities: rows, total, page: pg, limit: lim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'City summary fetch failed' });
  }
});

// ── GET /api/dashboard/city-options ──────────────────────────────────────────
// City picker for the onboarding wizard. Unlike /city (anchored on
// tbl_ca_member, so a city only shows up once it has an actual member/voter
// row), this is anchored on tbl_booth_address_master so every real city shows
// up as a pickable option even if no voter data has been loaded for it yet.
// Not paginated — the master list is only ~100 cities.
router.get('/city-options', async (req, res) => {
  try {
    const { search = '' } = req.query;
    const params = [];
    let WHERE = `WHERE bam.booth_city IS NOT NULL AND bam.booth_city != ''`;
    if (search) { WHERE += ' AND bam.booth_city ILIKE ?'; params.push(`%${search}%`); }
    const [rows] = await pool.execute(`
      SELECT bam.booth_city AS city, COUNT(DISTINCT m.icai_membership_no) AS total
      FROM tbl_booth_address_master bam
      LEFT JOIN tbl_booth_master bm ON bm.booth_address_id = bam.booth_address_id
      LEFT JOIN tbl_voter v         ON v.election_year = bm.election_year AND v.boothno_new = bm.boothno
      LEFT JOIN tbl_ca_member m     ON m.icai_membership_no = v.icai_membership_no
      ${WHERE}
      GROUP BY bam.booth_city
      ORDER BY bam.booth_city ASC
      LIMIT 300
    `, params);
    res.json({ cities: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch city options' });
  }
});

// ── GET /api/dashboard/firm ──────────────────────────────────────────────────
// Paginated — page/limit query params (default 50/page).
// Sorts/paginates off tbl_org_details.member_count, a cached count kept in
// sync by POST /api/voters/:id/work — at 99k+ orgs, GROUP BY-ing the whole
// work-history JOIN on every page load was the slow path (~1s/page even after
// trimming the count query); reading a pre-aggregated column is just an
// indexed sort. The p1-p4 preference breakdown is still computed live, but
// only for the ~50 orgs on the current page, not all 99k.
const ORG_TYPE_FILTERS = ['CA', 'NON_CA'];
const ORG_STATUS_FILTERS = ['ACTIVE', 'INACTIVE'];

router.get('/firm', async (req, res) => {
  try {
    const uid = req.user.user_id;
    const { lim, offset, pg } = pagingParams(req);
    const { search = '', type = '', status = '' } = req.query;
    const { sort, dir } = parseSummarySort(req);
    const params = [];
    const conditions = [];
    if (search) { const c = multiSearchCondition('o.org_name', search, params); if (c) conditions.push(c); }
    if (ORG_TYPE_FILTERS.includes(type)) { conditions.push('o.org_type = ?'); params.push(type); }
    if (ORG_STATUS_FILTERS.includes(status)) { conditions.push('o.org_status = ?'); params.push(status); }
    const WHERE = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    // The org master's own primary key is the grouping unit, so a plain count
    // on tbl_org_details (no join needed) is the total number of firms.
    const countWhere = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM tbl_org_details o${countWhere}`, params);

    let firms;
    if (sort === 'total') {
      // Fast path — sort/paginate off the cached member_count column (no
      // GROUP BY across all 99k+ orgs), then compute the breakdown only for
      // the ~50 orgs on this page.
      const [rows] = await pool.execute(`
        SELECT o.org_id, o.org_name AS firm, o.org_reg_no, o.org_type, o.org_structure, o.org_status, o.member_count AS total
        FROM tbl_org_details o
        ${WHERE}
        ORDER BY o.member_count ${dir}
        LIMIT ${lim} OFFSET ${offset}
      `, params);
      const orgIds = rows.map(r => r.org_id);
      let breakdownByOrg = {};
      if (orgIds.length) {
        const [bRows] = await pool.execute(`
          SELECT wh.org_id,
            SUM(CASE WHEN uu.icai_membership_no IS NOT NULL THEN 1 ELSE 0 END) AS in_universe,
            SUM(CASE WHEN uu.icai_membership_no IS NULL THEN 1 ELSE 0 END)     AS not_in_universe,
            SUM(CASE WHEN vp.preference_tier = 'p1' THEN 1 ELSE 0 END) AS p1,
            SUM(CASE WHEN vp.preference_tier = 'p2' THEN 1 ELSE 0 END) AS p2,
            SUM(CASE WHEN vp.preference_tier = 'p3' THEN 1 ELSE 0 END) AS p3,
            SUM(CASE WHEN vp.preference_tier = 'p4' THEN 1 ELSE 0 END) AS p4,
            SUM(CASE WHEN vp.preference_tier IS NULL OR vp.preference_tier = 'un' THEN 1 ELSE 0 END) AS un
          FROM tbl_work_history wh
          LEFT JOIN tbl_user_universe uu ON uu.icai_membership_no = wh.icai_membership_no AND uu.user_id = ?
          LEFT JOIN tbl_voter_preference vp ON vp.icai_membership_no = wh.icai_membership_no
          WHERE wh.work_status = 'Active' AND wh.org_id IN (${orgIds.map(() => '?').join(',')})
          GROUP BY wh.org_id
        `, [uid, ...orgIds]);
        breakdownByOrg = Object.fromEntries(bRows.map(r => [r.org_id, r]));
      }
      const empty = { in_universe: 0, not_in_universe: 0, p1: 0, p2: 0, p3: 0, p4: 0, un: 0 };
      firms = rows.map(r => ({ ...r, ...(breakdownByOrg[r.org_id] || empty) }));
    } else {
      // Sorting by a breakdown column means that breakdown has to be computed
      // for every matching org, not just one page — slower, but only paid when
      // a non-default sort is actually requested.
      const [rows] = await pool.execute(`
        SELECT o.org_id, o.org_name AS firm, o.org_reg_no, o.org_type, o.org_structure, o.org_status,
          o.member_count AS total,
          SUM(CASE WHEN uu.icai_membership_no IS NOT NULL THEN 1 ELSE 0 END) AS in_universe,
          SUM(CASE WHEN uu.icai_membership_no IS NULL THEN 1 ELSE 0 END)     AS not_in_universe,
          SUM(CASE WHEN vp.preference_tier = 'p1' THEN 1 ELSE 0 END) AS p1,
          SUM(CASE WHEN vp.preference_tier = 'p2' THEN 1 ELSE 0 END) AS p2,
          SUM(CASE WHEN vp.preference_tier = 'p3' THEN 1 ELSE 0 END) AS p3,
          SUM(CASE WHEN vp.preference_tier = 'p4' THEN 1 ELSE 0 END) AS p4,
          SUM(CASE WHEN vp.preference_tier IS NULL OR vp.preference_tier = 'un' THEN 1 ELSE 0 END) AS un
        FROM tbl_org_details o
        LEFT JOIN tbl_work_history wh ON wh.org_id = o.org_id AND wh.work_status = 'Active'
        LEFT JOIN tbl_user_universe uu ON uu.icai_membership_no = wh.icai_membership_no AND uu.user_id = ?
        LEFT JOIN tbl_voter_preference vp ON vp.icai_membership_no = wh.icai_membership_no
        ${WHERE}
        GROUP BY o.org_id, o.org_name, o.org_reg_no, o.org_type, o.org_structure, o.org_status, o.member_count
        ORDER BY ${sort} ${dir}
        LIMIT ${lim} OFFSET ${offset}
      `, [uid, ...params]);
      firms = rows;
    }
    res.json({ firms, total, page: pg, limit: lim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Firm summary fetch failed' });
  }
});

// ── GET /api/dashboard/institute ─────────────────────────────────────────────
// Paginated — page/limit query params (default 50/page).
const INSTITUTE_TYPE_FILTERS = ['SCHOOL', 'COLLEGE', 'UNIVERSITY', 'INSTITUTE'];
const INSTITUTE_STATUS_FILTERS = ['ACTIVE', 'INACTIVE'];

router.get('/institute', async (req, res) => {
  try {
    const uid = req.user.user_id;
    const { lim, offset, pg } = pagingParams(req);
    const { search = '', type = '', status = '' } = req.query;
    const { sort, dir } = parseSummarySort(req);
    const conditions = [];
    const whereParams = [];
    if (search) { const c = multiSearchCondition('i.institute_name', search, whereParams); if (c) conditions.push(c); }
    if (INSTITUTE_TYPE_FILTERS.includes(type)) { conditions.push('i.institute_type = ?'); whereParams.push(type); }
    if (INSTITUTE_STATUS_FILTERS.includes(status)) { conditions.push('i.institute_status = ?'); whereParams.push(status); }
    const WHERE = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const JOINS = `
      FROM tbl_institute_details i
      LEFT JOIN tbl_voter_education_history eh ON eh.institute_id = i.institute_id
      LEFT JOIN tbl_user_universe uu ON uu.icai_membership_no = eh.icai_membership_no AND uu.user_id = ?
      LEFT JOIN tbl_voter_preference vp ON vp.icai_membership_no = eh.icai_membership_no
      ${WHERE}
    `;
    const params = [uid, ...whereParams];
    const [rows] = await pool.execute(`
      SELECT
        i.institute_id, i.institute_name                                AS institute,
        i.institute_type, i.institute_status,
        COUNT(DISTINCT eh.icai_membership_no)                           AS total,
        COUNT(DISTINCT CASE WHEN uu.icai_membership_no IS NOT NULL THEN eh.icai_membership_no END) AS in_universe,
        COUNT(DISTINCT CASE WHEN uu.icai_membership_no IS NULL THEN eh.icai_membership_no END)     AS not_in_universe,
        COUNT(DISTINCT CASE WHEN vp.preference_tier = 'p1' THEN eh.icai_membership_no END) AS p1,
        COUNT(DISTINCT CASE WHEN vp.preference_tier = 'p2' THEN eh.icai_membership_no END) AS p2,
        COUNT(DISTINCT CASE WHEN vp.preference_tier = 'p3' THEN eh.icai_membership_no END) AS p3,
        COUNT(DISTINCT CASE WHEN vp.preference_tier = 'p4' THEN eh.icai_membership_no END) AS p4,
        COUNT(DISTINCT CASE WHEN vp.preference_tier IS NULL OR vp.preference_tier = 'un' THEN eh.icai_membership_no END) AS un
      ${JOINS}
      GROUP BY i.institute_id, i.institute_name, i.institute_type, i.institute_status
      ORDER BY ${sort} ${dir}
      LIMIT ${lim} OFFSET ${offset}
    `, params);
    // Same reasoning as /firm — GROUP BY key is i.institute_id, the table's own
    // primary key, so a plain count on tbl_institute_details is equivalent and
    // skips the expensive JOIN+GROUP BY.
    const countWhere = conditions.length ? ' WHERE ' + conditions.join(' AND ') : '';
    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM tbl_institute_details i${countWhere}`, whereParams);
    res.json({ institutes: rows, total, page: pg, limit: lim });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Institute summary fetch failed' });
  }
});

module.exports = router;
