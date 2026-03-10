import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "../api/config";
import Layout from "../components/Layout";

const WAKE_TIMEOUT_MS = 8000; // if no response in 8s, show "server waking up" message

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

function LoadingState({ waking, onRetry }) {
  if (waking) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "32px 16px", gap: 12
      }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        <div style={{ fontWeight: 700, color: "var(--accent)", fontSize: 15 }}>Server is waking up...</div>
        <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", maxWidth: 300 }}>
          The backend is starting up from sleep mode.<br />This usually takes 20–40 seconds.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <div style={{
            width: 18, height: 18, border: "2px solid rgba(232,255,0,0.2)",
            borderTop: "2px solid #e8ff00", borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
          }} />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Please wait...</span>
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={onRetry}>
          ↺ Retry Now
        </button>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", gap: 10 }}>
      <div style={{
        width: 18, height: 18, border: "2px solid rgba(232,255,0,0.2)",
        borderTop: "2px solid #e8ff00", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <span style={{ color: "var(--muted)", fontSize: 13 }}>Loading...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Alerts() {
  const [data, setData]       = useState({ expiring_soon: [], expired: [] });
  const [days, setDays]       = useState(7);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking]   = useState(false);
  const [error, setError]     = useState("");
  const mounted  = useRef(true);
  const wakeTimer = useRef(null);

  useEffect(() => { return () => { mounted.current = false; clearTimeout(wakeTimer.current); }; }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setWaking(false);
    setError("");

    // If no response in WAKE_TIMEOUT_MS, show waking message
    wakeTimer.current = setTimeout(() => {
      if (mounted.current) setWaking(true);
    }, WAKE_TIMEOUT_MS);

    try {
      const res = await api.get(`/expiring?days=${days}`);
      clearTimeout(wakeTimer.current);
      if (mounted.current) {
        setData(res.data);
        setWaking(false);
      }
    } catch {
      clearTimeout(wakeTimer.current);
      if (mounted.current) {
        setError("Could not load alerts. The server may be unavailable.");
        setWaking(false);
      }
    }
    if (mounted.current) setLoading(false);
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
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          ↺ Refresh
        </button>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <span>⚠ {error}</span>
          <button className="btn btn-ghost btn-sm" onClick={load}>Retry</button>
        </div>
      )}

      <div className="alerts-section">
        <h3>
          ⚠ Expiring Soon
          <span className="badge badge-expiring" style={{ marginLeft: 10 }}>{data.expiring_soon.length}</span>
        </h3>
        <div className="card">
          {loading
            ? <LoadingState waking={waking} onRetry={load} />
            : <AlertTable members={data.expiring_soon} type="expiring" />}
        </div>
      </div>

      <div className="alerts-section">
        <h3>
          ❌ Expired Memberships
          <span className="badge badge-expired" style={{ marginLeft: 10 }}>{data.expired.length}</span>
        </h3>
        <div className="card">
          {loading
            ? <LoadingState waking={waking} onRetry={load} />
            : <AlertTable members={data.expired} type="expired" />}
        </div>
      </div>
    </Layout>
  );
}

export default Alerts;
