# Phase 2 — KPI Business Requirements

> **Status:** Confirmed by stakeholder (June 2025).  
> **Sources:** Standalone HTML prototype, `PCI_KPI_Workflow.pptx`, stakeholder Q&A.

The app is **KPI — Variable Pay Workflow** (Form **HR-KPI-01**, Rev. 2025). It manages annual performance cycles with a mid-year status check, tied to variable pay (bonus) calculations.

---

## Confirmed business rules

### KPI % and weighting

| Rule | Detail |
|------|--------|
| **Base formula** | `KPI % = (Numerical Result ÷ Target) × 100` |
| **Launch point (floor)** | **Manager-set** per team during KPI Setting (`TeamKpiSettings.LaunchPointRatio`). No company default — each manager defines the minimum attainment ratio before a measure earns payout credit. |
| **Max (cap)** | **Executive-set** per cycle via `CycleSettings.KpiAttainmentCap` (default 1.5× from prototype) |
| **Measure weights** | Must sum to **100%** across all objectives on a worksheet |
| **Weighted result** | `% Actual vs Target (capped) × Weight %` per line |
| **Total Individual KPI %** | Sum of weighted results across all measures |
| **Mid-year** | KPIs are set for the full year; mid-year evaluation captures status/commentary against the same measures (not a separate cycle) |

**Worksheet footnotes (from prototype):**

- Weights must add up to 100%.
- `% Actual vs Target` is capped at 1.5 (configurable max).
- KPI objectives must be SMART.

### Bonus / payout formula

```
Bonus Payout (full year) = Target Bonus × PCI Multiplier × Total Individual KPI %
```

| Input | Source |
|-------|--------|
| **Target Bonus** | Employee profile (HR seed data) |
| **PCI Multiplier** | Derived from Expected Actual EBITDA vs Target EBITDA (see below) |
| **Total Individual KPI %** | Calculated on worksheet (weighted sum) |

**PCI Multiplier (company EBITDA gate):**

- Compare **Expected Actual EBITDA** to **Target EBITDA** for the performance cycle.
- **Formula:** linear `Expected Actual ÷ Target`, capped at executive-configured maximum.
- **Executive-set limits:** `PciMultiplierMax` and `MaxCompanyPool` on `CycleSettings` (CEO/CFO configure during Executive Approval / cycle setup).
- Multiplier scales every employee payout (prototype example: Target $142.0M, Actual $150.5M → **1.06×**).
- Used on Department Roll-up and Executive Approval screens.

### KPI measure types

Each library item and worksheet measure has a **Measure Type** selector:

| Type | Label | Calculation |
|------|-------|-------------|
| `higher_is_better` | **Higher Is Better** | `Result ÷ Target` — higher numeric result vs target is better |
| `lower_is_better` | **Lower Is Better** | `Target ÷ Result` — lower numeric result vs target is better (e.g. TRIR) |
| `milestone_by_date` | **Milestone by Date** | On/before target date = full credit; early completion earns bonus up to cap; late completion reduces ratio |

Launch point (manager-set) zeroes out credit when ratio falls below the manager's floor.
Max attainment cap (executive-set) applies to all types.

### KPI library (manager-selected measures)

- HR maintains a **company KPI repository/library** (master list of strategic objectives, measures, default targets, timing).
- **Managers select KPIs from the library** for their team at cycle start (KPI Setting stage).
- Selected KPIs populate employee worksheets for the year.
- Managers may customize targets/timing per employee within guardrails (TBD: HR-configurable).
- Library items include: Strategic Objective, KPI Objective, Measure, default Target, Timing, suggested Weight %.

### Manager hierarchy

- **Manual configuration** in Postgres (seed data / CSV upload).
- Rationale: currently on **Paychex**, migrating to **ADP** — no live HRIS feed in Phase 2.
- **Paychex CSV columns:** TBD — pilot POC uses hand-authored seed data (`db/seed_pilot.postgres.sql`).
- Seed fields: employee ID, email, name, position, department, manager email, hire date, base salary, target bonus.
- Portal session provides identity (`email`, `name`, `department`); HR seed enriches with org data.

