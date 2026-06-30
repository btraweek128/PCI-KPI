require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { query, closePool } = require('./db/connection');
const { isPortalAuthConfigured } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pci-kpi-api' });
});

app.get('/health/db', async (_req, res) => {
  try {
    const result = await query('SELECT 1 AS connected');
    res.json({ status: 'ok', database: 'connected', result: result.recordset[0] });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

app.get('/health/config', (_req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV || 'development',
    portalAuthConfigured: isPortalAuthConfigured(),
    portalIssuer: process.env.PORTAL_ISSUER || null,
    portalAppId: process.env.PORTAL_APP_ID || 'kpi',
    hasPortalPublicKey: Boolean(process.env.PORTAL_JWT_PUBLIC_KEY_PEM),
    clientOrigin: process.env.CLIENT_ORIGIN || null,
    devBypassAuth: process.env.DEV_BYPASS_AUTH !== 'false',
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/me', require('./routes/me'));

const publicDir = path.join(__dirname, 'public');
const clientDist = path.join(__dirname, '..', 'client', 'dist');
const staticDir = fs.existsSync(publicDir) ? publicDir : clientDist;

if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, () => {
  console.log(`PCI KPI API listening on port ${PORT}`);
  if (process.env.DEV_BYPASS_AUTH !== 'false') {
    console.log('Dev auth bypass: ON');
  }
});

async function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  server.close(async () => {
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
