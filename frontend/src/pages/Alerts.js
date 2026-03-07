import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";

import API from "../api/config";

function AlertTable({ members, type }) {
  if (members.length === 0) {
    return (
      <div className="empty-state">
        {type === "expiring"
          ? "✅ No memberships expiring in this window"
          : "✅ No expired memberships"}
      </div>
    );
  }

  const today = new Date();

  return (
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
          const diff = Math.ceil((new Date(m.expiration_date) - today) / (1000 * 60 * 60 * 24));
          const label = type === "expiring" ? `${diff}d left` : `${Math.abs(diff)}d ago`;
          const badgeCls = type === "expiring" ? "badge-expiring" : "badge-expired";
          return (
            <tr key={m.id}>
              <td style={{ fontWeight: 600 }}>{m.name}</td>
              <td style={{ color: "var(--muted)", fontSize: 12 }}>{m.email || "—"}</td>
              <td style={{ color: "var(--muted)", fontSize: 12 }}>{m.phone || "—"}</td>
              <td>
                <span className="badge" style={{ background: "rgba(232,255,0,0.1)", color: "var(--accent)" }}>
                  {m.plan}
                </span>
              </td>
              <td style={{ fontSize: 12 }}>{m.expiration_date}</td>
              <td><span className={`badge ${badgeCls}`}>{label}</span></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Alerts() {
  const [data, setData] = useState({ expiring_soon: [], expired: [] });
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/expiring?days=${days}`);
      setData(res.data);
    } catch {
      setError("Could not load alerts. Is the server running?");
    }
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
          <button
            key={d}
            className={`btn ${days === d ? "btn-primary" : "btn-ghost"} btn-sm`}
            onClick={() => setDays(d)}
          >
            {d} days
          </button>
        ))}
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="alerts-section">
        <h3>
          ⚠ Expiring Soon
          <span className="badge badge-expiring" style={{ marginLeft: 10 }}>
            {data.expiring_soon.length}
          </span>
        </h3>
        <div className="card">
          {loading
            ? <div className="empty-state">Loading...</div>
            : <AlertTable members={data.expiring_soon} type="expiring" />}
        </div>
      </div>

      <div className="alerts-section">
        <h3>
          ❌ Expired Memberships
          <span className="badge badge-expired" style={{ marginLeft: 10 }}>
            {data.expired.length}
          </span>
        </h3>
        <div className="card">
          {loading
            ? <div className="empty-state">Loading...</div>
            : <AlertTable members={data.expired} type="expired" />}
        </div>
      </div>
    </Layout>
  );
}

export default Alerts;