### Roles and permissions

| Role | Who | Capabilities |
|------|-----|--------------|
| **Employee** | All staff in cycle | Complete worksheet, save draft, submit, mid-year commentary |
| **Manager** | Direct supervisor (from seed) | Select team KPIs from library, review/approve/return worksheets |
| **HR Admin** | HR team (`isHrAdmin` / `isAdmin`) | Cycle config, KPI library, seed data, key dates, EBITDA settings, launch/max caps, **export/print by department** |
| **Executive** | **CEO + CFO** | Sign off on department roll-up and company-wide pool (Executive Approval) |
| **Department lead** | Optional view | Monitor roll-up for their department (may overlap with manager) |

Portal JWT provides identity only. App roles assigned via seed data + env lists (`KPI_ADMIN_EMAILS`, `KPI_EXECUTIVE_EMAILS`).

**Executive approval:** CEO and CFO sign off on the roll-up before Payout Lock.

### Notifications

- **Email reminders** like WCR (SMTP env vars, console fallback in dev).
- Trigger examples: submission due, manager approval due, worksheet returned, executive approval pending, cycle stage transitions.
- Configurable reminder lead time (e.g. `REMINDER_MIN_DAYS` like WCR).

### Export and print

- **HR Admin only:** export Form HR-KPI-01 as **PDF** and **Excel**.
- **Print by department** — batch export/print all worksheets in a department for a cycle.
- Include bonus calculation, signatures/approval timestamps, and mid-year commentary.

---

## Workflow stages (6 stages)

From PPTX / prototype:

| # | Stage | Description |
|---|-------|-------------|
| 1 | **KPI Setting** | Managers select library KPIs for team; HR opens cycle |
| 2 | **Employee Submission** | Employees complete worksheets and submit |
| 3 | **Manager Approval** | Managers approve or return direct reports |
| 4 | **Department Roll-up & Report** | Aggregate by department; projected payout |
| 5 | **Executive Approval** | CEO/CFO sign off per department + company pool |
| 6 | **Payout Lock** | Cycle finalized; worksheets read-only |

Each worksheet tracks **Workflow Stage** and **Status** (Draft, Submitted, In Review, Approved, Returned). All transitions logged in `ApprovalLog`.

**Example key dates (FY2025 from PPTX):**

| Milestone | Date |
|-----------|------|
| KPI setting opens | Jan 6 |
| Employee submission due | Jan 31 |
| Manager approval due | Feb 14 |
| Roll-up & reporting | Feb 21 |
| Executive approval | Feb 28 |
| Payout finalized | Mar 14 |

---

## Screens to build

### 1. Cycle Dashboard

- Active cycle summary (e.g. FY2025 Annual KPI & Variable Pay).
- Progress by stage with counts (e.g. 187/233 worksheets submitted).
- Summary tiles: projected payout pool, avg KPI attainment, PCI EBITDA multiplier, depts approved.
- **Your action items** — role-aware pending tasks.
- **Key dates** timeline.
- **View as** — HR admin role switcher (Employee / Manager / Executive preview).

### 2. KPI Worksheet — Form HR-KPI-01

Employee worksheet per cycle:

**Header:** Employee name, position, employee ID, hire date, department, years of service, supervisor, performance period.

**Measures grid (up to 5 objectives):**

| Col | Field |
|-----|-------|
| No. | Line number |
| Strategic Objectives | From library |
| KPI – Objectives | From library |
| Measures | From library |
| Target | Editable within guardrails |
| Timing | e.g. FY/Q4 |
| Weight % | Must sum to 100% |
| Mid-Year / Performance Commentary | Text |
| Result % | Calculated |
| Numerical Result | Employee/manager input |
| % Actual vs Target | `(Result ÷ Target)` capped at max setting |
| Weighted Result % | `% Actual vs Target × Weight %` |

**Actions:** Save draft, Submit for approval.

**Bonus Calculation panel (read-only preview):**

- Target EBITDA, Expected Actual EBITDA
- Total Individual KPI %
- PCI Multiplier %
- Employee Bonus Level, Base Salary, Target Bonus
- **Calculated Payout**

