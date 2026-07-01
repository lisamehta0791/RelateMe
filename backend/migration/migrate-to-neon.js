// One-off MySQL -> Neon Postgres data migration. Run after schema.sql has
// been applied to the target Postgres database. Not part of the running app.
//
// Usage: node migration/migrate-to-neon.js
//
// Reads every table from MySQL in batches, writes to Postgres in FK-safe
// order (derived from information_schema, not hand-written), then resets
// every IDENTITY sequence to MAX(id)+1 and verifies row counts match.
require('dotenv').config();
const mysql = require('mysql2/promise');
const { Pool } = require('pg');

const BATCH_SIZE = 1000;

async function getTableOrder(mysqlConn, dbName) {
  const [tables] = await mysqlConn.query('SHOW TABLES');
  const allTables = tables.map(t => Object.values(t)[0]);

  const [fks] = await mysqlConn.query(
    `SELECT TABLE_NAME, REFERENCED_TABLE_NAME
     FROM information_schema.KEY_COLUMN_USAGE
     WHERE REFERENCED_TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
       AND TABLE_NAME != REFERENCED_TABLE_NAME`,
    [dbName]
  );

  // Topological sort: a table can load once all tables it references have loaded.
  const dependsOn = new Map(allTables.map(t => [t, new Set()]));
  for (const { TABLE_NAME, REFERENCED_TABLE_NAME } of fks) {
    dependsOn.get(TABLE_NAME).add(REFERENCED_TABLE_NAME);
  }

  const ordered = [];
  const loaded = new Set();
  while (ordered.length < allTables.length) {
    const next = allTables.filter(
      t => !loaded.has(t) && [...dependsOn.get(t)].every(dep => loaded.has(dep))
    );
    if (!next.length) throw new Error('Circular FK dependency detected — cannot order tables: ' + allTables.filter(t => !loaded.has(t)).join(', '));
    next.sort().forEach(t => { ordered.push(t); loaded.add(t); });
  }
  return ordered;
}

async function migrateTable(mysqlConn, pgPool, table) {
  const [[{ c: total }]] = await mysqlConn.query(`SELECT COUNT(*) c FROM \`${table}\``);
  if (total === 0) {
    console.log(`  ${table}: 0 rows, skipping`);
    return 0;
  }

  const [cols] = await mysqlConn.query(`SHOW COLUMNS FROM \`${table}\``);
  const colNames = cols.map(c => c.Field);
  const quotedCols = colNames.map(c => `"${c}"`).join(', ');

  let migrated = 0;
  for (let offset = 0; offset < total; offset += BATCH_SIZE) {
    const [rows] = await mysqlConn.query(
      `SELECT * FROM \`${table}\` LIMIT ? OFFSET ?`,
      [BATCH_SIZE, offset]
    );
    if (!rows.length) break;

    const valueRows = [];
    const params = [];
    let p = 1;
    for (const row of rows) {
      const placeholders = colNames.map(col => {
        let v = row[col];
        // JSON columns: mysql2 already returns parsed objects; pg needs them
        // re-stringified so the driver sends valid jsonb text.
        if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
          v = JSON.stringify(v);
        }
        params.push(v);
        return `$${p++}`;
      });
      valueRows.push(`(${placeholders.join(', ')})`);
    }

    const sql = `INSERT INTO "${table}" (${quotedCols}) VALUES ${valueRows.join(', ')}`;
    await pgPool.query(sql, params);
    migrated += rows.length;
  }
  console.log(`  ${table}: ${migrated}/${total} rows migrated`);
  return migrated;
}

async function resetSequences(pgPool, tables) {
  for (const table of tables) {
    // GENERATED ... AS IDENTITY columns don't show up via column_default
    // (that's only set for old-style SERIAL/nextval() columns) — identity
    // columns are flagged by is_identity instead.
    const { rows } = await pgPool.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
         AND (is_identity = 'YES' OR column_default LIKE 'nextval%')`,
      [table]
    );
    for (const { column_name } of rows) {
      const seqResult = await pgPool.query(`SELECT pg_get_serial_sequence($1, $2) AS seq`, [table, column_name]);
      const seq = seqResult.rows[0].seq;
      if (!seq) continue;
      await pgPool.query(
        `SELECT setval($1, COALESCE((SELECT MAX("${column_name}") FROM "${table}"), 1), (SELECT MAX("${column_name}") FROM "${table}") IS NOT NULL)`,
        [seq]
      );
    }
  }
}

async function verifyCounts(mysqlConn, pgPool, tables) {
  console.log('\nVerifying row counts...');
  let allMatch = true;
  for (const table of tables) {
    const [[{ c: mysqlCount }]] = await mysqlConn.query(`SELECT COUNT(*) c FROM \`${table}\``);
    const { rows: [{ c: pgCount }] } = await pgPool.query(`SELECT COUNT(*)::int c FROM "${table}"`);
    const ok = mysqlCount === pgCount;
    if (!ok) allMatch = false;
    console.log(`  ${ok ? 'OK  ' : 'FAIL'} ${table}: mysql=${mysqlCount} pg=${pgCount}`);
  }
  return allMatch;
}

(async () => {
  const mysqlConn = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    const order = await getTableOrder(mysqlConn, process.env.DB_NAME);
    console.log('Load order:', order.join(', '), '\n');

    console.log('Migrating data...');
    for (const table of order) {
      await migrateTable(mysqlConn, pgPool, table);
    }

    console.log('\nResetting identity sequences...');
    await resetSequences(pgPool, order);

    const ok = await verifyCounts(mysqlConn, pgPool, order);
    console.log(ok ? '\nAll row counts match.' : '\nMISMATCH — see FAIL rows above.');
    process.exitCode = ok ? 0 : 1;
  } finally {
    await mysqlConn.end();
    await pgPool.end();
  }
})().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
