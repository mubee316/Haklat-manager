import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AdminGate from "./components/AdminGate";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Students from "./pages/Students";
import Sessions from "./pages/Sessions";
import Attendance from "./pages/Attendance";
import AgentPortal from "./pages/AgentPortal";

function AdminLayout() {
  return (
    <AdminGate>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/students" element={<Students />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:sessionId" element={<Attendance />} />
        </Routes>
      </div>
    </AdminGate>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public agent portal — no PIN required */}
        <Route path="/portal/:token" element={<AgentPortal />} />

        {/* All admin routes — PIN protected */}
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
