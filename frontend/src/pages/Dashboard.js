import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, clearCache } from "../api/config";
import Layout from "../components/Layout";

const DEFAULT_STATS = {
  total_members: 0, active_members: 0, revenue: 0, new_this_month: 0,
  walkin_revenue_today: 0, walkin_count_today: 0, members_in_gym: 0, visits_today: 0
};

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats]         = useState(DEFAULT_STATS);
  const [expiring, setExpiring]   = useState({ expiring_soon: [], expired: [] });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  // Employee DTR quick action state
  const [empName, setEmpName]     = useState("");
  const [empNote, setEmpNote]     = useState("");
  const [empNames, setEmpNames]   = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [onDuty, setOnDuty]       = useState([]);
  const [dtrMsg, setDtrMsg]       = useState(null);
  const [dtrLoading, setDtrLoading] = useState(false);

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

  const fetchDTR = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [namesRes, todayRes] = await Promise.all([
        api.get("/employee/dtr/employees"),
        api.get(`/employee/dtr?date=${today}`)
      ]);
      if (!mounted.current) return;
      setEmpNames(namesRes.data);
      setOnDuty(todayRes.data.filter(r => !r.time_out));
    } catch {}
  }, []);

  useEffect(() => { fetchData(); fetchDTR(); }, [fetchData, fetchDTR]);

  const showDtrMsg = (msg, type = "success") => {
    setDtrMsg({ msg, type });
    setTimeout(() => setDtrMsg(null), 4000);
  };

  const handleNameChange = (val) => {
    setEmpName(val);
    setSuggestions(val.length >= 1
      ? empNames.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
      : []);
  };

  const timeIn = async () => {
    if (!empName.trim()) { showDtrMsg("Enter employee name.", "error"); return; }
    setDtrLoading(true);
    try {
      const res = await api.post("/employee/dtr/timein", { name: empName.trim(), note: empNote });
      showDtrMsg(res.data.message);
      setEmpName(""); setEmpNote(""); setSuggestions([]);
      fetchDTR();
    } catch (e) { showDtrMsg(e.response?.data?.message || "Error.", "error"); }
    setDtrLoading(false);
  };

  const timeOut = async (record) => {
    setDtrLoading(true);
    try {
      const res = await api.post("/employee/dtr/timeout", { name: record.employee_name, id: record.id });
      showDtrMsg(res.data.message);
      fetchDTR();
    } catch (e) { showDtrMsg(e.response?.data?.message || "Error.", "error"); }
    setDtrLoading(false);
  };

  const fmt = (n) => Number(n || 0).toLocaleString();

  return (
    <Layout>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Welcome back — here's what's happening today.</p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Members</div>
          <div className="stat-value yellow">{loading ? "—" : fmt(stats.total_members)}</div>
          <div className="stat-sub">All time registrations</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Members</div>
          <div className="stat-value green">{loading ? "—" : fmt(stats.active_members)}</div>
          <div className="stat-sub">Current subscriptions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ fontSize: 34 }}>{loading ? "—" : `₱${fmt(stats.revenue)}`}</div>
          <div className="stat-sub">After discounts</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">New This Month</div>
          <div className="stat-value" style={{ color: "#00b0ff" }}>{loading ? "—" : fmt(stats.new_this_month)}</div>
          <div className="stat-sub">Recent sign-ups</div>
        </div>
      </div>

      {/* Walk-ins + Members */}
      <div className="two-col">
        <div className="card" style={{ borderColor:"rgba(232,255,0,0.2)", background:"linear-gradient(135deg,#1a1a1a 0%,#1f1f0a 100%)" }}>
          <div className="dash-inner">
            <div>
              <div className="stat-label">[W] Walk-in Revenue Today</div>
              <div className="stat-value yellow" style={{ fontSize: 44 }}>{loading ? "—" : `₱${fmt(stats.walkin_revenue_today)}`}</div>
              <div className="stat-sub">{loading ? "" : `${stats.walkin_count_today} walk-in${stats.walkin_count_today !== 1 ? "s" : ""}`}</div>
            </div>
            <Link to="/walkins" className="btn btn-primary btn-sm">Manage →</Link>
          </div>
        </div>
        <div className="card" style={{ borderColor:"rgba(0,230,118,0.2)", background:"linear-gradient(135deg,#1a1a1a 0%,#0a1f12 100%)" }}>
          <div className="dash-inner">
            <div>
              <div className="stat-label">[T] Members In Gym Now</div>
              <div className="stat-value green" style={{ fontSize: 44 }}>{loading ? "—" : stats.members_in_gym}</div>
              <div className="stat-sub">{loading ? "" : `${stats.visits_today} total visit${stats.visits_today !== 1 ? "s" : ""} today`}</div>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <Link to="/attendance" className="btn btn-success btn-sm">Time In →</Link>
              <Link to="/attendance" className="btn btn-danger btn-sm">Time Out ↩</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── EMPLOYEE DTR QUICK ACTION ── */}
      <div className="card" style={{ borderColor:"rgba(0,176,255,0.2)", background:"linear-gradient(135deg,#1a1a1a 0%,#0a121f 100%)", marginBottom: 20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16 }}>
          <div>
            <div className="stat-label">[DTR] Employee DTR</div>
            <div style={{ fontSize: 12, color:"var(--muted)", marginTop: 2 }}>
              {onDuty.length > 0 ? `[ON] ${onDuty.length} employee${onDuty.length !== 1 ? "s" : ""} on duty` : "No employees on duty yet"}
            </div>
          </div>
          <Link to="/dtr" className="btn btn-ghost btn-sm">Full DTR →</Link>
        </div>

        {/* Time In form */}
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom: dtrMsg || onDuty.length > 0 ? 14 : 0 }}>
          <div style={{ position:"relative", flex: "1 1 180px" }}>
            <input
              placeholder="Employee name..."
              value={empName}
              onChange={e => handleNameChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && timeIn()}
              autoComplete="off"
              style={{ width:"100%", margin:0 }}
            />
            {suggestions.length > 0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"var(--dark)", border:"1px solid var(--border)", borderRadius:8, zIndex:50, boxShadow:"0 8px 24px rgba(0,0,0,0.4)", overflow:"hidden" }}>
                {suggestions.map(s => (
                  <div key={s} style={{ padding:"9px 14px", cursor:"pointer", borderBottom:"1px solid var(--border)", fontSize:13 }}
                    onMouseDown={() => { setEmpName(s); setSuggestions([]); }}>
                    👤 {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <input
            placeholder="Note (optional)"
            value={empNote}
            onChange={e => setEmpNote(e.target.value)}
            onKeyDown={e => e.key === "Enter" && timeIn()}
            style={{ flex:"1 1 140px", margin:0 }}
          />
          <button className="btn btn-success btn-sm" onClick={timeIn} disabled={dtrLoading} style={{ whiteSpace:"nowrap" }}>
            [T] Time In
          </button>
        </div>

        {/* Action message */}
        {dtrMsg && (
          <div style={{
            padding:"10px 14px", borderRadius:8, marginBottom:12, fontSize:13, fontWeight:600,
            background: dtrMsg.type === "success" ? "rgba(0,230,118,0.1)" : "rgba(255,23,68,0.1)",
            border: `1px solid ${dtrMsg.type === "success" ? "rgba(0,230,118,0.3)" : "rgba(255,23,68,0.3)"}`,
            color: dtrMsg.type === "success" ? "var(--success)" : "var(--danger)"
          }}>
            {dtrMsg.type === "success" ? "✅" : "❌"} {dtrMsg.msg}
          </div>
        )}

        {/* Currently on duty chips */}
        {onDuty.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {onDuty.map(r => (
              <div key={r.id} style={{
                display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                background:"rgba(0,230,118,0.08)", border:"1px solid rgba(0,230,118,0.2)",
                borderRadius:8, fontSize:13
              }}>
                <span style={{ color:"var(--success)", fontWeight:600 }}>[ON] {r.employee_name}</span>
                <span style={{ color:"var(--muted)", fontSize:11 }}>since {r.time_in}</span>
                <button className="btn btn-danger btn-sm" style={{ padding:"3px 10px", fontSize:11 }}
                  onClick={() => timeOut(r)} disabled={dtrLoading}>
                  Out ↩
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expiring / Expired */}
      <div className="two-col">
        <div className="card">
          <div className="dash-section-header">
            <h3 style={{ fontSize:20 }}>⚠ Expiring Soon</h3>
            <span className="badge badge-expiring">{expiring.expiring_soon.length} members</span>
          </div>
          {expiring.expiring_soon.length === 0
            ? <div className="empty-state">✅ No memberships expiring in 7 days</div>
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
            <h3 style={{ fontSize:20 }}>❌ Expired</h3>
            <span className="badge badge-expired">{expiring.expired.length} members</span>
          </div>
          {expiring.expired.length === 0
            ? <div className="empty-state">✅ No expired memberships</div>
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
        <Link to="/members" className="btn btn-primary">Manage Members →</Link>
        <Link to="/alerts"  className="btn btn-ghost">View All Alerts</Link>
        <button className="btn btn-ghost" onClick={() => fetchData(true)} disabled={loading}>↻ Refresh</button>
      </div>
    </Layout>
  );
}
export default Dashboard;
