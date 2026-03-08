import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import API, { storeSession } from "../api/config";

function Login() {
  const [mode, setMode]         = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg]           = useState({ text: "", type: "" });
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const reset = (newMode) => { setMode(newMode); setUsername(""); setPassword(""); setMsg({ text: "", type: "" }); };

  const login = async () => {
    if (!username.trim() || !password) { setMsg({ text: "Please fill in all fields.", type: "error" }); return; }
    setLoading(true); setMsg({ text: "", type: "" });
    try {
      const res = await axios.post(`${API}/login`, { username: username.trim(), password });
      if (res.data.success) {
        storeSession(res.data.username, res.data.role, res.data.shift_id);
        navigate("/dashboard", { replace: true });
      }
    } catch (e) {
      setMsg({ text: e.response?.data?.message || "Invalid username or password.", type: "error" });
    }
    setLoading(false);
  };

  const register = async () => {
    if (!username.trim() || !password) { setMsg({ text: "Please fill in all fields.", type: "error" }); return; }
    if (password.length < 6) { setMsg({ text: "Password must be at least 6 characters.", type: "error" }); return; }
    setLoading(true); setMsg({ text: "", type: "" });
    try {
      const res = await axios.post(`${API}/register`, { username: username.trim(), password });
      setMsg({ text: res.data.message, type: "success" });
      setUsername(""); setPassword("");
    } catch (e) {
      setMsg({ text: e.response?.data?.message || "Registration failed.", type: "error" });
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === "Enter") mode === "login" ? login() : register(); };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 style={{ textAlign:"center", color:"var(--accent)", fontSize:48, lineHeight:0.9, marginBottom:4, fontFamily:"'Bebas Neue',cursive", letterSpacing:2 }}>
          LOYD'S FITNESS GYM
        </h1>
        <p className="subtitle" style={{ textAlign:"center" }}>
          {mode === "login" ? "Admin Portal" : "Request Admin Access"}
        </p>

        {msg.text && (
          <div style={{
            padding:"10px 14px", borderRadius:7, fontSize:13, marginBottom:8,
            background: msg.type==="error" ? "rgba(255,23,68,0.08)" : "rgba(0,230,118,0.1)",
            border: `1px solid ${msg.type==="error" ? "rgba(255,23,68,0.25)" : "rgba(0,230,118,0.3)"}`,
            color: msg.type==="error" ? "var(--danger)" : "var(--success)"
          }}>
            {msg.text}
          </div>
        )}

        {/* Pending notice after register */}
        {mode === "register" && msg.type === "success" && (
          <div style={{ background:"rgba(232,255,0,0.06)", border:"1px solid rgba(232,255,0,0.2)", borderRadius:10, padding:"16px", marginTop:8, textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
            <div style={{ fontWeight:700, color:"var(--accent)", marginBottom:4 }}>Awaiting Approval</div>
            <div style={{ fontSize:12, color:"var(--muted)" }}>
              Your request has been sent to the primary admin.<br />
              You'll be able to log in once approved.
            </div>
            <button className="btn btn-ghost" style={{ marginTop:14, width:"100%" }} onClick={() => reset("login")}>
              ← Back to Login
            </button>
          </div>
        )}

        {!(mode === "register" && msg.type === "success") && (
          <>
            <div className="login-form">
              <input placeholder={mode==="login" ? "Username" : "Choose a username"}
                value={username} onChange={e=>setUsername(e.target.value)}
                onKeyDown={handleKey} autoFocus autoComplete="username" />
              <input type="password"
                placeholder={mode==="login" ? "Password" : "Password (min 6 chars)"}
                value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={handleKey}
                autoComplete={mode==="login" ? "current-password" : "new-password"} />
              <button className="btn btn-primary" onClick={mode==="login" ? login : register} disabled={loading}>
                {loading
                  ? (mode==="login" ? "Signing in..." : "Submitting...")
                  : (mode==="login" ? "Sign In →" : "Request Access")}
              </button>
            </div>
            <p style={{ marginTop:24, fontSize:12, color:"var(--muted)", textAlign:"center", cursor:"pointer", textDecoration:"underline" }}
              onClick={() => reset(mode==="login" ? "register" : "login")}>
              {mode==="login" ? "Request Admin Access" : "← Back to Login"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
