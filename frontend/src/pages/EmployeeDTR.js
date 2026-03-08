import { useEffect, useState, useCallback, useRef } from "react";
import { api, clearCache } from "../api/config";
import Layout from "../components/Layout";

const MONTHS = [
  {v:"01",l:"January"},{v:"02",l:"February"},{v:"03",l:"March"},
  {v:"04",l:"April"},{v:"05",l:"May"},{v:"06",l:"June"},
  {v:"07",l:"July"},{v:"08",l:"August"},{v:"09",l:"September"},
  {v:"10",l:"October"},{v:"11",l:"November"},{v:"12",l:"December"}
];

function parseTime(t) {
  if (!t) return null;
  const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let [,h,min,p] = m; h=parseInt(h); min=parseInt(min);
  if (p.toUpperCase()==="PM"&&h!==12) h+=12;
  if (p.toUpperCase()==="AM"&&h===12) h=0;
  return h*60+min;
}
function dur(ti,to) {
  const a=parseTime(ti),b=parseTime(to);
  if(a===null||b===null||b<a) return "—";
  const m=b-a; return m<60?`${m}m`:`${Math.floor(m/60)}h ${m%60}m`;
}

function EmployeeDTR() {
  const now   = new Date();
  const today = now.toISOString().split("T")[0];

  const [name, setName]           = useState("");
  const [note, setNote]           = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allNames, setAllNames]   = useState([]);
  const [records, setRecords]     = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState("today");
  const [month, setMonth]         = useState(String(now.getMonth()+1).padStart(2,"0"));
  const [year, setYear]           = useState(String(now.getFullYear()));
  const [filterName, setFilterName] = useState("");
  const [monthRecords, setMonthRecords] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [actionMsg, setActionMsg] = useState(null);
  const mounted = useRef(true);
  const isToday = selectedDate === today;

  const years = [];
  for (let y=now.getFullYear(); y>=2023; y--) years.push(String(y));

  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const showMsg = (msg, type="success") => {
    setActionMsg({msg,type});
    setTimeout(() => setActionMsg(null), 4000);
  };

  const fetchNames = useCallback(async () => {
    try { const r = await api.get("/employee/dtr/employees"); if(mounted.current) setAllNames(r.data); }
    catch {}
  }, []);

  const fetchToday = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get(`/employee/dtr?date=${selectedDate}`); if(mounted.current) setRecords(r.data); }
    catch {}
    setLoading(false);
  }, [selectedDate]);

  const fetchMonthly = useCallback(async () => {
    setLoading(true);
    try {
      const url = filterName
        ? `/employee/dtr/all?month=${month}&year=${year}&name=${encodeURIComponent(filterName)}`
        : `/employee/dtr/all?month=${month}&year=${year}`;
      const r = await api.get(url);
      if(mounted.current) setMonthRecords(r.data);
    } catch {}
    setLoading(false);
  }, [month, year, filterName]);

  useEffect(() => { fetchNames(); }, [fetchNames]);
  useEffect(() => { if(activeTab==="today") fetchToday(); }, [activeTab, fetchToday]);
  useEffect(() => { if(activeTab==="monthly") fetchMonthly(); }, [activeTab, fetchMonthly]);

  // Autocomplete
  const handleNameChange = (val) => {
    setName(val);
    if (val.length >= 1) {
      setSuggestions(allNames.filter(n => n.toLowerCase().includes(val.toLowerCase())).slice(0,6));
    } else {
      setSuggestions([]);
    }
  };

  const timeIn = async () => {
    if (!name.trim()) { showMsg("Please enter an employee name.", "error"); return; }
    try {
      const res = await api.post("/employee/dtr/timein", { name: name.trim(), note });
      clearCache(); showMsg(res.data.message);
      setName(""); setNote(""); setSuggestions([]);
      fetchToday(); fetchNames();
    } catch (e) { showMsg(e.response?.data?.message || "Error recording time in.", "error"); }
  };

  const timeOut = async (record) => {
    try {
      const res = await api.post("/employee/dtr/timeout", { name: record.employee_name, id: record.id });
      clearCache(); showMsg(res.data.message);
      fetchToday();
    } catch (e) { showMsg(e.response?.data?.message || "Error recording time out.", "error"); }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("Delete this DTR record?")) return;
    try {
      await api.delete(`/employee/dtr/${id}`);
      clearCache();
      if (activeTab==="today") fetchToday();
      else fetchMonthly();
    } catch { showMsg("Failed to delete.", "error"); }
  };

  const currentlyIn = records.filter(r => !r.time_out);

  // Monthly summary per employee
  const uniqueEmployees = [...new Set(monthRecords.map(r => r.employee_name))];
  const monthlySummary  = uniqueEmployees.map(emp => {
    const recs = monthRecords.filter(r => r.employee_name === emp);
    const totalMins = recs.reduce((s,r) => {
      const a=parseTime(r.time_in),b=parseTime(r.time_out);
      return (a!==null&&b!==null&&b>a) ? s+(b-a) : s;
    }, 0);
    return { name:emp, days:recs.length, hours:Math.floor(totalMins/60), mins:totalMins%60 };
  });

  const filteredMonthly = filterName
    ? monthRecords.filter(r=>r.employee_name===filterName)
    : monthRecords;

  const todayLabel = now.toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"});

  return (
    <Layout>
      <div className="page-header">
        <h2>Employee DTR</h2>
        <p>{todayLabel}</p>
      </div>

      {/* Stats row */}
      <div className="stats-grid-3">
        <div className="stat-card">
          <div className="stat-label">🟢 Currently In</div>
          <div className="stat-value green">{currentlyIn.length}</div>
          <div className="stat-sub">On duty now</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📋 Records Today</div>
          <div className="stat-value yellow">{records.length}</div>
          <div className="stat-sub">Total entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">👥 Known Employees</div>
          <div className="stat-value" style={{color:"#00b0ff"}}>{allNames.length}</div>
          <div className="stat-sub">From history</div>
        </div>
      </div>

      {/* Action message */}
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

      {/* Tabs */}
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <button className={`btn ${activeTab==="today"?"btn-primary":"btn-ghost"}`} onClick={()=>setActiveTab("today")}>📅 Daily</button>
        <button className={`btn ${activeTab==="monthly"?"btn-primary":"btn-ghost"}`} onClick={()=>setActiveTab("monthly")}>📊 Monthly</button>
      </div>

      {/* ── DAILY TAB ── */}
      {activeTab==="today" && (<>

        {/* Time In form */}
        <div className="card" style={{marginBottom:20}}>
          <h3 style={{fontSize:22,marginBottom:18}}>⏱ Record Employee Time</h3>
          <div className="form-grid">
            <div className="form-group" style={{position:"relative"}}>
              <label>Employee Name *</label>
              <input placeholder="Type name..." value={name}
                onChange={e=>handleNameChange(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&timeIn()}
                autoComplete="off" />
              {suggestions.length>0 && (
                <div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--dark)",border:"1px solid var(--border)",borderRadius:8,zIndex:50,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",overflow:"hidden"}}>
                  {suggestions.map(s => (
                    <div key={s} style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid var(--border)",fontSize:13}}
                      onMouseDown={()=>{setName(s);setSuggestions([]);}}>
                      👤 {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Note (optional)</label>
              <input placeholder="e.g. Opening shift..." value={note}
                onChange={e=>setNote(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&timeIn()} />
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button className="btn btn-success" onClick={timeIn}>⏱ Record Time In</button>
          </div>
        </div>

        {/* Currently inside */}
        {currentlyIn.length>0 && (
          <div className="card" style={{marginBottom:20,borderColor:"rgba(0,230,118,0.2)"}}>
            <h3 style={{fontSize:18,marginBottom:14,color:"var(--success)"}}>🟢 Currently On Duty ({currentlyIn.length})</h3>
            <div className="inside-chips">
              {currentlyIn.map(r => (
                <div key={r.id} className="inside-chip">
                  <div>
                    <div style={{fontWeight:600,color:"var(--success)"}}>{r.employee_name}</div>
                    <div style={{fontSize:11,color:"var(--muted)"}}>In at {r.time_in}{r.note&&` · ${r.note}`}</div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={()=>timeOut(r)}>Time Out ↩</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily log */}
        <div className="card">
          <div className="log-header">
            <h3 style={{fontSize:22}}>📋 DTR Log</h3>
            <input type="date" value={selectedDate} max={today}
              onChange={e=>setSelectedDate(e.target.value)}
              style={{width:"auto",padding:"8px 12px"}} />
          </div>
          {loading ? <div className="empty-state">Loading...</div>
            : records.length===0 ? <div className="empty-state">No records for {selectedDate}.</div>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Employee</th><th>Time In</th><th>Time Out</th><th>Duration</th><th>Note</th><th>By</th><th></th></tr></thead>
                  <tbody>
                    {records.map((r,i) => (
                      <tr key={r.id}>
                        <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                        <td style={{fontWeight:600}}>{r.employee_name}</td>
                        <td style={{color:"var(--success)",fontWeight:600}}>{r.time_in||"—"}</td>
                        <td style={{color:r.time_out?"var(--danger)":"var(--muted)",fontWeight:r.time_out?600:400}}>
                          {r.time_out
                            ? r.time_out
                            : <button className="btn btn-danger btn-sm" onClick={()=>timeOut(r)}>Time Out ↩</button>}
                        </td>
                        <td style={{fontSize:12,color:"var(--muted)"}}>{dur(r.time_in,r.time_out)}</td>
                        <td style={{fontSize:12,color:"var(--muted)"}}>{r.note||"—"}</td>
                        <td style={{fontSize:11,color:"var(--muted)"}}>{r.recorded_by||"—"}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={()=>deleteRecord(r.id)}>Del</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </>)}

      {/* ── MONTHLY TAB ── */}
      {activeTab==="monthly" && (<>

        {/* Monthly summary cards */}
        {monthlySummary.length>0 && (
          <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(monthlySummary.length,4)},1fr)`,gap:16,marginBottom:20}}>
            {monthlySummary.map(s=>(
              <div key={s.name} className="stat-card">
                <div className="stat-label">👤 {s.name}</div>
                <div className="stat-value yellow" style={{fontSize:30}}>{s.hours}h {s.mins}m</div>
                <div className="stat-sub">{s.days} day{s.days!==1?"s":""} worked</div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <div className="log-header" style={{flexWrap:"wrap",gap:10}}>
            <h3 style={{fontSize:22}}>📊 Monthly Records</h3>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <select value={month} onChange={e=>setMonth(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
                {MONTHS.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
              <select value={year} onChange={e=>setYear(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
                {years.map(y=><option key={y}>{y}</option>)}
              </select>
              <select value={filterName} onChange={e=>setFilterName(e.target.value)} style={{width:"auto",padding:"8px 12px"}}>
                <option value="">All Employees</option>
                {uniqueEmployees.map(n=><option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {loading ? <div className="empty-state">Loading...</div>
            : filteredMonthly.length===0 ? <div className="empty-state">No records for {MONTHS.find(m=>m.v===month)?.l} {year}.</div>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Employee</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Duration</th><th>Note</th><th>By</th><th></th></tr></thead>
                  <tbody>
                    {filteredMonthly.map((r,i)=>(
                      <tr key={r.id}>
                        <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                        <td style={{fontWeight:600}}>{r.employee_name}</td>
                        <td style={{fontSize:12}}>{r.date}</td>
                        <td style={{color:"var(--success)",fontWeight:600}}>{r.time_in||"—"}</td>
                        <td style={{color:r.time_out?"var(--danger)":"var(--muted)",fontWeight:r.time_out?600:400}}>{r.time_out||"—"}</td>
                        <td style={{fontSize:12,color:"var(--muted)"}}>{dur(r.time_in,r.time_out)}</td>
                        <td style={{fontSize:12,color:"var(--muted)"}}>{r.note||"—"}</td>
                        <td style={{fontSize:11,color:"var(--muted)"}}>{r.recorded_by||"—"}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={()=>deleteRecord(r.id)}>Del</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </>)}
    </Layout>
  );
}

export default EmployeeDTR;
