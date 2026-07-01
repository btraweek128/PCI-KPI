const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { attachUserRoles } = require('../middleware/roles');
const { query } = require('../db/connection');
const { MEASURE_TYPES } = require('../services/kpiCalculations');
const { isCycleLocked, canEditWorksheet, getSignatureStatus } = require('../services/cycleGuards');

const router = express.Router();

router.use(requireAuth, attachUserRoles);

router.get('/mine', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT w.*, c."Name" AS "CycleName", c."Year" AS "CycleYear"
       FROM "KPI_Worksheets" w
       JOIN "PerformanceCycles" c ON c."Id" = w."CycleId"
       WHERE LOWER(w."EmployeeEmail") = LOWER(@email)
       ORDER BY c."Year" DESC`,
      { email: req.user.email }
    );
    res.json(result.recordset.map(formatWorksheetSummary));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const worksheetId = Number(req.params.id);
    const wsResult = await query(
      `SELECT w.*, c."Name" AS "CycleName", c."Year" AS "CycleYear",
              c."PeriodStart", c."PeriodEnd",
              e."Name" AS "EmployeeName", e."Position", e."EmployeeId",
              e."DepartmentCode", e."ManagerEmail", e."HireDate",
              e."BaseSalary", e."TargetBonus", e."BonusLevelPct",
              e."SecondLevelManagerEmail",
              mgr."Name" AS "ManagerName",
              slm."Name" AS "SecondLevelManagerName",
              c."WorkflowStage" AS "CycleWorkflowStage",
              c."Status" AS "CycleStatus",
              s."TargetEbitda", s."ExpectedActualEbitda",
              s."PciMultiplierMax", s."KpiAttainmentCap", s."PciMultiplierFormula",
              ts."LaunchPointRatio"
       FROM "KPI_Worksheets" w
       JOIN "PerformanceCycles" c ON c."Id" = w."CycleId"
       JOIN "EmployeeProfiles" e ON LOWER(e."Email") = LOWER(w."EmployeeEmail")
       LEFT JOIN "EmployeeProfiles" mgr ON LOWER(mgr."Email") = LOWER(e."ManagerEmail")
       LEFT JOIN "EmployeeProfiles" slm ON LOWER(slm."Email") = LOWER(e."SecondLevelManagerEmail")
       LEFT JOIN "CycleSettings" s ON s."CycleId" = c."Id"
       LEFT JOIN "TeamKpiSettings" ts ON ts."CycleId" = c."Id"
         AND LOWER(ts."ManagerEmail") = LOWER(e."ManagerEmail")
       WHERE w."Id" = @worksheetId`,
      { worksheetId }
    );
    const worksheet = wsResult.recordset[0];
    if (!worksheet) {
      return res.status(404).json({ error: 'Worksheet not found' });
    }

    if (!canViewWorksheet(req, worksheet)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const measures = await query(
      `SELECT * FROM "KPI_Measures" WHERE "WorksheetId" = @worksheetId ORDER BY "SortOrder"`,
      { worksheetId }
    );

    res.json(formatWorksheetDetail(worksheet, measures.recordset));
  } catch (err) {
    next(err);
  }
});

function canViewWorksheet(req, worksheet) {
  const email = req.user.email.toLowerCase();
  if (req.userRoles.isHrAdmin || req.userRoles.isExecutive) return true;
  if (worksheet.EmployeeEmail?.toLowerCase() === email) return true;
  if (worksheet.ManagerEmail?.toLowerCase() === email) return true;
  return false;
}

function formatWorksheetSummary(row) {
  return {
    id: row.Id,
    cycleId: row.CycleId,
    cycleName: row.CycleName,
    cycleYear: row.CycleYear,
    status: row.Status,
    workflowStage: row.WorkflowStage,
    totalKpiPct: row.TotalKpiPct,
    calculatedPayout: row.CalculatedPayout,
    lastSavedAt: row.LastSavedAt,
    submittedAt: row.SubmittedAt,
  };
}

function formatMeasure(row) {
  const typeMeta = MEASURE_TYPES[row.MeasureType] || {};
  return {
    id: row.Id,
    sortOrder: row.SortOrder,
    strategicObjective: row.StrategicObjective,
    kpiObjective: row.KpiObjective,
    measure: row.Measure,
    measureType: row.MeasureType,
    measureTypeLabel: typeMeta.label || row.MeasureType,
    target: row.Target,
    timing: row.Timing,
    weightPct: row.WeightPct,
    midYearCommentary: row.MidYearCommentary,
    numericalResult: row.NumericalResult,
    actualVsTargetRatio: row.ActualVsTargetRatio,
    weightedResultPct: row.WeightedResultPct,
  };
}

function formatWorksheetDetail(worksheet, measureRows) {
  const cycle = {
    WorkflowStage: worksheet.CycleWorkflowStage,
    Status: worksheet.CycleStatus,
  };
  const locked = isCycleLocked(cycle);

  return {
    id: worksheet.Id,
    cycleId: worksheet.CycleId,
    cycleName: worksheet.CycleName,
    cycleYear: worksheet.CycleYear,
    periodStart: worksheet.PeriodStart,
    periodEnd: worksheet.PeriodEnd,
    status: worksheet.Status,
    workflowStage: worksheet.WorkflowStage,
    isReadOnly: locked,
    cycleLocked: locked,
    totalKpiPct: worksheet.TotalKpiPct,
    calculatedPayout: worksheet.CalculatedPayout,
    launchPointRatio: worksheet.LaunchPointRatio,
    canEdit: canEditWorksheet(cycle, { isHrAdmin: false }),
    employee: {
      name: worksheet.EmployeeName,
      email: worksheet.EmployeeEmail,
      employeeId: worksheet.EmployeeId,
      position: worksheet.Position,
      departmentCode: worksheet.DepartmentCode,
      hireDate: worksheet.HireDate,
      managerName: worksheet.ManagerName,
      managerEmail: worksheet.ManagerEmail,
      secondLevelManagerEmail: worksheet.SecondLevelManagerEmail,
      secondLevelManagerName: worksheet.SecondLevelManagerName,
      baseSalary: worksheet.BaseSalary,
      targetBonus: worksheet.TargetBonus,
      bonusLevelPct: worksheet.BonusLevelPct,
    },
    measures: measureRows.map(formatMeasure),
    signatures: getSignatureStatus(worksheet),
  };
}

module.exports = router;
