import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

function AlertTable({ members, type }) {
  if (members.length === 0) {
    return (
      <div className="empty-state">
        {type === "expiring" ? "✅ No memberships expiring in this window" : "✅ No expired memberships"}
      </div>
    );
  }
  const today = new Date();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th>
            <th>Plan</th><th>{type === "expiring" ? "Expires" : "Expired On"}</th>
            <th>{type === "expiring" ? "Days Left" : "Days Ago"}</th>
          </tr>
        </thead>
        <tbody>
          {members.map(m => {
            const diff  = Math.ceil((new Date(m.expiration_date) - today) / 864e5);
            const label = type === "expiring" ? `${diff}d left` : `${Math.abs(diff)}d ago`;
            return (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td style={{ color: "var(--muted)", fontSize: 12 }}>{m.email || "—"}</td>
                <td style={{ color: "var(--muted)", fontSize: 12 }}>{m.phone || "—"}</td>
                <td><span className="badge" style={{ background: "rgba(232,255,0,0.1)", color: "var(--accent)" }}>{m.plan}</span></td>
                <td style={{ fontSize: 12 }}>{m.expiration_date}</td>
                <td><span className={`badge ${type === "expiring" ? "badge-expiring" : "badge-expired"}`}>{label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Alerts() {
  const [data, setData]     = useState({ expiring_soon: [], expired: [] });
  const [days, setDays]     = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const mounted = useRef(true);

  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get(`/expiring?days=${days}`);
      if (mounted.current) setData(res.data);
    } catch { setError("Could not load alerts. Is the server running?"); }
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  return (
    <Layout>
      <div className="page-header">
        <h2>Alerts</h2>
        <p>Monitor expiring and expired memberships</p>
      </div>

      <div className="toolbar" style={{ marginBottom: 28 }}>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>Show expiring within:</span>
        {[3, 7, 14, 30].map(d => (
          <button key={d} className={`btn ${days === d ? "btn-primary" : "btn-ghost"} btn-sm`}
            onClick={() => setDays(d)}>{d} days</button>
        ))}
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="alerts-section">
        <h3>
          ⚠ Expiring Soon
          <span className="badge badge-expiring" style={{ marginLeft: 10 }}>{data.expiring_soon.length}</span>
        </h3>
        <div className="card">
          {loading ? <div className="empty-state">Loading...</div> : <AlertTable members={data.expiring_soon} type="expiring" />}
        </div>
      </div>

      <div className="alerts-section">
        <h3>
          ❌ Expired Memberships
          <span className="badge badge-expired" style={{ marginLeft: 10 }}>{data.expired.length}</span>
        </h3>
        <div className="card">
          {loading ? <div className="empty-state">Loading...</div> : <AlertTable members={data.expired} type="expired" />}
        </div>
      </div>
    </Layout>
  );
}

export default Alerts;
