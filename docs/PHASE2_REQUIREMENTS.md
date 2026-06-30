# Phase 2 — KPI Business Requirements (draft)

> **Status:** Draft derived from the standalone HTML prototype (`PCI KPI Workflow (standalone).html`).  
> **Action required:** Review and confirm with stakeholders before implementation begins.

The standalone app is titled **"KPI — Variable Pay Workflow"** (Form **HR-KPI-01**, Rev. 2025). It manages annual/mid-year performance cycles tied to variable pay (bonus) calculations.

---

## User roles

| Role | Capabilities (from prototype) |
|------|-------------------------------|
| **Employee** | Complete KPI worksheet, save draft, submit for manager approval |
| **Manager** | Review direct-report worksheets, approve or return |
| **Department lead / HR** | View department roll-up, monitor submission progress |
| **Executive** | Company-wide approval gate, EBITDA / payout pool sign-off |
| **Admin** | Cycle configuration, key dates, target pools, PCI multiplier |

Users are identified via portal session (`email`, `name`, `department`). Role assignment TBD — likely by email list, department, or manager hierarchy in Postgres (not a local login table).

---

## Screens to recreate

### 1. Cycle Dashboard (home for active cycle)

- **Performance cycle** selector / current cycle summary
- **Cycle progress by stage** — workflow funnel (Employee → Manager Review → Department Roll-up → Executive Approval)
- **Key dates** and **Timing** (e.g. approval due dates)
- **Your action items** — pending tasks for current user
- Summary tiles: worksheets submitted, projected payout pool, pending exec approval
- **View as** — role switcher for admins (prototype feature)

### 2. KPI Worksheet (Employee) — Form HR-KPI-01

Per-employee worksheet for a performance cycle:

- Employee info (from portal session)
- **Measures** grid:
  - Measure name
  - **Target**
  - **Numerical Result**
  - **KPI %** (calculated)
  - Weight (if applicable — confirm in requirements)
- **Strategic Objectives** (text)
- **Mid-Year / Performance Commentary** (text)
- **Status**: Draft → Submitted → …
- Actions: **Save draft**, **Submit for approval**
- Read-only **Bonus Calculation** preview:
  - Target Pool, Calculated Payout, Est. Payout, PCI Multiplier

### 3. Manager Review

- Inbox of submitted worksheets for direct reports
- Open worksheet (read-only or editable commentary)
- Approve / return for changes
- Show **Workflow Stage** and due dates (e.g. "Approval due Feb 14, 2025")

### 4. Department Roll-up

- **Variable pay roll-up by department**
- Table columns (from prototype):
  - Department
  - Headcount
  - Submitted count
  - Avg KPI %
  - Target Pool
  - Projected Payout
- Drill-down to employee worksheets

### 5. Executive Approval

- Company totals: **Target EBITDA**, **Expected Actual EBITDA**, **Company EBITDA Gate**
- **PCI Multiplier** — scales every payout; adjust expected EBITDA to model company-wide pool
- **Modeled company pool** vs **Total approved payout**
- Executive approve / reject entire cycle stage
- Status: "Executive Approval in progress", "Pending exec approval"

### 6. Bonus Calculation / Company pool modeling

- Company-level EBITDA gate logic
- PCI multiplier applied to all payouts
- **Projected payout pool** vs approved totals
- Used on dashboard and executive screen

---

## Workflow stages

From prototype labels:

1. **Employee** — draft / submit worksheet
2. **Manager Review** — manager approval
3. **Department Roll-up** — aggregate by department
4. **Executive Approval** — final company gate

Each worksheet tracks **Workflow Stage** and **Status**. Transitions should be auditable (who, when, action).

---

## Data model (proposed Postgres schema)

| Entity | Purpose |
|--------|---------|
| `PerformanceCycles` | Cycle name, year, key dates, status (open/closed) |
| `CycleSettings` | Target EBITDA, PCI multiplier rules, company target pool |
| `Departments` | Department codes/names (may mirror portal `department`) |
| `EmployeeProfiles` | `portal_oid`, email, name, department, manager_email |
| `KPI_Worksheets` | One per employee per cycle; status, workflow_stage, commentary |
| `KPI_Measures` | Line items on a worksheet: name, target, result, weight, kpi_pct |
| `ApprovalLog` | Stage transitions: actor, action, timestamp, notes |
| `DepartmentRollups` | Cached aggregates per cycle/department (optional materialized view) |

No local password/user table — identity comes from portal JWT handoff only.

---

## API surface (Phase 2 sketch)

- `GET/POST /api/cycles` — list/create cycles (admin)
- `GET /api/cycles/:id/dashboard` — role-aware dashboard payload
- `GET/PUT /api/worksheets/:id` — employee worksheet CRUD
- `POST /api/worksheets/:id/submit` — submit for approval
- `GET /api/manager/inbox` — pending reviews
- `POST /api/worksheets/:id/review` — manager approve/return
- `GET /api/departments/rollup?cycle=:id` — department roll-up
- `GET/POST /api/executive/approval` — executive gate
- `GET /api/bonus/calculation?cycle=:id` — pool modeling

---

## Open questions for stakeholders

Please confirm before Phase 2 build:

1. **Measure templates** — fixed company-wide KPIs or configurable per cycle/department?
2. **KPI % formula** — `(result / target) * 100`, capped/floor rules?
3. **PCI Multiplier** — exact formula from Expected vs Target EBITDA?
4. **Manager hierarchy** — source of truth (Epicor, AD, manual CSV, portal)?
5. **Weighting** — do measures have weights that must sum to 100%?
6. **Mid-year vs annual** — one cycle type or separate flows?
7. **Notifications** — email reminders like WCR (SMTP)?
8. **Historical cycles** — read-only archive or editable after executive approval?
9. **Admin list** — who gets `isAdmin` and executive approval rights?
10. **Export** — PDF/Excel of Form HR-KPI-01 required?

---

## Design

- Background: `#0E1A52` (dark navy)
- Accent: `#A9B5E8`
- Match standalone HTML layout and typography where practical
- Multi-page React app (same stack as WCR: Vite + React Router)

---

## Out of scope (Phase 2 unless confirmed)

- Epicor / HRIS integration
- Payroll export
- Modifications to Intranet Hub or WCR repos
