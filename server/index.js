require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db/pool');
const { checkBlockedIp } = require('./middleware/checkBlockedIp');
const { requestMetricsMiddleware } = require('./middleware/requestMetrics');

// ─── Run schema migrations on startup ────────────────────────────
async function runMigrations() {
  try {
    await pool.query(`ALTER TABLE users ALTER COLUMN avatar_url TYPE TEXT`);
  } catch (err) {
    // Ignore if already TEXT or no change needed
  }
}

// ─── Ensure required admin accounts exist ────────────────────────
async function seedAdminUsers() {
  // Remove old default accounts
  const removedEmails = ['admin@hebron.ps', 'super@hebron.ps'];
  try {
    await pool.query(`DELETE FROM users WHERE email = ANY(?)`, [removedEmails]);
  } catch (err) {
    console.error('⚠️  Could not remove old admin accounts:', err.message);
  }

  const admins = [
    { name: 'Super Admin', email: 'admin@linka.ps', password: 'linka123', role: 'super_admin' },
  ];
  for (const admin of admins) {
    try {
      const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [admin.email]);
      if (rows.length === 0) {
        const hash = await bcrypt.hash(admin.password, 10);
        await pool.query(
          `INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, TRUE)`,
          [admin.name, admin.email, hash, admin.role]
        );
        console.log(`✅ Created admin: ${admin.email}`);
      }
    } catch (err) {
      console.error(`⚠️  Could not seed admin ${admin.email}:`, err.message);
    }
  }
}

// ─── App Setup ───────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(requestMetricsMiddleware);
app.use(checkBlockedIp);

// ─── Health Check ─────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  const dbStatus = await pool.checkDatabaseHealth();
  res.json({
    status: dbStatus.connected ? 'ok' : 'degraded',
    message: dbStatus.connected
      ? 'Hebron Youth Platform API is running ✅'
      : 'API is running, but database is unavailable.',
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
});

// ─── Routes ───────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/users', require('./routes/users'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/university', require('./routes/university'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/super-admin', require('./routes/superAdmin'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/entities', require('./routes/entities'));
app.use('/api/training', require('./routes/training'));

// ─── Neighborhoods (simple, no controller needed) ─────────────────
app.get('/api/neighborhoods', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM neighborhoods ORDER BY id');
    res.json({ neighborhoods: rows });
  } catch (err) {
    res.status(500).json({ error: 'خطأ في جلب الأحياء' });
  }
});

// ─── Serve React Frontend in Production ──────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// ─── 404 Handler (API only, unreachable for non-API) ─────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
  await runMigrations();
  await seedAdminUsers();
});
