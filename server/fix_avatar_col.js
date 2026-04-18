const pool = require('./db/pool');

async function fixAvatarColumn() {
    try {
        console.log('Altering users table to support LONGTEXT for avatar_url...');
        await pool.query('ALTER TABLE users MODIFY avatar_url LONGTEXT;');
        console.log('Success!');
        process.exit(0);
    } catch (err) {
        console.error('Failed to alter table:', err.message);
        process.exit(1);
    }
}

fixAvatarColumn();
