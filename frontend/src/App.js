import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

const Login      = lazy(() => import("./pages/Login"));
const Dashboard  = lazy(() => import("./pages/Dashboard"));
const Members    = lazy(() => import("./pages/Members"));
const Alerts     = lazy(() => import("./pages/Alerts"));
const Walkins    = lazy(() => import("./pages/Walkins"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Reports    = lazy(() => import("./pages/Reports"));
const AdminDTR   = lazy(() => import("./pages/AdminDTR"));

function Loader() {
  return (
    <div style={{
      minHeight:"100vh", background:"#111", display:"flex",
      alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16
    }}>
      <div style={{
        width:36, height:36, border:"3px solid rgba(232,255,0,0.2)",
        borderTop:"3px solid #e8ff00", borderRadius:"50%",
        animation:"spin 0.7s linear infinite"
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PrivateRoute({ children }) {
  const auth = localStorage.getItem("gym_admin");
  return auth ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/"           element={<Login />} />
          <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/members"    element={<PrivateRoute><Members /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
          <Route path="/walkins"    element={<PrivateRoute><Walkins /></PrivateRoute>} />
          <Route path="/alerts"     element={<PrivateRoute><Alerts /></PrivateRoute>} />
          <Route path="/reports"    element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/dtr"        element={<PrivateRoute><AdminDTR /></PrivateRoute>} />
          <Route path="*"           element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
