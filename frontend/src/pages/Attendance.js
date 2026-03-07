import { useEffect, useState, useRef, useCallback } from "react";
import { api, clearCache } from "../api/config";
import Layout from "../components/Layout";

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
  if (a===null||b===null||b<a) return "—";
  const mins = b-a;
  return mins<60 ? `${mins}m` : `${Math.floor(mins/60)}h ${mins%60}m`;
}

function Attendance() {
  const [members, setMembers]   = useState([]);
  const [data, setData]         = useState({ records:[], total:0, still_in:0, date:"" });
  const [selectedDate, setSelectedDate] = useState(()=>new Date().toISOString().split("T")[0]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [actionMsg, setActionMsg] = useState(null);
  const [error, setError]       = useState("");
  const mounted = useRef(true);
  const today   = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === today;

  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const fetchMembers = useCallback(async () => {
    try { const res = await api.get("/members"); if (mounted.current) setMembers(res.data); }
    catch { setError("Could not load members."); }
  }, []);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get(`/attendance?date=${selectedDate}`); if (mounted.current) setData(res.data); }
    catch { setError("Could not load attendance records."); }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const showMsg = (msg, type="success") => { setActionMsg({msg,type}); setTimeout(()=>setActionMsg(null),3000); };

  const timeIn = async (member) => {
    try { const res = await api.post("/attendance/timein",{member_id:member.id}); clearCache(); showMsg(res.data.message); fetchAttendance(); }
    catch (e) { showMsg(e.response?.data?.message||"Error timing in.","error"); }
    setSearch("");
  };
  const timeOut = async (memberId) => {
    try { const res = await api.post("/attendance/timeout",{member_id:memberId}); clearCache(); showMsg(res.data.message); fetchAttendance(); }
    catch (e) { showMsg(e.response?.data?.message||"Error timing out.","error"); }
    setSearch("");
  };

  const getMemberStatus = (id) => data.records.find(r=>r.member_id===id && !r.time_out);
  const filteredMembers = search.length>=1
    ? members.filter(m=>m.name.toLowerCase().includes(search.toLowerCase())||m.phone?.includes(search)).slice(0,8)
    : [];

  const todayLabel = new Date().toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  return (
    <Layout>
      <div className="page-header"><h2>Attendance</h2><p>{todayLabel}</p></div>
      {error && <div className="error-msg" style={{marginBottom:16}}>{error}</div>}

      <div className="stats-grid-3">
        <div className="stat-card">
          <div className="stat-label">Currently Inside</div>
          <div className="stat-value green">{loading?"—":data.still_in}</div>
          <div className="stat-sub">Members in gym now</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Visits Today</div>
          <div className="stat-value yellow">{loading?"—":data.total}</div>
          <div className="stat-sub">Total check-ins</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Viewing Date</div>
          <div className="stat-value" style={{fontSize:18,color:"#00b0ff",paddingTop:8}}>{selectedDate}</div>
          <div className="stat-sub">{isToday?"Today":"Past log"}</div>
        </div>
      </div>

      {actionMsg && (
        <div style={{
          padding:"12px 18px", borderRadius:8, marginBottom:16, fontSize:14, fontWeight:600,
          background: actionMsg.type==="success"?"rgba(0,230,118,0.12)":"rgba(255,23,68,0.12)",
          border:`1px solid ${actionMsg.type==="success"?"rgba(0,230,118,0.3)":"rgba(255,23,68,0.3)"}`,
          color: actionMsg.type==="success"?"var(--success)":"var(--danger)"
        }}>
          {actionMsg.type==="success"?"✅":"❌"} {actionMsg.msg}
        </div>
      )}

      {isToday && (
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{fontSize:22,marginBottom:16}}>⏱ Time In / Time Out</h3>
          <div style={{position:"relative"}}>
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input placeholder="Search member by name or phone..." value={search}
                onChange={e=>setSearch(e.target.value)} autoComplete="off" />
            </div>
            {filteredMembers.length>0 && (
              <div className="member-dropdown">
                {filteredMembers.map(m => {
                  const activeRecord = getMemberStatus(m.id);
                  const isExpired = new Date(m.expiration_date)<new Date();
                  return (
                    <div key={m.id} className="member-dropdown-item">
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600}}>{m.name}</div>
                        <div style={{fontSize:11,color:"var(--muted)"}}>
                          {m.plan} · Expires {m.expiration_date}
                          {isExpired && <span style={{color:"var(--danger)",marginLeft:6}}>⚠ Expired</span>}
                        </div>
                      </div>
                      <div style={{flexShrink:0}}>
                        {activeRecord
                          ? <button className="btn btn-danger btn-sm" onClick={()=>timeOut(m.id)}>Time Out ↩</button>
                          : <button className="btn btn-success btn-sm" onClick={()=>timeIn(m)}>Time In →</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {data.still_in>0 && (
            <div style={{marginTop:20}}>
              <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>
                Currently Inside ({data.still_in})
              </div>
              <div className="inside-chips">
                {data.records.filter(r=>!r.time_out).map(r => (
                  <div key={r.id} className="inside-chip">
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"var(--success)"}}>{r.member_name}</div>
                      <div style={{fontSize:11,color:"var(--muted)"}}>In at {r.time_in}</div>
                    </div>
                    <button className="btn btn-danger btn-sm" style={{padding:"4px 10px",fontSize:10}} onClick={()=>timeOut(r.member_id)}>Out</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="log-header">
          <h3 style={{fontSize:22}}>Attendance Log</h3>
          <input type="date" value={selectedDate} max={today}
            onChange={e=>setSelectedDate(e.target.value)} style={{width:"auto",padding:"8px 12px"}} />
        </div>
        {loading ? <div className="empty-state">Loading...</div>
          : data.records.length===0 ? <div className="empty-state">No attendance records for {selectedDate}.</div>
          : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Member</th><th>Time In</th><th>Time Out</th><th>Duration</th><th>Status</th></tr></thead>
                <tbody>
                  {data.records.map((r,i) => (
                    <tr key={r.id}>
                      <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                      <td style={{fontWeight:600}}>{r.member_name}</td>
                      <td style={{color:"var(--success)"}}>{r.time_in}</td>
                      <td style={{color:r.time_out?"var(--danger)":"var(--muted)"}}>{r.time_out||"—"}</td>
                      <td style={{fontSize:12,color:"var(--muted)"}}>{formatDuration(r.time_in,r.time_out)}</td>
                      <td>{r.time_out?<span className="badge badge-expired">Left</span>:<span className="badge badge-active">Inside</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </Layout>
  );
}
export default Attendance;
