import { useEffect, useState } from "react";
import { getSessions, addSession, deleteSession } from "../lib/firestore";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";

const WAEC_SUBJECTS = [
  "English Language", "Mathematics", "Biology", "Chemistry", "Physics",
  "Agricultural Science", "Economics", "Government", "Literature in English",
  "Geography", "Civic Education", "Commerce", "Accounting", "Further Mathematics",
  "Technical Drawing", "Food and Nutrition", "Home Economics", "Computer Studies",
  "Christian Religious Studies", "Islamic Studies", "Yoruba", "Igbo", "Hausa",
  "French", "Visual Art", "Music", "Physical Education",
];

const empty = { subject: "", date: "", examType: "WAEC", paper: "" };

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [customSubject, setCustomSubject] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = () => getSessions().then((s) => { setSessions(s); setLoading(false); });

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalSubject = form.subject === "__custom" ? customSubject.trim() : form.subject;
    if (!finalSubject) { alert("Please enter a subject name."); return; }
    setSaving(true);
    await addSession({ ...form, subject: finalSubject });
    await load();
    setSaving(false);
    setModal(false);
    setForm(empty);
    setCustomSubject("");
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Delete this session? All attendance records for it will be lost.")) return;
    await deleteSession(id);
    load();
  };

  const grouped = sessions.reduce((acc, s) => {
    const month = s.date ? new Date(s.date).toLocaleDateString("en-NG", { month: "long", year: "numeric" }) : "No date";
    if (!acc[month]) acc[month] = [];
    acc[month].push(s);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Exam Sessions</h2>
          <p className="text-gray-500 text-sm mt-0.5">Each session is one exam paper on one day</p>
        </div>
        <button onClick={() => { setForm(empty); setCustomSubject(""); setModal(true); }} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Create Session
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-400 text-sm">No sessions yet. Create one to start tracking attendance.</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([month, group]) => (
            <div key={month}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{month}</h3>
              <div className="space-y-2">
                {group.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => navigate(`/sessions/${s.id}`)}
                    className="bg-white border border-gray-100 rounded-xl px-4 py-3.5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">{s.examType}</span>
                        <p className="font-semibold text-gray-800">{s.subject}</p>
                        {s.paper && <span className="text-xs text-gray-400">({s.paper})</span>}
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {s.date ? new Date(s.date).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "No date set"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-700 text-sm font-medium hidden sm:block">Take Attendance →</span>
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="Create Exam Session" onClose={() => { setModal(false); setCustomSubject(""); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Exam Type *">
              <select value={form.examType} onChange={(e) => setForm({ ...form, examType: e.target.value })} className="input">
                <option>WAEC</option>
                <option>NECO</option>
                <option>NABTEB</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="Subject *">
              <select
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="input"
              >
                <option value="">Select a subject...</option>
                {WAEC_SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                <option value="__custom">Other (type below)</option>
              </select>
              {form.subject === "__custom" && (
                <input
                  type="text"
                  required
                  value={customSubject}
                  placeholder="Enter subject name"
                  className="input mt-2"
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              )}
            </Field>
            <Field label="Paper (optional)">
              <input
                type="text"
                value={form.paper}
                onChange={(e) => setForm({ ...form, paper: e.target.value })}
                placeholder="e.g. Paper 1 (Objective)"
                className="input"
              />
            </Field>
            <Field label="Date *">
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                {saving ? "Creating..." : "Create Session"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
