const express = require('express');
const { requireAuth, isDevBypassEnabled } = require('../middleware/auth');
const { query } = require('../db/connection');

const router = express.Router();

const DEFAULT_ADMIN_EMAILS = [
  'btraweek@pcigases.com',
  'ceo@pci.com',
  'cfo@pci.com',
];

function getAdminEmails() {
  const fromEnv = process.env.KPI_ADMIN_EMAILS;
  if (!fromEnv) return DEFAULT_ADMIN_EMAILS;
  return fromEnv.split(',').map((e) => e.trim()).filter(Boolean);
}

router.get('/', requireAuth, async (req, res, next) => {
  try {
    let dbConnected = true;

    try {
      await query('SELECT 1 AS connected');
    } catch (dbErr) {
      if (!isDevBypassEnabled()) throw dbErr;
      dbConnected = false;
      console.warn('/api/me: database unavailable — using dev profile defaults');
    }

    res.json({
      email: req.user.email,
      name: req.user.name,
      department: req.user.department || null,
      isAdmin: getAdminEmails().includes(req.user.email),
      dbConnected,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
