import { useEffect, useState, useCallback, useRef } from "react";
import { api, clearCache } from "../api/config";
import Layout from "../components/Layout";

const MONTHS = [
  {value:"01",label:"January"},{value:"02",label:"February"},{value:"03",label:"March"},
  {value:"04",label:"April"},{value:"05",label:"May"},{value:"06",label:"June"},
  {value:"07",label:"July"},{value:"08",label:"August"},{value:"09",label:"September"},
  {value:"10",label:"October"},{value:"11",label:"November"},{value:"12",label:"December"}
];

function parseTime(t) {
  if (!t) return null;
  const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let [, h, m, period] = match;
  h = parseInt(h,10); m = parseInt(m,10);
  if (period.toUpperCase()==="PM" && h!==12) h+=12;
  if (period.toUpperCase()==="AM" && h===12) h=0;
  return h*60+m;
}

function formatDuration(timeIn, timeOut) {
  const a = parseTime(timeIn), b = parseTime(timeOut);
  if (a===null || b===null || b<a) return "—";
  const mins = b - a;
  return mins < 60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;
}

function AdminDTR() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Current admin from localStorage
  const adminUsername = localStorage.getItem("gym_admin") || "admin";

  // State
  const [todayRecords, setTodayRecords]   = useState([]);
  const [monthRecords, setMonthRecords]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [actionMsg, setActionMsg]         = useState(null);
  const [activeTab, setActiveTab]         = useState("today"); // "today" | "monthly"
  const [month, setMonth]                 = useState(String(now.getMonth()+1).padStart(2,"0"));
  const [year, setYear]                   = useState(String(now.getFullYear()));
  const [selectedDate, setSelectedDate]   = useState(today);
  const [viewUser, setViewUser]           = useState("");
  const mounted = useRef(true);

  const years = [];
  for (let y = now.getFullYear(); y >= 2023; y--) years.push(String(y));

  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const showMsg = (msg, type="success") => {
    setActionMsg({msg, type});
    setTimeout(() => setActionMsg(null), 4000);
  };

  const fetchToday = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/dtr?date=${selectedDate}`);
      if (mounted.current) setTodayRecords(res.data);
    } catch { showMsg("Could not load records.", "error"); }
    setLoading(false);
  }, [selectedDate]);

  const fetchMonthly = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/dtr/all?month=${month}&year=${year}`);
      if (mounted.current) setMonthRecords(res.data);
    } catch { showMsg("Could not load monthly records.", "error"); }
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    if (activeTab === "today") fetchToday();
    else fetchMonthly();
  }, [activeTab, fetchToday, fetchMonthly]);

  const timeIn = async () => {
    try {
      const res = await api.post("/admin/dtr/timein", { username: adminUsername });
      clearCache();
      showMsg(res.data.message);
      fetchToday();
    } catch (e) { showMsg(e.response?.data?.message || "Error timing in.", "error"); }
  };

  const timeOut = async () => {
    try {
      const res = await api.post("/admin/dtr/timeout", { username: adminUsername });
      clearCache();
      showMsg(res.data.message);
      fetchToday();
    } catch (e) { showMsg(e.response?.data?.message || "Error timing out.", "error"); }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("Delete this DTR record?")) return;
    try {
      await api.delete(`/admin/dtr/${id}`);
      clearCache();
      if (activeTab === "today") fetchToday();
      else fetchMonthly();
    } catch { showMsg("Failed to delete record.", "error"); }
  };

  // Check if current admin is timed in today
  const myActiveRecord = todayRecords.find(
    r => r.admin_username === adminUsername && !r.time_out
  );
  const myTodayRecord = todayRecords.find(
    r => r.admin_username === adminUsername
  );

  // Monthly stats
  const uniqueAdmins = [...new Set(monthRecords.map(r => r.admin_username))];
  const filteredMonthly = viewUser
    ? monthRecords.filter(r => r.admin_username === viewUser)
    : monthRecords;

  // Total hours per admin
  const adminTotals = uniqueAdmins.map(username => {
    const records = monthRecords.filter(r => r.admin_username === username);
    const totalMins = records.reduce((sum, r) => {
      const a = parseTime(r.time_in), b = parseTime(r.time_out);
      if (a !== null && b !== null && b > a) return sum + (b - a);
      return sum;
    }, 0);
    const days = records.filter(r => r.time_in).length;
    return {
      username,
      days,
      totalHours: Math.floor(totalMins / 60),
      totalMins: totalMins % 60,
    };
  });

  const todayLabel = new Date().toLocaleDateString("en-PH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <Layout>
      <div className="page-header">
        <h2>Admin DTR</h2>
        <p>Daily Time Record — {todayLabel}</p>
      </div>

      {/* My status card */}
      <div className="card" style={{
        marginBottom: 20,
        borderColor: myActiveRecord ? "rgba(0,230,118,0.3)" : "rgba(232,255,0,0.2)",
        background: myActiveRecord
          ? "linear-gradient(135deg,#1a1a1a 0%,#0a1f12 100%)"
          : "linear-gradient(135deg,#1a1a1a 0%,#1f1f0a 100%)"
      }}>
        <div className="dash-inner">
          <div>
            <div className="stat-label">👤 My Status Today</div>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:32, lineHeight:1, marginBottom:6,
              color: myActiveRecord ? "var(--success)" : myTodayRecord ? "var(--muted)" : "var(--accent)" }}>
              {myActiveRecord ? "🟢 Currently Working"
                : myTodayRecord ? "✅ Shift Complete"
                : "⭕ Not Yet Timed In"}
            </div>
            {myTodayRecord && (
              <div style={{ fontSize:13, color:"var(--muted)" }}>
                Time In: <strong style={{color:"var(--success)"}}>{myTodayRecord.time_in}</strong>
                {myTodayRecord.time_out && (
                  <> &nbsp;·&nbsp; Time Out: <strong style={{color:"var(--danger)"}}>{myTodayRecord.time_out}</strong>
                  &nbsp;·&nbsp; Duration: <strong style={{color:"var(--text)"}}>{formatDuration(myTodayRecord.time_in, myTodayRecord.time_out)}</strong></>
                )}
              </div>
            )}
            <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>
              Logged in as: <strong style={{color:"var(--accent)"}}>{adminUsername}</strong>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {!myTodayRecord && (
              <button className="btn btn-success" onClick={timeIn}>
                ⏱ Time In
              </button>
            )}
            {myActiveRecord && (
              <button className="btn btn-danger" onClick={timeOut}>
                ↩ Time Out
              </button>
            )}
            {myTodayRecord && !myActiveRecord && (
              <span className="badge badge-active" style={{padding:"10px 16px",fontSize:13}}>
                Shift Done ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div style={{
          padding:"12px 18px", borderRadius:8, marginBottom:16, fontSize:14, fontWeight:600,
          background: actionMsg.type==="success" ? "rgba(0,230,118,0.12)" : "rgba(255,23,68,0.12)",
          border:`1px solid ${actionMsg.type==="success" ? "rgba(0,230,118,0.3)" : "rgba(255,23,68,0.3)"}`,
          color: actionMsg.type==="success" ? "var(--success)" : "var(--danger)"
        }}>
          {actionMsg.type==="success" ? "✅" : "❌"} {actionMsg.msg}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex", gap:8, marginBottom:20 }}>
        <button className={`btn ${activeTab==="today" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("today")}>
          📅 Daily View
        </button>
        <button className={`btn ${activeTab==="monthly" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("monthly")}>
          📊 Monthly Summary
        </button>
      </div>

      {/* ── DAILY VIEW ── */}
      {activeTab === "today" && (
        <>
          <div className="card">
            <div className="log-header">
              <h3 style={{fontSize:22}}>📋 DTR Records</h3>
              <input type="date" value={selectedDate} max={today}
                onChange={e => setSelectedDate(e.target.value)}
                style={{width:"auto", padding:"8px 12px"}} />
            </div>

            {loading ? (
              <div className="empty-state">Loading...</div>
            ) : todayRecords.length === 0 ? (
              <div className="empty-state">No DTR records for {selectedDate}.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Admin</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayRecords.map((r, i) => (
                      <tr key={r.id}>
                        <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                        <td>
                          <div style={{fontWeight:600,color:"var(--accent)"}}>{r.admin_username}</div>
                        </td>
                        <td style={{fontSize:12}}>{r.date}</td>
                        <td style={{color:"var(--success)",fontWeight:600}}>{r.time_in || "—"}</td>
                        <td style={{color: r.time_out ? "var(--danger)" : "var(--muted)", fontWeight: r.time_out ? 600 : 400}}>
                          {r.time_out || "—"}
                        </td>
                        <td style={{fontSize:12, color:"var(--muted)"}}>
                          {formatDuration(r.time_in, r.time_out)}
                        </td>
                        <td>
                          {r.time_out
                            ? <span className="badge badge-active">Complete</span>
                            : <span className="badge badge-expiring">On Duty</span>}
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteRecord(r.id)}>
                            Del
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MONTHLY VIEW ── */}
      {activeTab === "monthly" && (
        <>
          {/* Monthly summary stats */}
          {adminTotals.length > 0 && (
            <div className="stats-grid" style={{gridTemplateColumns:`repeat(${Math.min(adminTotals.length, 3)}, 1fr)`}}>
              {adminTotals.map(a => (
                <div key={a.username} className="stat-card">
                  <div className="stat-label">👤 {a.username}</div>
                  <div className="stat-value yellow" style={{fontSize:36}}>
                    {a.totalHours}h {a.totalMins}m
                  </div>
                  <div className="stat-sub">{a.days} day{a.days !== 1 ? "s" : ""} worked</div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <div className="log-header" style={{flexWrap:"wrap", gap:10}}>
              <h3 style={{fontSize:22}}>📊 Monthly DTR</h3>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                <select value={month} onChange={e => setMonth(e.target.value)}
                  style={{width:"auto", padding:"8px 12px"}}>
                  {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select value={year} onChange={e => setYear(e.target.value)}
                  style={{width:"auto", padding:"8px 12px"}}>
                  {years.map(y => <option key={y}>{y}</option>)}
                </select>
                <select value={viewUser} onChange={e => setViewUser(e.target.value)}
                  style={{width:"auto", padding:"8px 12px"}}>
                  <option value="">All Admins</option>
                  {uniqueAdmins.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="empty-state">Loading...</div>
            ) : filteredMonthly.length === 0 ? (
              <div className="empty-state">No DTR records for {MONTHS.find(m=>m.value===month)?.label} {year}.</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Admin</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonthly.map((r, i) => (
                      <tr key={r.id}>
                        <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                        <td style={{fontWeight:600,color:"var(--accent)"}}>{r.admin_username}</td>
                        <td style={{fontSize:12}}>{r.date}</td>
                        <td style={{color:"var(--success)",fontWeight:600}}>{r.time_in || "—"}</td>
                        <td style={{color: r.time_out ? "var(--danger)" : "var(--muted)", fontWeight: r.time_out ? 600 : 400}}>
                          {r.time_out || "—"}
                        </td>
                        <td style={{fontSize:12, color:"var(--muted)"}}>
                          {formatDuration(r.time_in, r.time_out)}
                        </td>
                        <td>
                          {r.time_out
                            ? <span className="badge badge-active">Complete</span>
                            : <span className="badge badge-expiring">On Duty</span>}
                        </td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteRecord(r.id)}>
                            Del
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}

export default AdminDTR;
