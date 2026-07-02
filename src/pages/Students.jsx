import { useEffect, useState } from "react";
import { getStudents, addStudent, updateStudent, deleteStudent, getAgents } from "../lib/firestore";
import Modal from "../components/Modal";

const WAEC_SUBJECTS = [
  "English Language", "Mathematics", "Biology", "Chemistry", "Physics",
  "Agricultural Science", "Economics", "Government", "Literature in English",
  "Geography", "Civic Education", "Commerce", "Accounting", "Further Mathematics",
  "Technical Drawing", "Food and Nutrition", "Home Economics", "Computer Studies",
  "Christian Religious Studies", "Islamic Studies", "Yoruba", "Igbo", "Hausa",
  "French", "Visual Art", "Music", "Physical Education",
];

const empty = { name: "", type: "external", agentId: "", subjects: [] };

export default function Students() {
  const [students, setStudents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [customSubject, setCustomSubject] = useState("");

  const load = () =>
    Promise.all([getStudents(), getAgents()]).then(([s, a]) => {
      setStudents(s);
      setAgents(a);
      setLoading(false);
    });

  useEffect(() => { load(); }, []);

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]));

  const openAdd = () => { setForm(empty); setEditId(null); setModal("form"); };
  const openEdit = (s) => {
    setForm({ name: s.name, type: s.type, agentId: s.agentId || "", subjects: s.subjects || [] });
    setEditId(s.id);
    setModal("form");
  };
  const closeModal = () => { setModal(null); setCustomSubject(""); };

  const toggleSubject = (sub) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(sub)
        ? f.subjects.filter((s) => s !== sub)
        : [...f.subjects, sub],
    }));
  };

  const addCustomSubject = () => {
    const s = customSubject.trim();
    if (s && !form.subjects.includes(s)) {
      setForm((f) => ({ ...f, subjects: [...f.subjects, s] }));
    }
    setCustomSubject("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.subjects.length === 0) { alert("Please select at least one subject."); return; }
    setSaving(true);
    const data = { ...form, agentId: form.type === "internal" ? "" : form.agentId };
    if (editId) { await updateStudent(editId, data); }
    else { await addStudent(data); }
    await load();
    setSaving(false);
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this student?")) return;
    await deleteStudent(id);
    load();
  };

  const openView = (s) => { setForm({ name: s.name, type: s.type, agentId: s.agentId || "", subjects: s.subjects || [] }); setEditId(s.id); setModal("view"); };

  const filtered = students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || s.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Students</h2>
          <p className="text-gray-500 text-sm mt-0.5">{students.length} students registered</p>
        </div>
        <button onClick={openAdd} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Student
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700 w-full sm:w-64"
        />
        {["all", "internal", "external"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize ${filterType === t ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No students found.</p>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Agent / School</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Subjects</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => {
                const agent = agentMap[s.agentId];
                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.type === "internal" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {agent ? `${agent.name} (${agent.school})` : s.type === "internal" ? "—" : <span className="text-red-400">No agent</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {(s.subjects || []).length} subject{(s.subjects || []).length !== 1 ? "s" : ""}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openView(s)} className="text-xs text-gray-700 hover:underline mr-3">View</button>
                      <button onClick={() => openEdit(s)} className="text-xs text-blue-600 hover:underline mr-3">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal === "view" && (
        <Modal title={form.name} onClose={closeModal}>
          <div className="space-y-3 text-sm">
            <Row label="Type" value={<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${form.type === "internal" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>{form.type}</span>} />
            {form.type === "external" && (
              <Row
                label="Agent / School"
                value={
                  agentMap[form.agentId]
                    ? <span>{agentMap[form.agentId].name} — {agentMap[form.agentId].school}<br /><span className="text-gray-800">{agentMap[form.agentId].phone}</span></span>
                    : <span className="text-red-400">No agent assigned</span>
                }
              />
            )}
            <div>
              <p className="font-medium text-gray-600 mb-2">Subjects ({form.subjects.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {form.subjects.map((s) => (
                  <span key={s} className="bg-gray-100 border border-gray-300 text-gray-700 text-xs px-2 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => { closeModal(); openEdit({ id: editId, ...form }); }} className="text-sm text-blue-600 hover:underline">Edit</button>
            <button onClick={closeModal} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">Close</button>
          </div>
        </Modal>
      )}

      {modal === "form" && (
        <Modal title={editId ? "Edit Student" : "Add Student"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name *">
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aisha Bello" className="input" />
            </Field>

            <Field label="Student Type *">
              <div className="flex gap-3">
                {["external", "internal"].map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => setForm({ ...form, type: t, agentId: "" })} />
                    <span className="capitalize text-sm">{t}</span>
                  </label>
                ))}
              </div>
            </Field>

            {form.type === "external" && (
              <Field label="Agent / School *">
                <select
                  required
                  value={form.agentId}
                  onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                  className="input"
                >
                  <option value="">Select an agent...</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} — {a.school}</option>
                  ))}
                </select>
                {agents.length === 0 && <p className="text-xs text-orange-500 mt-1">No agents yet. Add agents first.</p>}
              </Field>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subjects *</label>
              <div className="flex flex-wrap gap-1.5 mb-2 max-h-48 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50">
                {WAEC_SUBJECTS.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.subjects.includes(sub) ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-600 border-gray-200 hover:border-gray-500"}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSubject(); } }}
                  placeholder="Add custom subject..."
                  className="input flex-1 text-sm"
                />
                <button type="button" onClick={addCustomSubject} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm">Add</button>
              </div>
              {form.subjects.length > 0 && (
                <p className="text-xs text-gray-800 mt-2">{form.subjects.length} subject(s) selected: {form.subjects.join(", ")}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                {saving ? "Saving..." : editId ? "Save Changes" : "Add Student"}
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

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}
