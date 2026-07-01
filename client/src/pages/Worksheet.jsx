import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import './Worksheet.css';

function fmt(v, decimals = 2) {
  if (v === null || v === undefined) return '—';
  return Number(v).toFixed(decimals);
}

function money(v) {
  if (!v) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
}

function sigDate(ts) {
  if (!ts) return 'Pending';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function WorksheetView({ token }) {
  const { id } = useParams();
  const [ws, setWs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch(`/api/worksheets/${id}`, { token });
        setWs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, token]);

  if (loading) return <p className="muted" style={{ padding: 28 }}>Loading worksheet…</p>;
  if (error)   return <p className="error-banner" style={{ margin: 28 }}>{error}</p>;
  if (!ws)     return null;

  const emp = ws.employee ?? {};
  const sigs = ws.signatures ?? {};

  const identity = [
    ['Employee Name',      emp.name],
    ['Position',           emp.position],
    ['Employee ID',        emp.employeeId ?? '—'],
    ['Hire Date',          emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'],
    ['Department',         emp.department],
    ['Years of Service',   emp.yearsOfService ?? '—'],
    ['Supervisor',         emp.managerEmail ?? '—'],
    ['Performance Period', ws.cycleName ?? 'FY2025'],
  ];

  return (
    <div className="page-wrap ws-outer">
      {/* action bar */}
      <div className="ws-action-bar">
        <div className="ws-action-left">
          <Link to="/" className="ws-back">← Dashboard</Link>
          <span className={`pill ${ws.cycleLocked ? 'pill-gray' : ws.status === 'approved' ? 'pill-green' : ws.status === 'submitted' ? 'pill-blue' : 'pill-amber'}`}>
            {ws.cycleLocked ? 'Locked' : ws.status ?? 'Draft'}
          </span>
          {ws.savedAt && <span className="ws-saved">Last saved {new Date(ws.savedAt).toLocaleString()}</span>}
        </div>
        {!ws.cycleLocked && (
          <div className="ws-action-right">
            <button className="btn-outline">Save draft</button>
            <button className="btn-primary">Submit for approval</button>
          </div>
        )}
      </div>

      {/* ── THE EXCEL FORM ── */}
      <div className="xl-form">
        {/* form header band */}
        <div className="xl-form-header">
          <div className="xl-header-logo">
            <span className="xl-logo-text">PCI</span>
            <span className="xl-logo-sub">Gases</span>
          </div>
          <div className="xl-header-center">
            <div className="xl-form-title">KEY PERFORMANCE INDICATOR (KPI) FORM</div>
            <div className="xl-form-period">Performance Period: January 1, 2025 – December 31, 2025</div>
          </div>
          <div className="xl-header-formno">
            Form HR-KPI-01<br />Rev. 2025
          </div>
        </div>

        {/* identity grid */}
        <div className="xl-identity">
          {identity.map(([label, value], i) => (
            <div key={i} className="xl-identity-row">
              <div className="xl-identity-label">{label}</div>
              <div className="xl-identity-value">{value ?? '—'}</div>
            </div>
          ))}
        </div>

        {/* KPI measures table */}
        <div className="xl-table-wrap">
          <table className="xl-table">
            <thead>
              <tr>
                <th className="xl-th" style={{ width: 34 }}>No.</th>
                <th className="xl-th xl-th-left" style={{ width: 155 }}>Strategic Objectives</th>
                <th className="xl-th xl-th-left" style={{ width: 215 }}>KPI – Objectives</th>
                <th className="xl-th xl-th-left" style={{ width: 135 }}>Measures</th>
                <th className="xl-th xl-th-left" style={{ width: 105 }}>Target</th>
                <th className="xl-th" style={{ width: 64 }}>Timing</th>
                <th className="xl-th xl-th-accent" style={{ width: 62 }}>Weight&nbsp;%</th>
                <th className="xl-th xl-th-left" style={{ width: 240 }}>Mid-Year / Performance Commentary</th>
                <th className="xl-th xl-th-accent" style={{ width: 62 }}>Result&nbsp;%</th>
                <th className="xl-th" style={{ width: 70 }}>Numerical Result</th>
                <th className="xl-th xl-th-accent" style={{ width: 78 }}>% Actual vs Target<br /><span style={{ fontWeight: 400, fontSize: 10 }}>(Max 1.5)</span></th>
                <th className="xl-th" style={{ width: 78 }}>Weighted Result&nbsp;%</th>
              </tr>
            </thead>
            <tbody>
              {(ws.measures ?? []).map((m) => (
                <tr key={m.id} className="xl-row">
                  <td className="xl-td xl-td-center xl-td-no">{m.sortOrder}</td>
                  <td className="xl-td">{m.strategicObjective ?? '—'}</td>
                  <td className="xl-td">{m.kpiObjective}</td>
                  <td className="xl-td xl-td-muted">{m.measure ?? m.measureTypeLabel}</td>
                  <td className="xl-td">{m.target}</td>
                  <td className="xl-td xl-td-center">{m.timing ?? '—'}</td>
                  <td className="xl-td xl-td-input">
                    <span className="xl-input-val">{m.weightPct != null ? `${m.weightPct}%` : '—'}</span>
                  </td>
                  <td className="xl-td xl-td-commentary">{m.commentary ?? ''}</td>
                  <td className="xl-td xl-td-input">
                    <span className="xl-input-val">{m.resultPct != null ? fmt(m.resultPct, 1) : '—'}</span>
                  </td>
                  <td className="xl-td xl-td-center">{m.numericalResult ?? '—'}</td>
                  <td className="xl-td xl-td-input">
                    <span className="xl-input-val">{m.actualVsTargetRatio != null ? fmt(m.actualVsTargetRatio, 2) : '—'}</span>
                  </td>
                  <td className="xl-td xl-td-center xl-td-weighted">
                    {m.weightedResultPct != null ? `${fmt(m.weightedResultPct, 1)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* totals + bonus calc */}
        <div className="xl-footer-grid">
          {/* notes / footnotes */}
          <div className="xl-footnotes">
            <div className="xl-footnote-title">Notes</div>
            <ul className="xl-footnote-list">
              <li>Weights must add up to 100%.</li>
              <li>% Actual vs Target is capped at 1.5 (configurable max).</li>
              <li>KPI objectives must be SMART.</li>
            </ul>
          </div>

          {/* bonus panel */}
          <div className="xl-bonus">
            <div className="xl-bonus-title">Bonus Calculation</div>
            <div className="xl-bonus-grid">
              <div className="xl-bonus-row">
                <span>Total Individual KPI %</span>
                <span className="xl-bonus-val highlight">{ws.totalKpiPct != null ? `${ws.totalKpiPct}%` : '—'}</span>
              </div>
              <div className="xl-bonus-row">
                <span>PCI Multiplier</span>
                <span className="xl-bonus-val">{ws.pciMultiplier != null ? `${(ws.pciMultiplier * 100).toFixed(0)}%` : '—'}</span>
              </div>
              <div className="xl-bonus-row">
                <span>Base Salary</span>
                <span className="xl-bonus-val">{money(emp.baseSalary)}</span>
              </div>
              <div className="xl-bonus-row">
                <span>Target Bonus</span>
                <span className="xl-bonus-val">{money(emp.targetBonus)}</span>
              </div>
              <div className="xl-bonus-row xl-bonus-total">
                <span>Calculated Payout</span>
                <span className="xl-bonus-val">{money(ws.calculatedPayout)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* signatures */}
        <div className="xl-sigs">
          <div className="xl-sig-title">Signatures (all required)</div>
          <div className="xl-sig-grid">
            {[
              ['Employee',          sigs.employee?.signedAt,           emp.name],
              ['Manager',           sigs.manager?.signedAt,            sigs.manager?.name],
              ['2nd Level Manager', sigs.secondLevelManager?.signedAt, sigs.secondLevelManager?.name],
            ].map(([role, ts, name]) => (
              <div key={role} className="xl-sig-box">
                <div className="xl-sig-role">{role}</div>
                {name && <div className="xl-sig-name">{name}</div>}
                <div className={`xl-sig-status ${ts ? 'signed' : 'pending'}`}>
                  {ts ? `✓ Signed ${sigDate(ts)}` : 'Pending'}
                </div>
              </div>
            ))}
          </div>
          {ws.cycleLocked && (
            <div className="xl-locked-note">This cycle is locked — worksheet is read-only.</div>
          )}
        </div>
      </div>
    </div>
  );
}
