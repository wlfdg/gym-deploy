import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import API from "../api/config";

function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const reset = (newMode) => {
    setMode(newMode);
    setUsername("");
    setPassword("");
    setMsg({ text: "", type: "" });
  };

  const login = async () => {
    if (!username.trim() || !password) {
      setMsg({ text: "Please fill in all fields.", type: "error" });
      return;
    }
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      const res = await axios.post(`${API}/login`, { username: username.trim(), password });
      if (res.data.success) {
        localStorage.setItem("gym_admin", res.data.username);
        navigate("/dashboard", { replace: true });
      }
    } catch (e) {
      setMsg({ text: e.response?.data?.message || "Invalid username or password.", type: "error" });
    }
    setLoading(false);
  };

  const register = async () => {
    if (!username.trim() || !password) {
      setMsg({ text: "Please fill in all fields.", type: "error" });
      return;
    }
    if (password.length < 6) {
      setMsg({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      await axios.post(`${API}/register`, { username: username.trim(), password });
      setMsg({ text: "✅ Account created! You can now log in.", type: "success" });
      setUsername("");
      setPassword("");
      setTimeout(() => reset("login"), 1500);
    } catch (e) {
      setMsg({ text: e.response?.data?.message || "❌ Registration failed.", type: "error" });
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") mode === "login" ? login() : register();
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <h1 style={{ textAlign: "center", color: "var(--accent)", fontSize: 52, lineHeight: 0.9, marginBottom: 4 }}>
          LOYD'S FITNESS GYM
        </h1>
        <p className="subtitle" style={{ textAlign: "center" }}>Admin Portal</p>

        {msg.text && (
          <div className={msg.type === "error" ? "error-msg" : ""}
            style={msg.type === "success" ? {
              background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.3)",
              color: "var(--success)", padding: "10px 14px", borderRadius: 7, fontSize: 13, marginBottom: 8
            } : { marginBottom: 8 }}>
            {msg.text}
          </div>
        )}

        <div className="login-form">
          <input
            placeholder={mode === "login" ? "Username" : "New Username"}
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
            autoComplete="username"
          />
          <input
            type="password"
            placeholder={mode === "login" ? "Password" : "New Password (min 6 chars)"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKey}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          <button
            className="btn btn-primary"
            onClick={mode === "login" ? login : register}
            disabled={loading}
          >
            {loading
              ? (mode === "login" ? "Signing in..." : "Creating...")
              : (mode === "login" ? "Sign In →" : "Create Account")}
          </button>
        </div>

        <p
          style={{ marginTop: 24, fontSize: 12, color: "var(--muted)", textAlign: "center", cursor: "pointer", textDecoration: "underline" }}
          onClick={() => reset(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Create an Account" : "← Back to Login"}
        </p>
      </div>
    </div>
  );
}

export default Login;
