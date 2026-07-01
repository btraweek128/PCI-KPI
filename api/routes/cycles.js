const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { attachUserRoles } = require('../middleware/roles');
const { query } = require('../db/connection');
const { calcPciMultiplier } = require('../services/kpiCalculations');

const router = express.Router();

router.use(requireAuth, attachUserRoles);

router.get('/', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, s."TargetEbitda", s."ExpectedActualEbitda",
              s."PciMultiplierMax", s."MaxCompanyPool", s."KpiAttainmentCap"
       FROM "PerformanceCycles" c
       LEFT JOIN "CycleSettings" s ON s."CycleId" = c."Id"
       ORDER BY c."Year" DESC, c."Id" DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    next(err);
  }
});

router.get('/active', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*, s."TargetEbitda", s."ExpectedActualEbitda",
              s."PciMultiplierMax", s."MaxCompanyPool", s."KpiAttainmentCap",
              s."PciMultiplierFormula"
       FROM "PerformanceCycles" c
       LEFT JOIN "CycleSettings" s ON s."CycleId" = c."Id"
       WHERE c."Status" = 'open'
       ORDER BY c."Year" DESC
       LIMIT 1`
    );
    if (!result.recordset[0]) {
      return res.json(null);
    }
    res.json(result.recordset[0]);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/dashboard', async (req, res, next) => {
  try {
    const cycleId = Number(req.params.id);
    const cycleResult = await query(
      `SELECT c.*, s."TargetEbitda", s."ExpectedActualEbitda",
              s."PciMultiplierMax", s."MaxCompanyPool", s."KpiAttainmentCap",
              s."PciMultiplierFormula"
       FROM "PerformanceCycles" c
       LEFT JOIN "CycleSettings" s ON s."CycleId" = c."Id"
       WHERE c."Id" = @cycleId`,
      { cycleId }
    );
    const cycle = cycleResult.recordset[0];
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }

    const counts = await query(
      `SELECT
         COUNT(*)::int AS total_worksheets,
         COUNT(*) FILTER (WHERE "Status" IN ('submitted', 'in_review', 'approved'))::int AS submitted,
         COUNT(*) FILTER (WHERE "Status" = 'approved')::int AS approved,
         ROUND(AVG("TotalKpiPct") FILTER (WHERE "TotalKpiPct" IS NOT NULL), 1) AS avg_kpi_pct,
         ROUND(SUM("CalculatedPayout") FILTER (WHERE "CalculatedPayout" IS NOT NULL), 0) AS projected_payout
       FROM "KPI_Worksheets"
       WHERE "CycleId" = @cycleId`,
      { cycleId }
    );

    const pciMultiplier = calcPciMultiplier({
      targetEbitda: cycle.TargetEbitda,
      expectedActualEbitda: cycle.ExpectedActualEbitda,
      formula: cycle.PciMultiplierFormula,
      maxMultiplier: Number(cycle.PciMultiplierMax) || 1.5,
    });

    const deptRollup = await query(
      `SELECT d."Code", d."Name", d."LeadName",
         COUNT(e."Id")::int AS headcount,
         COUNT(w."Id") FILTER (WHERE w."Status" IN ('submitted', 'in_review', 'approved'))::int AS submitted,
         ROUND(AVG(w."TotalKpiPct") FILTER (WHERE w."TotalKpiPct" IS NOT NULL), 0) AS avg_kpi_pct,
         ROUND(SUM(w."CalculatedPayout") FILTER (WHERE w."CalculatedPayout" IS NOT NULL), 0) AS projected_payout
       FROM "Departments" d
       LEFT JOIN "EmployeeProfiles" e ON e."DepartmentCode" = d."Code" AND e."IsActive" = TRUE
       LEFT JOIN "KPI_Worksheets" w ON w."EmployeeEmail" = e."Email" AND w."CycleId" = @cycleId
       WHERE d."IsActive" = TRUE
       GROUP BY d."Code", d."Name", d."LeadName"
       ORDER BY d."Name"`,
      { cycleId }
    );

    res.json({
      cycle,
      pciMultiplier: Math.round(pciMultiplier * 1000) / 1000,
      summary: counts.recordset[0],
      departments: deptRollup.recordset,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
