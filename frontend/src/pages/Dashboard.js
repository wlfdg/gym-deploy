import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { api, clearCache } from "../api/config";
import Layout from "../components/Layout";

const DEFAULT_STATS = {
  total_members: 0, active_members: 0, revenue: 0, new_this_month: 0,
  walkin_revenue_today: 0, walkin_count_today: 0, members_in_gym: 0, visits_today: 0
};

function Dashboard() {
  const [stats, setStats]       = useState(DEFAULT_STATS);
  const [expiring, setExpiring] = useState({ expiring_soon: [], expired: [] });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const mounted = useRef(true);
  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const fetchData = useCallback(async (force = false) => {
    if (force) clearCache();
    setError("");
    try {
      const [s, e] = await Promise.all([api.get("/stats"), api.get("/expiring?days=7")]);
      if (!mounted.current) return;
      setStats(s.data); setExpiring(e.data);
    } catch {
      if (!mounted.current) return;
      setError("Could not load dashboard data. Is the server running?");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (n) => Number(n || 0).toLocaleString();

  return (
    <Layout>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back - here's what's happening today.</p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Members</div>
          <div className="stat-value yellow">{loading ? "-" : fmt(stats.total_members)}</div>
          <div className="stat-sub">All time registrations</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Members</div>
          <div className="stat-value green">{loading ? "-" : fmt(stats.active_members)}</div>
          <div className="stat-sub">Current subscriptions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ fontSize: 34 }}>{loading ? "-" : "P" + fmt(stats.revenue)}</div>
          <div className="stat-sub">After discounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">New This Month</div>
          <div className="stat-value" style={{ color: "#00b0ff" }}>{loading ? "-" : fmt(stats.new_this_month)}</div>
          <div className="stat-sub">Recent sign-ups</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card" style={{ borderColor:"rgba(232,255,0,0.2)", background:"linear-gradient(135deg,#1a1a1a 0%,#1f1f0a 100%)" }}>
          <div className="dash-inner">
            <div>
              <div className="stat-label">Walk-in Revenue Today</div>
              <div className="stat-value yellow" style={{ fontSize: 44 }}>{loading ? "-" : "P" + fmt(stats.walkin_revenue_today)}</div>
              <div className="stat-sub">{loading ? "" : stats.walkin_count_today + " walk-in" + (stats.walkin_count_today !== 1 ? "s" : "")}</div>
            </div>
            <Link to="/walkins" className="btn btn-primary btn-sm">Manage</Link>
          </div>
        </div>
        <div className="card" style={{ borderColor:"rgba(0,230,118,0.2)", background:"linear-gradient(135deg,#1a1a1a 0%,#0a1f12 100%)" }}>
          <div className="dash-inner">
            <div>
              <div className="stat-label">Members In Gym Now</div>
              <div className="stat-value green" style={{ fontSize: 44 }}>{loading ? "-" : stats.members_in_gym}</div>
              <div className="stat-sub">{loading ? "" : stats.visits_today + " total visits today"}</div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <Link to="/attendance" className="btn btn-success btn-sm">Member Time In</Link>
              <Link to="/attendance" className="btn btn-danger btn-sm">Member Time Out</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="dash-section-header">
            <h3 style={{ fontSize:20 }}>Expiring Soon</h3>
            <span className="badge badge-expiring">{expiring.expiring_soon.length} members</span>
          </div>
          {expiring.expiring_soon.length === 0
            ? <div className="empty-state">No memberships expiring in 7 days</div>
            : <div className="table-wrap"><table>
                <thead><tr><th>Name</th><th>Plan</th><th>Expires</th></tr></thead>
                <tbody>{expiring.expiring_soon.map(m => (
                  <tr key={m.id}><td style={{fontWeight:600}}>{m.name}</td><td>{m.plan}</td><td><span className="badge badge-expiring">{m.expiration_date}</span></td></tr>
                ))}</tbody>
              </table></div>
          }
        </div>
        <div className="card">
          <div className="dash-section-header">
            <h3 style={{ fontSize:20 }}>Expired</h3>
            <span className="badge badge-expired">{expiring.expired.length} members</span>
          </div>
          {expiring.expired.length === 0
            ? <div className="empty-state">No expired memberships</div>
            : <div className="table-wrap"><table>
                <thead><tr><th>Name</th><th>Plan</th><th>Expired On</th></tr></thead>
                <tbody>{expiring.expired.map(m => (
                  <tr key={m.id}><td style={{fontWeight:600}}>{m.name}</td><td>{m.plan}</td><td><span className="badge badge-expired">{m.expiration_date}</span></td></tr>
                ))}</tbody>
              </table></div>
          }
        </div>
      </div>

      <div className="action-row">
        <Link to="/members" className="btn btn-primary">Manage Members</Link>
        <Link to="/dtr"     className="btn btn-ghost">Employee DTR</Link>
        <Link to="/alerts"  className="btn btn-ghost">View All Alerts</Link>
        <button className="btn btn-ghost" onClick={() => fetchData(true)} disabled={loading}>Refresh</button>
      </div>
    </Layout>
  );
}
export default Dashboard;
