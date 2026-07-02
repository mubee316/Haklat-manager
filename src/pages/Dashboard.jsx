import { useEffect, useState } from "react";
import { getAgents, getStudents, getSessions } from "../lib/firestore";

export default function Dashboard() {
  const [stats, setStats] = useState({ agents: 0, students: 0, internal: 0, external: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAgents(), getStudents(), getSessions()]).then(
      ([agents, students, sessions]) => {
        setStats({
          agents: agents.length,
          students: students.length,
          internal: students.filter((s) => s.type === "internal").length,
          external: students.filter((s) => s.type === "external").length,
          sessions: sessions.length,
        });
        setLoading(false);
      }
    );
  }, []);

  const cards = [
    { label: "Total Students", value: stats.students, sub: `${stats.internal} internal · ${stats.external} external` },
    { label: "Registered Agents", value: stats.agents, sub: "Schools & individuals" },
    { label: "Exam Sessions", value: stats.sessions, sub: "Papers created" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 pb-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Overview</h2>
        <p className="text-sm text-gray-400 mt-0.5">Haklat WAEC/NECO Exam Management System</p>
      </div>

      {loading ? (
        <div className="flex gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex-1 h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {cards.map((c) => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-3xl font-bold text-gray-900">{c.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{c.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">Quick Reference</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { step: "1", title: "Add Agents", desc: "Register each school or individual bringing external students, then share their portal link." },
            { step: "2", title: "Register Students", desc: "Add internal students manually, or let agents register their own students via their portal link." },
            { step: "3", title: "Create Exam Sessions", desc: "Add one session per paper — e.g. English Language, 30 June." },
            { step: "4", title: "Take Attendance", desc: "Open a session during the exam. Mark absent students to instantly see their agent's contact." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 px-5 py-4">
              <span className="text-xs font-bold text-gray-400 w-4 shrink-0 mt-0.5">{item.step}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