**Signatures:** Employee, Manager, and **2nd Level Manager** (all **required** before a worksheet is considered fully approved). Stored on `KPI_Worksheets` as `EmployeeSignedAt`, `ManagerSignedAt`, `SecondLevelSignedAt`. The 2nd level manager is assigned per employee in seed data (`SecondLevelManagerEmail`).

### Payout Lock and historical cycles

- When a cycle reaches **Payout Lock** (`WorkflowStage = payout_lock` or `Status = locked/closed`), **all worksheets and cycle settings become read-only**.
- Historical cycles remain viewable for audit and HR export but cannot be edited.
- HR Admin may still export/print locked cycles; no data mutations allowed.

### Paychex employee import (TBD)

Employee seed data will support CSV upload when Paychex export format is finalized. Planned endpoint: `POST /api/admin/seed/employees`.

**Expected columns (draft — map to Paychex export when available):**

| App field | Paychex column (TBD) |
|-----------|----------------------|
| `EmployeeId` | TBD |
| `Email` | TBD |
| `Name` | TBD |
| `Position` | TBD |
| `DepartmentCode` | TBD |
| `ManagerEmail` | TBD |
| `SecondLevelManagerEmail` | TBD |
| `HireDate` | TBD |
| `BaseSalary` | TBD |
| `TargetBonus` | TBD |
| `BonusLevelPct` | TBD |

Until Paychex mapping is confirmed, use `db/seed_pilot.postgres.sql` for POC data.

### 3. Manager Review

- Direct reports list with status, weight check, KPI %, est. payout.
- Actions: Approve, Return.
- Approval due date banner.
- Team payout estimate.

### 4. KPI Library (HR Admin + Manager selection)

- HR Admin: CRUD company KPI repository.
- Manager (KPI Setting stage): pick library items for team → generates worksheets.

### 5. Department Roll-up

- Company EBITDA multiplier applied.
- Table: Department, Headcount, Submitted, Avg KPI %, Target Pool, Projected Payout.
- Company total row.
- Drill-down to employee worksheets.

### 6. Executive Approval

- **Company EBITDA Gate** — model Expected Actual EBITDA vs Target; show PCI Multiplier.
- Total approved payout vs pending vs modeled company pool.
- Per-department cards: manager, headcount, avg KPI, pools, Approve button.
- CEO/CFO sign-off.

### 7. HR Export / Print

- Export PDF or Excel for HR Admin.
- Filter by department, cycle.
- Batch print by department.

---

## Data model (Postgres)

| Table | Purpose |
|-------|---------|
| `PerformanceCycles` | Name, year, period dates, status, stage, key dates |
| `CycleSettings` | Target EBITDA, launch point, KPI max cap, PCI multiplier max, max company pool |
| `Departments` | Code, name, department lead email |
| `EmployeeProfiles` | portal_oid, email, name, employee_id, department, manager_email, hire_date, base_salary, target_bonus, bonus_level_pct |
| `KPI_Library` | Strategic objective, kpi_objective, measure, default_target, default_timing, default_weight, active |
| `TeamKPIAssignments` | cycle_id, manager_email, library_kpi_id, team scope |
| `KPI_Worksheets` | employee, cycle, status, workflow_stage, commentary, total_kpi_pct, calculated_payout |
| `KPI_Measures` | worksheet line items: library ref, target, timing, weight, numerical_result, commentary |
| `ApprovalLog` | entity, actor, action, timestamp, notes |
| `ExecutiveApprovals` | cycle, department, approver_email, status, approved_at |
| `NotificationLog` | email audit trail (optional, like WCR pattern) |

No local login/password table — identity from portal JWT only.

---

## API surface (Phase 2)

### Cycles & settings (HR Admin)
- `GET/POST /api/cycles`
- `PUT /api/cycles/:id/settings`
- `GET /api/cycles/:id/dashboard`

### KPI library
- `GET/POST/PUT /api/kpi-library`
- `POST /api/cycles/:id/team-kpis` — manager assigns library KPIs to team

