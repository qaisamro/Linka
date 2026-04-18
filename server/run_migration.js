require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate(fileName) {
  if (!fileName) {
    console.error('Usage: node run_migration.js <filename.sql>');
    process.exit(1);
  }

  const pool = require('./db/pool');
  const sqlFile = path.join(__dirname, 'db', fileName);
  
  if (!fs.existsSync(sqlFile)) {
    console.error(`File not found: ${sqlFile}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(sqlFile, 'utf8');
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  const statements = [];
  let current = '';
  const lines = normalized.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!current && (!trimmed || trimmed.startsWith('--') || trimmed.startsWith('/*'))) continue;
    
    current += line + '\n';
    
    if (trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 3) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  console.log(`\n🚀 Running ${statements.length} migration statements from ${fileName}...\n`);

  let ok = 0, skip = 0, fail = 0;
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.replace(/\n/g, ' ').substring(0, 90);
    try {
      await pool.query(stmt);
      ok++;
      console.log(`  ✅ [${i+1}] ${preview}...`);
    } catch (e) {
      const code = e.code || '';
      if (['ER_DUP_ENTRY','ER_TABLE_EXISTS_ERROR','ER_DUP_COLUMN_NAME','ER_CANT_DROP_FIELD_OR_KEY','ER_DUP_FIELDNAME'].includes(code)) {
        skip++;
        console.log(`  ⏭️  [${i+1}] SKIP (${code}): ${preview.substring(0, 60)}...`);
      } else {
        fail++;
        console.log(`  ⚠️  [${i+1}] FAIL [${code}]: ${e.sqlMessage || e.message}`);
        console.log(`       => ${preview}`);
      }
    }
  }

  console.log(`\n📊 Results: ${ok} succeeded, ${skip} skipped, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}

migrate(process.argv[2]).catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
