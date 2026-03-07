import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Alerts from "./pages/Alerts";
import Walkins from "./pages/Walkins";
import Attendance from "./pages/Attendance";
import Reports from "./pages/Reports";

function PrivateRoute({ children }) {
  const auth = localStorage.getItem("gym_admin");
  return auth ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/members"    element={<PrivateRoute><Members /></PrivateRoute>} />
        <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
        <Route path="/walkins"    element={<PrivateRoute><Walkins /></PrivateRoute>} />
        <Route path="/alerts"     element={<PrivateRoute><Alerts /></PrivateRoute>} />
        <Route path="/reports"    element={<PrivateRoute><Reports /></PrivateRoute>} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
