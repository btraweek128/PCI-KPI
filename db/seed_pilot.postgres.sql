-- Pilot POC seed — FY2025 Variable Pay (from PCI_KPI_Workflow.pptx)

INSERT INTO "Departments" ("Code", "Name", "LeadEmail", "LeadName") VALUES
  ('OPS',  'Operations',          'marcus.chen@pcigases.com',     'Marcus Chen'),
  ('COM',  'Commercial & Sales',  'elena.vasquez@pcigases.com',   'Elena Vasquez'),
  ('ENG',  'Engineering',         'raj.patel@pcigases.com',       'Raj Patel'),
  ('SC',   'Supply Chain',        'nora.lindqvist@pcigases.com',  'Nora Lindqvist'),
  ('FIN',  'Finance',             'david.kim@pcigases.com',       'David Kim'),
  ('HR',   'Human Resources',     'grace.mensah@pcigases.com',    'Grace Mensah')
ON CONFLICT ("Code") DO NOTHING;

INSERT INTO "EmployeeProfiles" (
  "EmployeeId", "Email", "Name", "Position", "DepartmentCode",
  "ManagerEmail", "SecondLevelManagerEmail", "HireDate", "BaseSalary", "TargetBonus", "BonusLevelPct"
) VALUES
  ('PCI-04827', 'daniel.okafor@pcigases.com',  'Daniel Okafor',       'Plant Operations Manager', 'OPS', 'marcus.chen@pcigases.com',     'ceo@pci.com', '2019-03-14', 185000, 37000, 20.00),
  ('PCI-03102', 'marcus.chen@pcigases.com',    'Marcus Chen',         'Operations Manager',       'OPS', 'ceo@pci.com',                  'cfo@pci.com', '2015-06-01', 220000, 44000, 20.00),
  ('PCI-05110', 'priya.nair@pcigases.com',     'Priya Nair',          'Reliability Engineer',     'OPS', 'marcus.chen@pcigases.com',     'ceo@pci.com', '2020-08-17', 160000, 30000, 18.75),
  ('PCI-04491', 'tom.becker@pcigases.com',     'Tom Becker',          'Shift Supervisor',         'OPS', 'marcus.chen@pcigases.com',     'ceo@pci.com', '2018-11-05', 125000, 18750, 15.00),
  ('PCI-04988', 'lucia.romano@pcigases.com',   'Lucia Romano',        'Process Engineer',         'OPS', 'marcus.chen@pcigases.com',     'ceo@pci.com', '2021-02-22', 145000, 27500, 18.97),
  ('PCI-05201', 'sam.whitfield@pcigases.com',  'Sam Whitfield',       'Maintenance Lead',         'OPS', 'marcus.chen@pcigases.com',     'ceo@pci.com', '2017-09-11', 118000, NULL,   NULL),
  ('PCI-05344', 'aisha.bello@pcigases.com',    'Aisha Bello',         'Logistics Coordinator',    'OPS', 'marcus.chen@pcigases.com',     'ceo@pci.com', '2022-04-04', 112000, 16900, 15.09),
  ('PCI-01001', 'btraweek@pcigases.com',       'Bryan Traweek',       'HR Director',              'HR',  'ceo@pci.com',                  'cfo@pci.com', '2014-01-15', 195000, 39000, 20.00),
  ('PCI-01002', 'ceo@pci.com',                 'PCI CEO',             'Chief Executive Officer',  'FIN', NULL,                           NULL, '2010-01-01', 350000, 70000, 20.00),
  ('PCI-01003', 'cfo@pci.com',                 'PCI CFO',             'Chief Financial Officer',  'FIN', 'ceo@pci.com',                  NULL, '2011-03-01', 300000, 60000, 20.00)
ON CONFLICT ("EmployeeId") DO NOTHING;

INSERT INTO "KPI_Library" (
  "StrategicObjective", "KpiObjective", "Measure", "MeasureType",
  "DefaultTarget", "DefaultTiming", "DefaultWeightPct"
)
SELECT * FROM (VALUES
  ('Operational Excellence', 'Improve ASU plant on-stream reliability', '% on-stream availability', 'higher_is_better', '98.5', 'FY / Q4', 25.00),
  ('Safety & Compliance', 'Sustain world-class safety performance', 'TRIR (recordable rate)', 'lower_is_better', '0.50', 'FY / Q4', 25.00),
  ('Cost & Productivity', 'Reduce specific power consumption', 'kWh per ton O₂', 'lower_is_better', '-3', 'FY / Q4', 23.00),
  ('Profitable Growth', 'Commission merchant CO₂ fill line', 'On-time, on-spec startup', 'milestone_by_date', '2025-09-30', 'Q3', 24.00),
  ('People & Capability', 'Build shift-team cross-training matrix', '% operators certified', 'higher_is_better', '90', 'FY / Q4', 13.00)
) AS v("StrategicObjective", "KpiObjective", "Measure", "MeasureType", "DefaultTarget", "DefaultTiming", "DefaultWeightPct")
WHERE NOT EXISTS (SELECT 1 FROM "KPI_Library" LIMIT 1);

