const { query } = require('../db/connection');

const DEFAULT_ADMIN_EMAILS = [
  'btraweek@pcigases.com',
  'grace.mensah@pcigases.com',
];

const DEFAULT_EXECUTIVE_EMAILS = [
  'ceo@pci.com',
  'cfo@pci.com',
  'btraweek@pcigases.com',
];

function getAdminEmails() {
  const fromEnv = process.env.KPI_ADMIN_EMAILS;
  if (!fromEnv) return DEFAULT_ADMIN_EMAILS;
  return fromEnv.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function getExecutiveEmails() {
  const fromEnv = process.env.KPI_EXECUTIVE_EMAILS;
  if (!fromEnv) return DEFAULT_EXECUTIVE_EMAILS;
  return fromEnv.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

async function loadEmployeeProfile(email) {
  const result = await query(
    `SELECT * FROM "EmployeeProfiles" WHERE LOWER("Email") = LOWER(@email) AND "IsActive" = TRUE LIMIT 1`,
    { email }
  );
  return result.recordset[0] || null;
}

async function isManager(email) {
  const result = await query(
    `SELECT 1 AS ok FROM "EmployeeProfiles"
     WHERE LOWER("ManagerEmail") = LOWER(@email) AND "IsActive" = TRUE LIMIT 1`,
    { email }
  );
  return result.recordset.length > 0;
}

async function buildUserRoles(email) {
  const normalized = email.toLowerCase();
  const profile = await loadEmployeeProfile(email);
  const manager = await isManager(email);

  return {
    profile,
    isHrAdmin: getAdminEmails().includes(normalized),
    isExecutive: getExecutiveEmails().includes(normalized),
    isManager: manager,
    isEmployee: Boolean(profile),
  };
}

function requireHrAdmin(req, res, next) {
  if (!req.userRoles?.isHrAdmin) {
    return res.status(403).json({ error: 'HR admin access required' });
  }
  return next();
}

function requireExecutive(req, res, next) {
  if (!req.userRoles?.isExecutive) {
    return res.status(403).json({ error: 'Executive access required' });
  }
  return next();
}

function requireManager(req, res, next) {
  if (!req.userRoles?.isManager && !req.userRoles?.isHrAdmin) {
    return res.status(403).json({ error: 'Manager access required' });
  }
  return next();
}

async function attachUserRoles(req, _res, next) {
  try {
    req.userRoles = await buildUserRoles(req.user.email);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAdminEmails,
  getExecutiveEmails,
  loadEmployeeProfile,
  buildUserRoles,
  requireHrAdmin,
  requireExecutive,
  requireManager,
  attachUserRoles,
};
