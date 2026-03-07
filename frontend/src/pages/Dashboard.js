import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";

import API from "../api/config";

const DEFAULT_STATS = {
  total_members: 0, active_members: 0, revenue: 0, new_this_month: 0,
  walkin_revenue_today: 0, walkin_count_today: 0, members_in_gym: 0, visits_today: 0
};

function Dashboard() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [expiring, setExpiring] = useState({ expiring_soon: [], expired: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, e] = await Promise.all([
        axios.get(`${BASE_URL}/stats`)
        .then(res => setStats(res.data))
      ]);
      setStats(s.data);
      setExpiring(e.data);
    } catch {
      setError("Could not load dashboard data. Is the server running?");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <Layout>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back — here's what's happening today.</p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="stats-grid">
        <div className="stat-card yellow">
          <div className="stat-label">Total Members</div>
          <div className="stat-value yellow">{loading ? "—" : stats.total_members}</div>
          <div className="stat-sub">All time registrations</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Active Members</div>
          <div className="stat-value green">{loading ? "—" : stats.active_members}</div>
          <div className="stat-sub">Current subscriptions</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ fontSize: 34 }}>
            {loading ? "—" : `₱${stats.revenue.toLocaleString()}`}
          </div>
          <div className="stat-sub">After discounts</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">New This Month</div>
          <div className="stat-value" style={{ color: "#00b0ff" }}>{loading ? "—" : stats.new_this_month}</div>
          <div className="stat-sub">Recent sign-ups</div>
        </div>
      </div>

      {/* Today's activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="card" style={{ borderColor: "rgba(232,255,0,0.2)", background: "linear-gradient(135deg, #1a1a1a 0%, #1f1f0a 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>
                🚶 Walk-in Revenue Today
              </div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 48, color: "var(--accent)", lineHeight: 1 }}>
                {loading ? "—" : `₱${stats.walkin_revenue_today.toLocaleString()}`}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                {loading ? "" : `${stats.walkin_count_today} walk-in${stats.walkin_count_today !== 1 ? "s" : ""}`}
              </div>
            </div>
            <Link to="/walkins" className="btn btn-primary btn-sm">Manage →</Link>
          </div>
        </div>

        <div className="card" style={{ borderColor: "rgba(0,230,118,0.2)", background: "linear-gradient(135deg, #1a1a1a 0%, #0a1f12 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>
                ⏱ Members In Gym Now
              </div>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 48, color: "var(--success)", lineHeight: 1 }}>
                {loading ? "—" : stats.members_in_gym}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                {loading ? "" : `${stats.visits_today} total visit${stats.visits_today !== 1 ? "s" : ""} today`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to="/attendance" className="btn btn-success btn-sm">Time In →</Link>
              <Link to="/attendance" className="btn btn-danger btn-sm">Time Out ↩</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Expiry cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 20 }}>⚠ Expiring Soon</h3>
            <span className="badge badge-expiring">{expiring.expiring_soon.length} members</span>
          </div>
          {expiring.expiring_soon.length === 0 ? (
            <div className="empty-state">✅ No memberships expiring in 7 days</div>
          ) : (
            <table>
              <thead><tr><th>Name</th><th>Plan</th><th>Expires</th></tr></thead>
              <tbody>
                {expiring.expiring_soon.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.plan}</td>
                    <td><span className="badge badge-expiring">{m.expiration_date}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 20 }}>❌ Expired</h3>
            <span className="badge badge-expired">{expiring.expired.length} members</span>
          </div>
          {expiring.expired.length === 0 ? (
            <div className="empty-state">✅ No expired memberships</div>
          ) : (
            <table>
              <thead><tr><th>Name</th><th>Plan</th><th>Expired On</th></tr></thead>
              <tbody>
                {expiring.expired.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight: 600 }}>{m.name}</td>
                    <td>{m.plan}</td>
                    <td><span className="badge badge-expired">{m.expiration_date}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Link to="/members" className="btn btn-primary">Manage Members →</Link>
        <Link to="/alerts" className="btn btn-ghost">View All Alerts</Link>
        <button className="btn btn-ghost" onClick={fetchData} disabled={loading}>
          ↻ Refresh
        </button>
      </div>
    </Layout>
  );
}

export default Dashboard;
