const MEASURE_TYPES = {
  higher_is_better: {
    value: 'higher_is_better',
    label: 'Higher Is Better',
    description: 'A higher numeric result relative to target indicates stronger performance.',
  },
  lower_is_better: {
    value: 'lower_is_better',
    label: 'Lower Is Better',
    description: 'A lower numeric result relative to target indicates stronger performance.',
  },
  milestone_by_date: {
    value: 'milestone_by_date',
    label: 'Milestone by Date',
    description: 'Completion on or before the target date indicates successful performance.',
  },
};

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/[%,$]/g, '').trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function clampRatio(ratio, { launchPoint = 0, maxRatio = 1.5 }) {
  if (ratio === null || Number.isNaN(ratio)) return 0;
  if (ratio < launchPoint) return 0;
  return Math.min(ratio, maxRatio);
}

function calcActualVsTargetRatio({ measureType, target, result, launchPoint = 0, maxRatio = 1.5 }) {
  let ratio = 0;

  switch (measureType) {
    case 'higher_is_better': {
      const t = parseNumber(target);
      const r = parseNumber(result);
      if (t === null || r === null || t === 0) break;
      ratio = r / t;
      break;
    }
    case 'lower_is_better': {
      const t = parseNumber(target);
      const r = parseNumber(result);
      if (t === null || r === null) break;
      if (t < 0 && r < 0) {
        ratio = Math.abs(r) >= Math.abs(t) ? Math.abs(t) / Math.abs(r) : r / t;
      } else if (r === 0) {
        ratio = maxRatio;
      } else {
        ratio = t / r;
      }
      break;
    }
    case 'milestone_by_date': {
      const targetDate = parseDate(target);
      const resultDate = parseDate(result);
      if (!targetDate || !resultDate) break;
      if (resultDate <= targetDate) {
        const daysEarly = (targetDate - resultDate) / (1000 * 60 * 60 * 24);
        ratio = 1 + Math.min(daysEarly / 30, 0.5) * 0.4;
      } else {
        const daysLate = (resultDate - targetDate) / (1000 * 60 * 60 * 24);
        ratio = Math.max(0, 1 - daysLate / 30);
      }
      break;
    }
    default:
      break;
  }

  return clampRatio(ratio, { launchPoint, maxRatio });
}

function calcWeightedResultPct(actualVsTargetRatio, weightPct) {
  return (actualVsTargetRatio || 0) * (weightPct || 0);
}

function sumTotalKpiPct(measures) {
  return measures.reduce((sum, m) => sum + (Number(m.weightedResultPct) || 0), 0);
}

function calcPciMultiplier({ targetEbitda, expectedActualEbitda, formula = 'linear', maxMultiplier = 1.5 }) {
  const target = parseNumber(targetEbitda);
  const actual = parseNumber(expectedActualEbitda);
  if (!target || !actual || target === 0) return 1;
  let multiplier = 1;
  if (formula === 'linear') {
    multiplier = actual / target;
  }
  return Math.min(Math.max(multiplier, 0), maxMultiplier);
}

function calcBonusPayout({ targetBonus, pciMultiplier, totalKpiPct, maxCompanyPool = null }) {
  const bonus = (parseNumber(targetBonus) || 0) * (pciMultiplier || 1) * ((totalKpiPct || 0) / 100);
  if (maxCompanyPool && bonus > maxCompanyPool) return maxCompanyPool;
  return Math.round(bonus * 100) / 100;
}

function recalcWorksheetMeasures(measures, { launchPoint = 0, maxRatio = 1.5 }) {
  return measures.map((m) => {
    const actualVsTargetRatio = calcActualVsTargetRatio({
      measureType: m.measureType,
      target: m.target,
      result: m.numericalResult,
      launchPoint,
      maxRatio,
    });
    const weightedResultPct = calcWeightedResultPct(actualVsTargetRatio, m.weightPct);
    return {
      ...m,
      actualVsTargetRatio,
      weightedResultPct: Math.round(weightedResultPct * 1000) / 1000,
    };
  });
}

module.exports = {
  MEASURE_TYPES,
  parseNumber,
  parseDate,
  calcActualVsTargetRatio,
  calcWeightedResultPct,
  sumTotalKpiPct,
  calcPciMultiplier,
  calcBonusPayout,
  recalcWorksheetMeasures,
};