INSERT INTO "PerformanceCycles" (
  "Name", "Year", "Tagline", "PeriodStart", "PeriodEnd", "WorkflowStage", "Status",
  "KpiSettingOpens", "EmployeeSubmissionDue", "ManagerApprovalDue",
  "RollupDue", "ExecutiveApprovalDue", "PayoutFinalized"
)
SELECT
  'FY2025 Annual KPI & Variable Pay', 2025, 'Reshape your tomorrow',
  '2025-01-01', '2025-12-31', 'executive_approval', 'open',
  '2025-01-06', '2025-01-31', '2025-02-14',
  '2025-02-21', '2025-02-28', '2025-03-14'
WHERE NOT EXISTS (SELECT 1 FROM "PerformanceCycles" WHERE "Year" = 2025);

INSERT INTO "CycleSettings" (
  "CycleId", "TargetEbitda", "ExpectedActualEbitda",
  "PciMultiplierMax", "MaxCompanyPool", "KpiAttainmentCap", "PciMultiplierFormula"
)
SELECT
  c."Id", 142000000, 150500000,
  1.500, 3000000, 1.500, 'linear'
FROM "PerformanceCycles" c
WHERE c."Year" = 2025
ON CONFLICT ("CycleId") DO NOTHING;

INSERT INTO "TeamKpiSettings" ("CycleId", "ManagerEmail", "LaunchPointRatio")
SELECT c."Id", 'marcus.chen@pcigases.com', 0.800
FROM "PerformanceCycles" c WHERE c."Year" = 2025
ON CONFLICT ("CycleId", "ManagerEmail") DO NOTHING;

INSERT INTO "TeamKpiAssignments" ("CycleId", "ManagerEmail", "LibraryKpiId", "SortOrder")
SELECT c."Id", 'marcus.chen@pcigases.com', l."Id", l."Id"
FROM "PerformanceCycles" c
CROSS JOIN "KPI_Library" l
WHERE c."Year" = 2025
ON CONFLICT ("CycleId", "ManagerEmail", "LibraryKpiId") DO NOTHING;

-- Daniel Okafor worksheet (submitted, from PPTX example)
INSERT INTO "KPI_Worksheets" (
  "CycleId", "EmployeeEmail", "Status", "WorkflowStage",
  "TotalKpiPct", "CalculatedPayout", "ManagerSignedAt", "SubmittedAt"
)
SELECT
  c."Id", 'daniel.okafor@pcigases.com', 'submitted', 'manager_approval',
  113.000, 44313.00, '2025-02-09'::timestamptz, '2025-02-03'::timestamptz
FROM "PerformanceCycles" c WHERE c."Year" = 2025
ON CONFLICT ("CycleId", "EmployeeEmail") DO NOTHING;

INSERT INTO "KPI_Measures" (
  "WorksheetId", "LibraryKpiId", "SortOrder",
  "StrategicObjective", "KpiObjective", "Measure", "MeasureType",
  "Target", "Timing", "WeightPct", "MidYearCommentary",
  "NumericalResult", "ActualVsTargetRatio", "WeightedResultPct"
)
SELECT w."Id", l."Id", 1,
  l."StrategicObjective", l."KpiObjective", l."Measure", l."MeasureType",
  l."DefaultTarget", l."DefaultTiming", 25.00,
  'On-stream availability finished at 99.1% vs 98.5% target; two unplanned trips recovered within 4 hrs.',
  '99.1', 1.1000, 27.500
FROM "KPI_Worksheets" w
JOIN "PerformanceCycles" c ON c."Id" = w."CycleId" AND c."Year" = 2025
JOIN "KPI_Library" l ON l."Measure" = '% on-stream availability'
WHERE w."EmployeeEmail" = 'daniel.okafor@pcigases.com'
  AND NOT EXISTS (SELECT 1 FROM "KPI_Measures" m WHERE m."WorksheetId" = w."Id");

INSERT INTO "KPI_Measures" (
  "WorksheetId", "LibraryKpiId", "SortOrder",
  "StrategicObjective", "KpiObjective", "Measure", "MeasureType",
  "Target", "Timing", "WeightPct", "MidYearCommentary",
  "NumericalResult", "ActualVsTargetRatio", "WeightedResultPct"
)
SELECT w."Id", l."Id", 2,
  l."StrategicObjective", l."KpiObjective", l."Measure", l."MeasureType",
  l."DefaultTarget", l."DefaultTiming", 25.00,
  'TRIR closed at 0.32 against ≤0.50 target. 11 consecutive recordable-free months.',
  '0.32', 1.2500, 25.000
