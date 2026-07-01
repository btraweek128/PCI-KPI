const LOCKED_CYCLE_STAGES = new Set(['payout_lock']);
const LOCKED_CYCLE_STATUSES = new Set(['locked', 'closed']);

function isCycleLocked(cycle) {
  if (!cycle) return false;
  if (LOCKED_CYCLE_STAGES.has(cycle.WorkflowStage)) return true;
  if (LOCKED_CYCLE_STATUSES.has(cycle.Status)) return true;
  return false;
}

function canEditWorksheet(cycle, { isHrAdmin = false } = {}) {
  if (isHrAdmin) return !isCycleLocked(cycle);
  return !isCycleLocked(cycle);
}

function isWorksheetFullySigned(worksheet) {
  return Boolean(
    worksheet.EmployeeSignedAt
    && worksheet.ManagerSignedAt
    && worksheet.SecondLevelSignedAt
  );
}

function getSignatureStatus(worksheet) {
  return {
    employee: { required: true, signedAt: worksheet.EmployeeSignedAt || null },
    manager: { required: true, signedAt: worksheet.ManagerSignedAt || null },
    secondLevelManager: {
      required: true,
      signedAt: worksheet.SecondLevelSignedAt || null,
      email: worksheet.SecondLevelManagerEmail || null,
      name: worksheet.SecondLevelManagerName || null,
    },
    complete: isWorksheetFullySigned(worksheet),
  };
}

module.exports = {
  isCycleLocked,
  canEditWorksheet,
  isWorksheetFullySigned,
  getSignatureStatus,
};
