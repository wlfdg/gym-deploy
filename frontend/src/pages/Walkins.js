import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layout";

import API from "../api/config";

function Walkins() {
  const [data, setData] = useState({ walkins: [], total: 0, date: "" });
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const isToday = selectedDate === today;

  const fetchWalkins = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API}/walkins?date=${selectedDate}`);
      setData(res.data);
    } catch {
      setError("Could not load walk-in data.");
    }
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => { fetchWalkins(); }, [fetchWalkins]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const addWalkin = async () => {
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    if (!amount || Number(amount) <= 0) { setError("Please enter a valid amount."); return; }
    setAdding(true);
    try {
      // Pass the selected date so entries can be added to any date
      await axios.post(`${API}/walkins`, { name: name.trim(), amount, note: note.trim(), date: selectedDate });
      setName(""); setAmount(""); setNote("");
      showSuccess("Walk-in recorded!");
      fetchWalkins();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to record walk-in.");
    }
    setAdding(false);
  };

  const deleteWalkin = async (id) => {
    if (!window.confirm("Remove this walk-in entry?")) return;
    try {
      await axios.delete(`${API}/walkins/${id}`);
      fetchWalkins();
    } catch {
      setError("Failed to delete entry.");
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") addWalkin(); };

  return (
    <Layout>
      <div className="page-header">
        <h2>Walk-ins</h2>
        <p>Track daily walk-in revenue</p>
      </div>

      {/* Revenue summary */}
      <div className="card" style={{ marginBottom: 20, borderColor: "rgba(232,255,0,0.2)", background: "linear-gradient(135deg, #1a1a1a 0%, #1f1f0a 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 6 }}>
              {isToday ? "🚶 Today's Walk-in Revenue" : `📅 Walk-in Revenue — ${selectedDate}`}
            </div>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 64, color: "var(--accent)", lineHeight: 1 }}>
              ₱{data.total.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
              {data.walkins.length} walk-in{data.walkins.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <label style={{ display: "block", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              View by date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Error / success messages */}
      {error && (
        <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>
      )}
      {successMsg && (
        <div style={{
          background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
          color: "var(--success)", padding: "12px 16px", borderRadius: 8,
          fontSize: 13, fontWeight: 600, marginBottom: 16
        }}>
          ✅ {successMsg}
        </div>
      )}

      {/* Add walk-in form */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 22, marginBottom: 18 }}>+ Record Walk-in</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Name *</label>
            <input placeholder="e.g. John Doe / Guest" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={handleKey} autoComplete="off" />
          </div>
          <div className="form-group">
            <label>Amount (₱) *</label>
            <input type="number" min="1" placeholder="100" value={amount}
              onChange={e => setAmount(e.target.value)} onKeyDown={handleKey} />
          </div>
          <div className="form-group full">
            <label>Note (optional)</label>
            <input placeholder="e.g. Day pass, Locker fee..." value={note}
              onChange={e => setNote(e.target.value)} onKeyDown={handleKey} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            Recording for: <strong style={{ color: "var(--text)" }}>{selectedDate}</strong>
          </span>
          <button className="btn btn-primary" onClick={addWalkin} disabled={adding}>
            {adding ? "Recording..." : "Record Walk-in"}
          </button>
        </div>
      </div>

      {/* Walk-ins table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 22 }}>Entries</h3>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{selectedDate}</span>
        </div>
        {loading ? (
          <div className="empty-state">Loading...</div>
        ) : data.walkins.length === 0 ? (
          <div className="empty-state">No walk-ins recorded for {selectedDate}.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th><th>Name</th><th>Amount</th><th>Note</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.walkins.map((w, i) => (
                <tr key={w.id}>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{w.name}</td>
                  <td style={{ color: "var(--accent)", fontWeight: 600 }}>₱{Number(w.amount).toLocaleString()}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{w.note || "—"}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteWalkin(w.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2" style={{ fontWeight: 700, fontSize: 13, paddingTop: 14, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1 }}>
                  Total
                </td>
                <td style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: "var(--accent)", paddingTop: 14 }}>
                  ₱{data.total.toLocaleString()}
                </td>
                <td colSpan="2" />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </Layout>
  );
}

export default Walkins;
