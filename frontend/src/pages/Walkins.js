import { useEffect, useState, useCallback, useRef } from "react";
import { api, clearCache } from "../api/config";
import Layout from "../components/Layout";

// ── Local date helper — avoids UTC offset giving wrong date in PHT (+8) ──────
function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}


const WAKE_TIMEOUT_MS = 8000;

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

function Walkins() {
  const [data, setData]         = useState({ walkins:[], total:0, date:"" });
  const [name, setName]         = useState("");
  const [amount, setAmount]     = useState("");
  const [note, setNote]         = useState("");
  const [selectedDate, setSelectedDate] = useState(()=>localDateStr(new Date()));
  const [loading, setLoading]   = useState(true);
  const [waking, setWaking]     = useState(false);
  const [adding, setAdding]     = useState(false);
  const [error, setError]       = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const mounted   = useRef(true);
  const wakeTimer = useRef(null);
  const today     = localDateStr(new Date());
  const isToday   = selectedDate === today;

  useEffect(() => { return () => { mounted.current = false; clearTimeout(wakeTimer.current); }; }, []);

  const fetchWalkins = useCallback(async () => {
    setLoading(true);
    setWaking(false);
    setError("");

    wakeTimer.current = setTimeout(() => {
      if (mounted.current) setWaking(true);
    }, WAKE_TIMEOUT_MS);

    try {
      const res = await api.get(`/walkins?date=${selectedDate}`);
      clearTimeout(wakeTimer.current);
      if (mounted.current) { setData(res.data); setWaking(false); }
    } catch {
      clearTimeout(wakeTimer.current);
      if (mounted.current) {
        setError("Could not load walk-in data. The server may be starting up.");
        setWaking(false);
      }
    }
    if (mounted.current) setLoading(false);
  }, [selectedDate]);

  useEffect(() => { fetchWalkins(); }, [fetchWalkins]);

  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(()=>setSuccessMsg(""),3000); };

  const addWalkin = async () => {
    setError("");
    if (!name.trim())               { setError("Name is required."); return; }
    if (!amount||Number(amount)<=0) { setError("Please enter a valid amount."); return; }
    setAdding(true);
    try {
      await api.post("/walkins",{name:name.trim(),amount,note:note.trim(),date:selectedDate});
      clearCache(); setName(""); setAmount(""); setNote("");
      showSuccess("Walk-in recorded!"); fetchWalkins();
    } catch (e) { setError(e.response?.data?.message||"Failed to record walk-in."); }
    setAdding(false);
  };

  const deleteWalkin = async (id) => {
    if (!window.confirm("Remove this walk-in entry?")) return;
    try { await api.delete(`/walkins/${id}`); clearCache(); fetchWalkins(); }
    catch { setError("Failed to delete entry."); }
  };

  return (
    <Layout>
      <div className="page-header"><h2>Walk-ins</h2><p>Track daily walk-in revenue</p></div>

      {/* Revenue hero card */}
      <div className="card" style={{marginBottom:20, borderColor:"rgba(232,255,0,0.2)", background:"linear-gradient(135deg,#1a1a1a 0%,#1f1f0a 100%)"}}>
        <div className="walkin-hero">
          <div className="walkin-hero-amount">
            <div className="stat-label">
              {isToday ? "🚶 Today's Walk-in Revenue" : `📅 Walk-in Revenue — ${selectedDate}`}
            </div>
            <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:60,color:"var(--accent)",lineHeight:1}}>
              ₱{data.total.toLocaleString()}
            </div>
            <div style={{fontSize:13,color:"var(--muted)",marginTop:6}}>
              {data.walkins.length} walk-in{data.walkins.length!==1?"s":""}
            </div>
          </div>
          <div className="walkin-hero-date">
            <label style={{display:"block",fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>
              View by date
            </label>
            <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{width:"100%"}} />
          </div>
        </div>
      </div>

      {error && (
        <div className="error-msg" style={{marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between", gap:12}}>
          <span>⚠ {error}</span>
          <button className="btn btn-ghost btn-sm" onClick={fetchWalkins}>Retry</button>
        </div>
      )}
      {successMsg && (
        <div style={{background:"rgba(0,230,118,0.1)",border:"1px solid rgba(0,230,118,0.3)",color:"var(--success)",padding:"12px 16px",borderRadius:8,fontSize:13,fontWeight:600,marginBottom:16}}>
          ✅ {successMsg}
        </div>
      )}

      {/* Add walkin form */}
      <div className="card" style={{marginBottom:20}}>
        <h3 style={{fontSize:22,marginBottom:18}}>+ Record Walk-in</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input placeholder="e.g. John Doe / Guest" value={name}
              onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addWalkin()} autoComplete="off" />
          </div>
          <div className="form-group">
            <label>Amount (₱) *</label>
            <input type="number" min="1" placeholder="100" value={amount}
              onChange={e=>setAmount(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addWalkin()} />
          </div>
          <div className="form-group full">
            <label>Note (optional)</label>
            <input placeholder="e.g. Day pass, Locker fee..." value={note}
              onChange={e=>setNote(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addWalkin()} />
          </div>
        </div>
        <div className="walkin-record-footer" style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <span style={{fontSize:12,color:"var(--muted)"}}>
            Recording for: <strong style={{color:"var(--text)"}}>{selectedDate}</strong>
          </span>
          <button className="btn btn-primary" onClick={addWalkin} disabled={adding}>
            {adding?"Recording...":"Record Walk-in"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="log-header">
          <h3 style={{fontSize:22}}>Entries</h3>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:13,color:"var(--muted)"}}>{selectedDate}</span>
            <button className="btn btn-ghost btn-sm" onClick={fetchWalkins} disabled={loading}>↺</button>
          </div>
        </div>
        {loading
          ? <LoadingState waking={waking} onRetry={fetchWalkins} />
          : data.walkins.length===0
            ? <div className="empty-state">No walk-ins recorded for {selectedDate}.</div>
            : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Name</th><th>Amount</th><th>Note</th><th>Action</th></tr></thead>
                  <tbody>
                    {data.walkins.map((w,i) => (
                      <tr key={w.id}>
                        <td style={{color:"var(--muted)",fontSize:12}}>{i+1}</td>
                        <td style={{fontWeight:600}}>{w.name}</td>
                        <td style={{color:"var(--accent)",fontWeight:600}}>₱{Number(w.amount).toLocaleString()}</td>
                        <td style={{color:"var(--muted)",fontSize:12}}>{w.note||"—"}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={()=>deleteWalkin(w.id)}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="2" style={{fontWeight:700,fontSize:13,paddingTop:14,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1}}>Total</td>
                      <td style={{fontFamily:"'Bebas Neue',cursive",fontSize:24,color:"var(--accent)",paddingTop:14}}>₱{data.total.toLocaleString()}</td>
                      <td colSpan="2" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
      </div>
    </Layout>
  );
}
export default Walkins;
