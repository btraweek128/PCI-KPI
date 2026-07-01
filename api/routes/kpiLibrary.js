const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { attachUserRoles } = require('../middleware/roles');
const { query } = require('../db/connection');
const { MEASURE_TYPES } = require('../services/kpiCalculations');

const router = express.Router();

router.use(requireAuth, attachUserRoles);

router.get('/types', (_req, res) => {
  res.json(Object.values(MEASURE_TYPES));
});

router.get('/', async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT * FROM "KPI_Library" WHERE "IsActive" = TRUE ORDER BY "Id"`
    );
    res.json(result.recordset.map(formatLibraryRow));
  } catch (err) {
    next(err);
  }
});

function formatLibraryRow(row) {
  const typeMeta = MEASURE_TYPES[row.MeasureType] || {};
  return {
    id: row.Id,
    strategicObjective: row.StrategicObjective,
    kpiObjective: row.KpiObjective,
    measure: row.Measure,
    measureType: row.MeasureType,
    measureTypeLabel: typeMeta.label || row.MeasureType,
    defaultTarget: row.DefaultTarget,
    defaultTiming: row.DefaultTiming,
    defaultWeightPct: row.DefaultWeightPct,
  };
}

module.exports = router;
