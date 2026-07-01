const express = require('express');
const { requireAuth, isDevBypassEnabled } = require('../middleware/auth');
const { attachUserRoles, getAdminEmails, getExecutiveEmails, buildUserRoles } = require('../middleware/roles');
const { query } = require('../db/connection');

const router = express.Router();

router.get('/', requireAuth, attachUserRoles, async (req, res, next) => {
  try {
    let dbConnected = true;
    let roles = req.userRoles;

    try {
      await query('SELECT 1 AS connected');
    } catch (dbErr) {
      if (!isDevBypassEnabled()) throw dbErr;
      dbConnected = false;
      roles = await buildUserRoles(req.user.email).catch(() => roles);
      console.warn('/api/me: database unavailable — using dev profile defaults');
    }

    const normalized = req.user.email.toLowerCase();

    res.json({
      email: req.user.email,
      name: req.user.name,
      department: req.user.department || roles?.profile?.DepartmentCode || null,
      isAdmin: getAdminEmails().includes(normalized),
      isHrAdmin: roles?.isHrAdmin || getAdminEmails().includes(normalized),
      isExecutive: roles?.isExecutive || getExecutiveEmails().includes(normalized),
      isManager: roles?.isManager || false,
      employeeId: roles?.profile?.EmployeeId || null,
      position: roles?.profile?.Position || null,
      dbConnected,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