FROM "KPI_Worksheets" w
JOIN "PerformanceCycles" c ON c."Id" = w."CycleId" AND c."Year" = 2025
JOIN "KPI_Library" l ON l."Measure" = 'TRIR (recordable rate)'
WHERE w."EmployeeEmail" = 'daniel.okafor@pcigases.com'
  AND NOT EXISTS (SELECT 1 FROM "KPI_Measures" m WHERE m."WorksheetId" = w."Id" AND m."SortOrder" = 2);

INSERT INTO "KPI_Measures" (
  "WorksheetId", "LibraryKpiId", "SortOrder",
  "StrategicObjective", "KpiObjective", "Measure", "MeasureType",
  "Target", "Timing", "WeightPct", "MidYearCommentary",
  "NumericalResult", "ActualVsTargetRatio", "WeightedResultPct"
)
SELECT w."Id", l."Id", 3,
  l."StrategicObjective", l."KpiObjective", l."Measure", l."MeasureType",
  l."DefaultTarget", l."DefaultTiming", 23.00,
  'Specific power down 3.8% YoY via compressor sequencing and load-shifting.',
  '-3.8', 1.1500, 23.000
FROM "KPI_Worksheets" w
JOIN "PerformanceCycles" c ON c."Id" = w."CycleId" AND c."Year" = 2025
JOIN "KPI_Library" l ON l."Measure" = 'kWh per ton O₂'
WHERE w."EmployeeEmail" = 'daniel.okafor@pcigases.com'
  AND NOT EXISTS (SELECT 1 FROM "KPI_Measures" m WHERE m."WorksheetId" = w."Id" AND m."SortOrder" = 3);

INSERT INTO "KPI_Measures" (
  "WorksheetId", "LibraryKpiId", "SortOrder",
  "StrategicObjective", "KpiObjective", "Measure", "MeasureType",
  "Target", "Timing", "WeightPct", "MidYearCommentary",
  "NumericalResult", "ActualVsTargetRatio", "WeightedResultPct"
)
SELECT w."Id", l."Id", 4,
  l."StrategicObjective", l."KpiObjective", l."Measure", l."MeasureType",
  l."DefaultTarget", l."DefaultTiming", 24.00,
  'Merchant CO₂ fill line commissioned Sep 18, ahead of commitment.',
  '2025-09-18', 1.2000, 24.000
FROM "KPI_Worksheets" w
JOIN "PerformanceCycles" c ON c."Id" = w."CycleId" AND c."Year" = 2025
JOIN "KPI_Library" l ON l."Measure" = 'On-time, on-spec startup'
WHERE w."EmployeeEmail" = 'daniel.okafor@pcigases.com'
  AND NOT EXISTS (SELECT 1 FROM "KPI_Measures" m WHERE m."WorksheetId" = w."Id" AND m."SortOrder" = 4);

INSERT INTO "KPI_Measures" (
  "WorksheetId", "LibraryKpiId", "SortOrder",
  "StrategicObjective", "KpiObjective", "Measure", "MeasureType",
  "Target", "Timing", "WeightPct", "MidYearCommentary",
  "NumericalResult", "ActualVsTargetRatio", "WeightedResultPct"
)
SELECT w."Id", l."Id", 5,
  l."StrategicObjective", l."KpiObjective", l."Measure", l."MeasureType",
  l."DefaultTarget", l."DefaultTiming", 13.00,
  'Operator certification reached 86% vs 90% target.',
  '86', 0.8600, 13.500
FROM "KPI_Worksheets" w
JOIN "PerformanceCycles" c ON c."Id" = w."CycleId" AND c."Year" = 2025
JOIN "KPI_Library" l ON l."Measure" = '% operators certified'
WHERE w."EmployeeEmail" = 'daniel.okafor@pcigases.com'
  AND NOT EXISTS (SELECT 1 FROM "KPI_Measures" m WHERE m."WorksheetId" = w."Id" AND m."SortOrder" = 5);

INSERT INTO "ExecutiveApprovals" ("CycleId", "DepartmentCode", "ApproverEmail", "Status", "ApprovedAt")
SELECT c."Id", 'OPS', 'ceo@pci.com', 'approved', '2025-02-25'::timestamptz
FROM "PerformanceCycles" c WHERE c."Year" = 2025
ON CONFLICT ("CycleId", "DepartmentCode", "ApproverEmail") DO NOTHING;

INSERT INTO "ExecutiveApprovals" ("CycleId", "DepartmentCode", "ApproverEmail", "Status", "ApprovedAt")
SELECT c."Id", 'FIN', 'cfo@pci.com', 'approved', '2025-02-25'::timestamptz
FROM "PerformanceCycles" c WHERE c."Year" = 2025
ON CONFLICT ("CycleId", "DepartmentCode", "ApproverEmail") DO NOTHING;