### Worksheets
- `GET /api/worksheets/mine`
- `GET/PUT /api/worksheets/:id`
- `POST /api/worksheets/:id/submit`
- `POST /api/worksheets/:id/midyear` — mid-year commentary update

### Manager
- `GET /api/manager/inbox`
- `GET /api/manager/direct-reports`
- `POST /api/worksheets/:id/review` — approve | return

### Roll-up & executive
- `GET /api/departments/rollup?cycle=:id`
- `GET /api/executive/approval?cycle=:id`
- `POST /api/executive/approval/:deptId` — CEO/CFO approve

### Export (HR Admin)
- `GET /api/export/worksheet/:id.pdf`
- `GET /api/export/worksheet/:id.xlsx`
- `GET /api/export/department/:deptId.pdf?cycle=:id`

### Admin / seed
- `POST /api/admin/seed/employees` — CSV upload or JSON
- `GET /api/admin/employees`

### Notifications
- Background job or cron endpoint for reminder emails (mirror WCR SMTP pattern).

---

## Calculation reference (from PPTX example)

**Daniel Okafor worksheet:**

| Measure | Target | Result | % Actual vs Target | Weight | Weighted |
|---------|--------|--------|-------------------|--------|----------|
| On-stream availability | ≥98.5% | 99.1% | 1.10 | 25% | 27.5% |
| TRIR | ≤0.50 | 0.32 | 1.25 | 25% | 25.0% |
| kWh/ton O₂ | −3% YoY | −3.8% | 1.15 | 23% | 23.0% |
| CO₂ line startup | Sep 30 | Sep 18 | 1.20 | 24% | 24.0% |
| Operator certification | 90% | 86% | 0.86 | 13% | 13.5% |

**Total Individual KPI %:** 113.0%  
**Target Bonus:** $37,000 · **PCI Multiplier:** 106% · **Calculated Payout:** $44,313

---

## Environment variables (Phase 2 additions)

| Variable | Purpose |
|----------|---------|
| `KPI_ADMIN_EMAILS` | HR admin / export access |
| `KPI_EXECUTIVE_EMAILS` | CEO, CFO executive approval |
| `SMTP_*` | Email notifications (same pattern as WCR) |
| `REMINDER_MIN_DAYS` | Days before due date to send reminder |

---

## Design

- Background: `#0E1A52` (dark navy)
- Accent: `#A9B5E8`
- Match PPTX / standalone HTML layouts
- Multi-page React (Vite + React Router), same stack as WCR

---

## Implementation order (suggested)

1. Schema + seed data (employees, departments, KPI library)
2. Cycle settings + KPI library CRUD (HR Admin)
3. Manager KPI selection → worksheet generation
4. Employee worksheet + calculations
5. Manager review workflow
6. Department roll-up + PCI multiplier
7. Executive approval (CEO/CFO)
8. Email notifications
9. PDF/Excel export by department
10. Payout Lock + read-only archive

---

## Pilot POC (implemented)

Schema v2, pilot seed, and read APIs are in place:

- `db/schema.postgres.sql` — full Phase 2 tables
- `db/seed_pilot.postgres.sql` — FY2025 cycle, 6 departments, 10 employees, 5 library KPIs, Daniel Okafor worksheet
- `GET /api/cycles/active`, `GET /api/cycles/:id/dashboard`
- `GET /api/kpi-library`, `GET /api/kpi-library/types`
- `GET /api/worksheets/mine`, `GET /api/worksheets/:id`
- `api/services/kpiCalculations.js` — measure type logic + PCI multiplier
- `api/services/cycleGuards.js` — payout lock read-only rules + required signature checks

Run `node scripts/init-db.js` with `DATABASE_URL` set to load pilot data.

---

## Remaining open items

1. **Milestone late penalty curve** — refine days-late degradation (POC uses linear 30-day window).
2. **Paychex CSV column mapping** — confirm field names when export is available (import path is planned; see Paychex section above).

---

## Out of scope (Phase 2)

- Live Paychex / ADP integration
- Payroll system export
- Modifications to Intranet Hub or WCR repos
