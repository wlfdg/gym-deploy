import { useState } from "react";
import Layout from "../components/Layout";

import API from "../api/config";

const MONTHS = [
  { value: "01", label: "January" }, { value: "02", label: "February" },
  { value: "03", label: "March" },   { value: "04", label: "April" },
  { value: "05", label: "May" },     { value: "06", label: "June" },
  { value: "07", label: "July" },    { value: "08", label: "August" },
  { value: "09", label: "September"},{ value: "10", label: "October" },
  { value: "11", label: "November" },{ value: "12", label: "December" }
];

function Reports() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const years = [];
  for (let y = now.getFullYear(); y >= 2023; y--) years.push(String(y));

  const downloadReport = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch(`${API}/report/excel?month=${month}&year=${year}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LoydsGym_Report_${MONTHS.find(m => m.value === month)?.label}_${year}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      alert("Error generating report. Make sure Flask is running.");
    }
    setLoading(false);
  };

  const selectedMonthName = MONTHS.find(m => m.value === month)?.label;

  return (
    <Layout>
      <div className="page-header">
        <h2>Reports</h2>
        <p>Generate monthly Excel reports for Loyd's Fitness Gym</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Generator card */}
        <div className="card" style={{ borderColor: "rgba(232,255,0,0.2)", background: "linear-gradient(135deg, #1a1a1a 0%, #1f1f0a 100%)" }}>
          <h3 style={{ fontSize: 24, marginBottom: 6 }}>📊 Generate Excel Report</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
            Select a month and year to download a full Excel report.
          </p>

          <div className="form-grid">
            <div className="form-group">
              <label>Month</label>
              <select value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <select value={year} onChange={e => setYear(e.target.value)}>
                {years.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>

          {success && (
            <div style={{
              background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
              color: "var(--success)", padding: "10px 14px", borderRadius: 8,
              fontSize: 13, marginBottom: 16
            }}>
              ✅ Report downloaded successfully!
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={downloadReport}
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", padding: 14, fontSize: 14 }}
          >
            {loading ? "⏳ Generating..." : `⬇ Download ${selectedMonthName} ${year} Report`}
          </button>
        </div>

        {/* What's included card */}
        <div className="card">
          <h3 style={{ fontSize: 22, marginBottom: 16 }}>📋 What's Included</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { icon: "📊", title: "Summary Sheet", desc: "KPI cards: total members, revenue, new sign-ups, walk-ins, attendance count" },
              { icon: "👥", title: "All Members Sheet", desc: "Complete member list with plan, price, status (Active / Expiring / Expired)" },
              { icon: "🚶", title: "Walk-ins Sheet", desc: "All walk-in entries for the month with amounts and running total" },
              { icon: "⏱", title: "Attendance Sheet", desc: "Full attendance log with time-in, time-out and duration per member" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick download buttons for recent months */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: 20, marginBottom: 16 }}>⚡ Quick Download</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[0, 1, 2, 3, 4, 5].map(offset => {
            const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const y = String(d.getFullYear());
            const label = d.toLocaleString("default", { month: "short", year: "numeric" });
            return (
              <button
                key={offset}
                className={`btn ${offset === 0 ? "btn-primary" : "btn-ghost"}`}
                onClick={() => { setMonth(m); setYear(y); }}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>
          Click a month to select it, then click the Download button above.
        </p>
      </div>
    </Layout>
  );
}

export default Reports;
