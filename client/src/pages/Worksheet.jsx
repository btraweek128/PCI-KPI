import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import './Worksheet.css';

export default function WorksheetView({ token }) {
  const { id } = useParams();
  const [worksheet, setWorksheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch(`/api/worksheets/${id}`, { token });
        setWorksheet(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, token]);

  if (loading) return <p className="muted">Loading worksheet…</p>;
  if (error) return <p className="error-banner">{error}</p>;
  if (!worksheet) return null;

  return (
    <div className="worksheet">
      <Link to="/" className="back-link">← Back to dashboard</Link>
      <header className="worksheet-header">
        <p className="hero-eyebrow">Form HR-KPI-01</p>
        <h1>{worksheet.employee.name}</h1>
        <p className="hero-sub">{worksheet.employee.position} · {worksheet.cycleName}</p>
      </header>

      <section className="card">
        <h2>Signatures (all required)</h2>
        <dl className="profile-list">
          <div>
            <dt>Employee</dt>
            <dd>{worksheet.signatures.employee.signedAt ? new Date(worksheet.signatures.employee.signedAt).toLocaleDateString() : 'Pending'}</dd>
          </div>
          <div>
            <dt>Manager</dt>
            <dd>{worksheet.signatures.manager.signedAt ? new Date(worksheet.signatures.manager.signedAt).toLocaleDateString() : 'Pending'}</dd>
          </div>
          <div>
            <dt>2nd Level Manager{worksheet.signatures.secondLevelManager.name ? ` (${worksheet.signatures.secondLevelManager.name})` : ''}</dt>
            <dd>{worksheet.signatures.secondLevelManager.signedAt ? new Date(worksheet.signatures.secondLevelManager.signedAt).toLocaleDateString() : 'Pending'}</dd>
          </div>
          <div>
            <dt>Signature complete</dt>
            <dd>{worksheet.signatures.complete ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
        {worksheet.cycleLocked && (
          <p className="muted">This cycle is locked — worksheet is read-only.</p>
        )}
      </section>

      <section className="card">
        <dl className="profile-list">
          <div><dt>Status</dt><dd>{worksheet.status}</dd></div>
          <div><dt>Total KPI %</dt><dd>{worksheet.totalKpiPct}%</dd></div>
          <div><dt>Calculated payout</dt><dd>${worksheet.calculatedPayout?.toLocaleString()}</dd></div>
          <div><dt>Launch point (manager)</dt><dd>{worksheet.launchPointRatio != null ? `${(worksheet.launchPointRatio * 100).toFixed(0)}%` : '—'}</dd></div>
        </dl>
      </section>

      <section className="card card-wide">
        <h2>Measures</h2>
        <div className="rollup-table-wrap">
          <table className="rollup-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Objective</th>
                <th>Type</th>
                <th>Target</th>
                <th>Result</th>
                <th>Weight</th>
                <th>Actual vs Target</th>
                <th>Weighted</th>
              </tr>
            </thead>
            <tbody>
              {worksheet.measures.map((m) => (
                <tr key={m.id}>
                  <td>{m.sortOrder}</td>
                  <td>{m.kpiObjective}</td>
                  <td>{m.measureTypeLabel}</td>
                  <td>{m.target}</td>
                  <td>{m.numericalResult ?? '—'}</td>
                  <td>{m.weightPct}%</td>
                  <td>{m.actualVsTargetRatio?.toFixed(2) ?? '—'}</td>
                  <td>{m.weightedResultPct?.toFixed(1) ?? '—'}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
