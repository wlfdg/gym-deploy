import { NavLink, useNavigate } from "react-router-dom";

const NAV_LINKS = [
  { to: "/dashboard",  icon: "⚡", label: "Dashboard" },
  { to: "/members",    icon: "👥", label: "Members" },
  { to: "/attendance", icon: "⏱",  label: "Attendance" },
  { to: "/walkins",    icon: "🚶", label: "Walk-ins" },
  { to: "/alerts",     icon: "🔔", label: "Alerts" },
  { to: "/reports",    icon: "📊", label: "Reports" },
];

function Layout({ children }) {
  const navigate = useNavigate();
  const admin = localStorage.getItem("gym_admin") || "Admin";

  const logout = () => {
    localStorage.removeItem("gym_admin");
    navigate("/", { replace: true });
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>LOYD'S<br />FITNESS</h1>
          <span>Loyd's Fitness Gym</span>
        </div>
        <nav>
          {NAV_LINKS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
            >
              <span className="icon">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>
            {admin}
          </div>
          <button className="logout-btn" onClick={logout}>↩ Logout</button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

export default Layout;
