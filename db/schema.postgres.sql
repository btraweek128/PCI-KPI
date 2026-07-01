-- PCI KPI Management — schema v2

CREATE TABLE IF NOT EXISTS "AppMeta" (
  "Key"       VARCHAR(100) PRIMARY KEY,
  "Value"     TEXT NOT NULL,
  "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Departments" (
  "Id"              SERIAL PRIMARY KEY,
  "Code"            VARCHAR(30)  NOT NULL UNIQUE,
  "Name"            VARCHAR(200) NOT NULL,
  "LeadEmail"       VARCHAR(255) NULL,
  "LeadName"        VARCHAR(200) NULL,
  "IsActive"        BOOLEAN NOT NULL DEFAULT TRUE,
  "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "EmployeeProfiles" (
  "Id"              SERIAL PRIMARY KEY,
  "PortalOid"       VARCHAR(64)  NULL,
  "EmployeeId"      VARCHAR(30)  NOT NULL UNIQUE,
  "Email"           VARCHAR(255) NOT NULL UNIQUE,
  "Name"            VARCHAR(200) NOT NULL,
  "Position"        VARCHAR(200) NULL,
  "DepartmentCode"  VARCHAR(30)  NOT NULL REFERENCES "Departments" ("Code"),
  "ManagerEmail"    VARCHAR(255) NULL,
  "SecondLevelManagerEmail" VARCHAR(255) NULL,
  "HireDate"        DATE NULL,
  "BaseSalary"      NUMERIC(12, 2) NULL,
  "TargetBonus"     NUMERIC(12, 2) NULL,
  "BonusLevelPct"   NUMERIC(5, 2) NULL,
  "IsActive"        BOOLEAN NOT NULL DEFAULT TRUE,
  "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "IX_EmployeeProfiles_ManagerEmail"
  ON "EmployeeProfiles" ("ManagerEmail");
CREATE INDEX IF NOT EXISTS "IX_EmployeeProfiles_DepartmentCode"
  ON "EmployeeProfiles" ("DepartmentCode");

CREATE TABLE IF NOT EXISTS "PerformanceCycles" (
  "Id"              SERIAL PRIMARY KEY,
  "Name"            VARCHAR(200) NOT NULL,
  "Year"            INT NOT NULL,
  "Tagline"         VARCHAR(255) NULL,
  "PeriodStart"     DATE NOT NULL,
  "PeriodEnd"       DATE NOT NULL,
  "WorkflowStage"   VARCHAR(50) NOT NULL DEFAULT 'kpi_setting',
  "Status"          VARCHAR(30) NOT NULL DEFAULT 'open',
  "KpiSettingOpens"       DATE NULL,
  "EmployeeSubmissionDue" DATE NULL,
  "ManagerApprovalDue"    DATE NULL,
  "RollupDue"             DATE NULL,
  "ExecutiveApprovalDue"  DATE NULL,
  "PayoutFinalized"       DATE NULL,
  "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "CycleSettings" (
  "CycleId"                 INT PRIMARY KEY REFERENCES "PerformanceCycles" ("Id") ON DELETE CASCADE,
  "TargetEbitda"            NUMERIC(14, 2) NULL,
  "ExpectedActualEbitda"    NUMERIC(14, 2) NULL,
  "PciMultiplierMax"        NUMERIC(6, 3) NOT NULL DEFAULT 1.500,
  "MaxCompanyPool"          NUMERIC(14, 2) NULL,
  "KpiAttainmentCap"        NUMERIC(6, 3) NOT NULL DEFAULT 1.500,
  "PciMultiplierFormula"    VARCHAR(30) NOT NULL DEFAULT 'linear',
  "UpdatedByEmail"          VARCHAR(255) NULL,
  "UpdatedAt"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "KPI_Library" (
  "Id"                  SERIAL PRIMARY KEY,
  "StrategicObjective"  VARCHAR(500) NOT NULL,
  "KpiObjective"        VARCHAR(500) NOT NULL,
  "Measure"             VARCHAR(500) NOT NULL,
  "MeasureType"         VARCHAR(30) NOT NULL DEFAULT 'higher_is_better',
  "DefaultTarget"       VARCHAR(200) NOT NULL,
  "DefaultTiming"       VARCHAR(100) NULL,
  "DefaultWeightPct"    NUMERIC(5, 2) NULL,
  "IsActive"            BOOLEAN NOT NULL DEFAULT TRUE,
  "CreatedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "KPI_Library_MeasureType_check"
    CHECK ("MeasureType" IN ('higher_is_better', 'lower_is_better', 'milestone_by_date'))
);

CREATE TABLE IF NOT EXISTS "TeamKpiSettings" (
  "Id"                SERIAL PRIMARY KEY,
  "CycleId"           INT NOT NULL REFERENCES "PerformanceCycles" ("Id") ON DELETE CASCADE,
  "ManagerEmail"      VARCHAR(255) NOT NULL,
  "LaunchPointRatio"  NUMERIC(6, 3) NOT NULL DEFAULT 0.800,
  "CreatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("CycleId", "ManagerEmail")
);

CREATE TABLE IF NOT EXISTS "TeamKpiAssignments" (
  "Id"              SERIAL PRIMARY KEY,
  "CycleId"         INT NOT NULL REFERENCES "PerformanceCycles" ("Id") ON DELETE CASCADE,
  "ManagerEmail"    VARCHAR(255) NOT NULL,
  "LibraryKpiId"    INT NOT NULL REFERENCES "KPI_Library" ("Id"),
  "SortOrder"       INT NOT NULL DEFAULT 0,
  "CreatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("CycleId", "ManagerEmail", "LibraryKpiId")
);

CREATE TABLE IF NOT EXISTS "KPI_Worksheets" (
  "Id"                    SERIAL PRIMARY KEY,
  "CycleId"               INT NOT NULL REFERENCES "PerformanceCycles" ("Id") ON DELETE CASCADE,
  "EmployeeEmail"         VARCHAR(255) NOT NULL,
  "Status"                VARCHAR(30) NOT NULL DEFAULT 'draft',
  "WorkflowStage"         VARCHAR(50) NOT NULL DEFAULT 'employee_submission',
  "MidYearCommentary"     TEXT NULL,
  "TotalKpiPct"           NUMERIC(8, 3) NULL,
  "CalculatedPayout"      NUMERIC(12, 2) NULL,
  "EmployeeSignedAt"      TIMESTAMPTZ NULL,
  "ManagerSignedAt"       TIMESTAMPTZ NULL,
  "SecondLevelSignedAt"   TIMESTAMPTZ NULL,
  "LastSavedAt"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "SubmittedAt"           TIMESTAMPTZ NULL,
  "CreatedAt"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("CycleId", "EmployeeEmail"),
  CONSTRAINT "KPI_Worksheets_Status_check"
    CHECK ("Status" IN ('draft', 'submitted', 'in_review', 'approved', 'returned'))
);

CREATE TABLE IF NOT EXISTS "KPI_Measures" (
  "Id"                  SERIAL PRIMARY KEY,
  "WorksheetId"         INT NOT NULL REFERENCES "KPI_Worksheets" ("Id") ON DELETE CASCADE,
  "LibraryKpiId"        INT NULL REFERENCES "KPI_Library" ("Id"),
  "SortOrder"           INT NOT NULL DEFAULT 0,
  "StrategicObjective"  VARCHAR(500) NOT NULL,
  "KpiObjective"        VARCHAR(500) NOT NULL,
  "Measure"             VARCHAR(500) NOT NULL,
  "MeasureType"         VARCHAR(30) NOT NULL DEFAULT 'higher_is_better',
  "Target"              VARCHAR(200) NOT NULL,
  "Timing"              VARCHAR(100) NULL,
  "WeightPct"           NUMERIC(5, 2) NOT NULL,
  "MidYearCommentary"   TEXT NULL,
  "NumericalResult"     VARCHAR(200) NULL,
  "ActualVsTargetRatio" NUMERIC(8, 4) NULL,
  "WeightedResultPct"   NUMERIC(8, 3) NULL,
  CONSTRAINT "KPI_Measures_MeasureType_check"
    CHECK ("MeasureType" IN ('higher_is_better', 'lower_is_better', 'milestone_by_date'))
);

CREATE TABLE IF NOT EXISTS "ApprovalLog" (
  "Id"          SERIAL PRIMARY KEY,
  "EntityType"  VARCHAR(50) NOT NULL,
  "EntityId"    INT NOT NULL,
  "ActorEmail"  VARCHAR(255) NOT NULL,
  "Action"      VARCHAR(50) NOT NULL,
  "Notes"       TEXT NULL,
  "CreatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ExecutiveApprovals" (
  "Id"              SERIAL PRIMARY KEY,
  "CycleId"         INT NOT NULL REFERENCES "PerformanceCycles" ("Id") ON DELETE CASCADE,
  "DepartmentCode"  VARCHAR(30) NOT NULL REFERENCES "Departments" ("Code"),
  "ApproverEmail"   VARCHAR(255) NOT NULL,
  "Status"          VARCHAR(30) NOT NULL DEFAULT 'pending',
  "ApprovedAt"      TIMESTAMPTZ NULL,
  "Notes"           TEXT NULL,
  UNIQUE ("CycleId", "DepartmentCode", "ApproverEmail"),
  CONSTRAINT "ExecutiveApprovals_Status_check"
    CHECK ("Status" IN ('pending', 'approved', 'rejected'))
);

INSERT INTO "AppMeta" ("Key", "Value")
VALUES ('schema_version', '2')
ON CONFLICT ("Key") DO UPDATE SET "Value" = EXCLUDED."Value", "UpdatedAt" = NOW();
