import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStudents, getAgents, getAttendance, bulkSaveAttendance } from "../lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function Attendance() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: true|false }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAbsent, setFilterAbsent] = useState(false);

  useEffect(() => {
    Promise.all([
      getDoc(doc(db, "sessions", sessionId)),
      getStudents(),
      getAgents(),
      getAttendance(sessionId),
    ]).then(([sessionSnap, studentsData, agentsData, attendanceData]) => {
      setSession({ id: sessionSnap.id, ...sessionSnap.data() });
      setStudents(studentsData);
      setAgents(agentsData);

      // Default all students to present if no record yet
      const initial = {};
      studentsData.forEach((s) => {
        initial[s.id] = attendanceData[s.id] !== undefined ? attendanceData[s.id] : true;
      });
      setAttendance(initial);
      setLoading(false);
    });
  }, [sessionId]);

  const agentMap = useMemo(
    () => Object.fromEntries(agents.map((a) => [a.id, a])),
    [agents]
  );

  const toggle = (studentId) => {
    setSaved(false);
    setAttendance((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const markAllPresent = () => {
    setSaved(false);
    const all = {};
    students.forEach((s) => { all[s.id] = true; });
    setAttendance(all);
  };

  const handleSave = async () => {
    setSaving(true);
    await bulkSaveAttendance(sessionId, attendance);
    setSaving(false);
    setSaved(true);
  };

  const absentStudents = students.filter((s) => attendance[s.id] === false);
  const presentCount = students.filter((s) => attendance[s.id] === true).length;

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = !filterAbsent || attendance[s.id] === false;
      return matchSearch && matchFilter;
    });
  }, [students, search, filterAbsent, attendance]);

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-8 text-gray-400">Loading session...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button onClick={() => navigate("/sessions")} className="text-sm text-gray-400 hover:text-gray-600 mb-4 flex items-center gap-1">
        ← Back to Sessions
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">{session?.examType}</span>
          <h2 className="text-2xl font-bold text-gray-800">{session?.subject}</h2>
          {session?.paper && <span className="text-gray-400 text-sm">({session.paper})</span>}
        </div>
        <p className="text-gray-500 text-sm">
          {session?.date ? new Date(session.date).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
        </p>
        <div className="flex gap-4 mt-3 text-sm">
          <span className="text-gray-800 font-medium">{presentCount} present</span>
          <span className="text-red-500 font-medium">{absentStudents.length} absent</span>
          <span className="text-gray-400">{students.length} total</span>
        </div>
      </div>

      {/* Absent students summary */}
      {absentStudents.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 mb-3 text-sm">Absent Students — Agent Contact Info</h3>
          <div className="space-y-2">
            {absentStudents.map((s) => {
              const agent = agentMap[s.agentId];
              return (
                <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-red-100 gap-1">
                  <div>
                    <span className="font-medium text-gray-800">{s.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${s.type === "internal" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}>{s.type}</span>
                  </div>
                  {s.type === "external" ? (
                    agent ? (
                      <div className="text-sm text-gray-500">
                        <span className="font-medium text-gray-700">{agent.name}</span> — {agent.school}
                        {agent.phone && (
                          <a href={`tel:${agent.phone}`} className="ml-2 text-gray-800 font-semibold hover:underline">{agent.phone}</a>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-red-400">No agent assigned</span>
                    )
                  ) : (
                    <span className="text-xs text-gray-400">Internal student</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attendance table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700 flex-1 sm:max-w-xs"
          />
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterAbsent(!filterAbsent)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${filterAbsent ? "bg-red-100 text-red-700 border border-red-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {filterAbsent ? "Showing absent only" : "Show absent only"}
            </button>
            <button onClick={markAllPresent} className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-800 border border-gray-300 hover:bg-gray-200">
              Mark all present
            </button>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">No students match.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Agent / School</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredStudents.map((s) => {
                const present = attendance[s.id] !== false;
                const agent = agentMap[s.agentId];
                return (
                  <tr key={s.id} className={`transition-colors ${!present ? "bg-red-50/60" : "hover:bg-gray-50"}`}>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800">{s.name}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${s.type === "internal" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}>{s.type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {s.type === "external"
                        ? agent ? `${agent.name} (${agent.school})` : <span className="text-red-400">No agent</span>
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(s.id)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          present
                            ? "bg-gray-200 text-gray-800 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            : "bg-red-100 text-red-600 border-red-200 hover:bg-gray-100 hover:text-gray-800 hover:border-gray-300"
                        }`}
                      >
                        {present ? "Present" : "Absent"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-400">Click a student's status to toggle it</p>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-gray-800 font-medium">Saved ✓</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
