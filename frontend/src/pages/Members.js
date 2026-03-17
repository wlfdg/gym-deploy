import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { api, clearCache } from "../api/config";
import Layout from "../components/Layout";

const PLANS = ["Basic", "Standard", "Premium", "Student", "Senior"];
const EMPTY_FORM = { name: "", email: "", phone: "", plan: "Basic", months: "", price: "", discount: "0" };

function getStatus(exp) {
  const diff = Math.ceil((new Date(exp) - new Date()) / 864e5);
  if (diff < 0)  return { label: "Expired",      cls: "badge-expired" };
  if (diff <= 7) return { label: "Expiring Soon", cls: "badge-expiring" };
  return           { label: "Active",            cls: "badge-active" };
}

function MemberModal({ member, onClose, onSave }) {
  const [form, setForm]   = useState(() => member ? { ...member, discount: member.discount ?? "0" } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setError("");
    if (!form.name.trim())                       { setError("Full name is required."); return; }
    if (!form.months || Number(form.months) < 1) { setError("Duration must be at least 1 month."); return; }
    if (!form.price  || Number(form.price)  < 0) { setError("Please enter a valid price."); return; }
    setSaving(true);
    try {
      if (member) {
        await api.put(`/members/${member.id}`, form);
      } else {
        await api.post("/members", form);
      }
      clearCache();
      onSave();
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Error saving member.");
    }
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{member ? "Edit Member" : "Add Member"}</h3>
        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        <div className="form-grid">
          <div className="form-group full">
            <label>Full Name *</label>
            <input placeholder="John Doe" value={form.name}
              onChange={e => set("name", e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()} autoFocus />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input placeholder="john@email.com" value={form.email || ""}
              onChange={e => set("email", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input placeholder="09xxxxxxxxx" value={form.phone || ""}
              onChange={e => set("phone", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Plan *</label>
            <select value={form.plan} onChange={e => set("plan", e.target.value)}>
              {PLANS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Duration (Months) *</label>
            <input type="number" min="1" max="60" placeholder="1"
              value={form.months} onChange={e => set("months", e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()} />
          </div>
          <div className="form-group">
            <label>Price (₱) *</label>
            <input type="number" min="0" placeholder="999"
              value={form.price} onChange={e => set("price", e.target.value)}
              onKeyDown={e => e.key === "Enter" && save()} />
          </div>
          <div className="form-group">
            <label>Discount (%)</label>
            <input type="number" min="0" max="100" placeholder="0"
              value={form.discount} onChange={e => set("discount", e.target.value)} />
          </div>
          {member && (
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={form.start_date || ""}
                onChange={e => set("start_date", e.target.value)} />
            </div>
          )}
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : member ? "Update Member" : "Add Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Members() {
  const [members, setMembers]       = useState([]);
  const [search, setSearch]         = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal]   = useState(false);
  const [editMember, setEditMember] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const mounted = useRef(true);

  useEffect(() => { return () => { mounted.current = false; }; }, []);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/members");
      if (!mounted.current) return;
      setMembers(res.data);
    } catch {
      if (!mounted.current) return;
      setError("Failed to load members. Is the server running?");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const deleteMember = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/members/${id}`);
      clearCache();
      fetchMembers();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to delete member.");
    }
  };

  // useMemo so filtering only reruns when deps change
  const filtered = useMemo(() => members.filter(m => {
    const q = search.toLowerCase();
    if (q && !m.name.toLowerCase().includes(q) && !m.email?.toLowerCase().includes(q) && !m.phone?.includes(q)) return false;
    if (planFilter !== "All" && m.plan !== planFilter) return false;
    if (statusFilter !== "All") {
      const s = getStatus(m.expiration_date);
      if (statusFilter === "Active"   && s.label !== "Active")        return false;
      if (statusFilter === "Expiring" && s.label !== "Expiring Soon") return false;
      if (statusFilter === "Expired"  && s.label !== "Expired")       return false;
    }
    return true;
  }), [members, search, planFilter, statusFilter]);

  return (
    <Layout>
      <div className="page-header">
        <h2>Members</h2>
        <p>{members.length} total members registered</p>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search by name, email or phone..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
          style={{ width: "auto", padding: "10px 14px" }}>
          <option value="All">All Plans</option>
          {PLANS.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ width: "auto", padding: "10px 14px" }}>
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring">Expiring Soon</option>
          <option value="Expired">Expired</option>
        </select>
        <button className="btn btn-ghost" onClick={() => window.open(`${process.env.REACT_APP_API_URL || "https://gym-deploy-sul4.onrender.com"}/export/csv`, "_blank")}>
          ⬇ Export CSV
        </button>
        <button className="btn btn-primary" onClick={() => { setEditMember(null); setShowModal(true); }}>
          + Add Member
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">No members found.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Plan</th><th>Months</th>
                  <th>Net Price</th><th>Discount</th><th>Start</th>
                  <th>Expires</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const status = getStatus(m.expiration_date);
                  const net = m.price - (m.price * m.discount / 100);
                  return (
                    <tr key={m.id}>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        {m.email && <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.email}</div>}
                        {m.phone && <div style={{ fontSize: 11, color: "var(--muted)" }}>{m.phone}</div>}
                      </td>
                      <td><span className="badge" style={{ background: "rgba(232,255,0,0.1)", color: "var(--accent)" }}>{m.plan}</span></td>
                      <td>{m.months}mo</td>
                      <td style={{ fontWeight: 600 }}>₱{net.toLocaleString()}</td>
                      <td>{m.discount > 0
                        ? <span style={{ color: "var(--success)" }}>-{m.discount}%</span>
                        : <span style={{ color: "var(--muted)" }}>—</span>}
                      </td>
                      <td style={{ fontSize: 12 }}>{m.start_date}</td>
                      <td style={{ fontSize: 12 }}>{m.expiration_date}</td>
                      <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="btn btn-ghost btn-sm"
                            onClick={() => { setEditMember(m); setShowModal(true); }}>Edit</button>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => deleteMember(m.id, m.name)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {!loading && filtered.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 12, textAlign: "right" }}>
            Showing {filtered.length} of {members.length} members
          </div>
        )}
      </div>

      {showModal && (
        <MemberModal member={editMember} onClose={() => setShowModal(false)} onSave={fetchMembers} />
      )}
    </Layout>
  );
}

export default Members;
