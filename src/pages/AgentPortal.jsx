import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAgentByToken, getStudentsByAgent, addStudent, updateStudent, deleteStudent } from "../lib/firestore";
import Modal from "../components/Modal";

const WAEC_SUBJECTS = [
  "English Language", "Mathematics", "Biology", "Chemistry", "Physics",
  "Agricultural Science", "Economics", "Government", "Literature in English",
  "Geography", "Civic Education", "Commerce", "Accounting", "Further Mathematics",
  "Technical Drawing", "Food and Nutrition", "Home Economics", "Computer Studies",
  "Christian Religious Studies", "Islamic Studies", "Yoruba", "Igbo", "Hausa",
  "French", "Visual Art", "Music", "Physical Education",
];

const emptyForm = { name: "", subjects: [] };

export default function AgentPortal() {
  const { token } = useParams();

  const [agent, setAgent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [customSubject, setCustomSubject] = useState("");

  const loadStudents = (agentId) => getStudentsByAgent(agentId).then(setStudents);

  useEffect(() => {
    getAgentByToken(token)
      .then((a) => {
        if (!a) { setNotFound(true); return; }
        setAgent(a);
        return loadStudents(a.id);
      })
      .catch((err) => { console.error(err); setNotFound(true); })
      .finally(() => setLoading(false));
  }, [token]);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setCustomSubject(""); setModal("form"); };
  const openEdit = (s) => { setForm({ name: s.name, subjects: s.subjects || [] }); setEditId(s.id); setCustomSubject(""); setModal("form"); };
  const openView = (s) => { setForm({ name: s.name, subjects: s.subjects || [] }); setEditId(s.id); setModal("view"); };
  const closeModal = () => { setModal(null); setCustomSubject(""); };

  const toggleSubject = (sub) =>
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(sub)
        ? f.subjects.filter((s) => s !== sub)
        : [...f.subjects, sub],
    }));

  const addCustomSubject = () => {
    const s = customSubject.trim();
    if (s && !form.subjects.includes(s)) setForm((f) => ({ ...f, subjects: [...f.subjects, s] }));
    setCustomSubject("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.subjects.length === 0) { alert("Please select at least one subject."); return; }
    setSaving(true);
    const data = { name: form.name, subjects: form.subjects, type: "external", agentId: agent.id };
    if (editId) { await updateStudent(editId, data); }
    else { await addStudent(data); }
    await loadStudents(agent.id);
    setSaving(false);
    closeModal();
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this candidate from the list?")) return;
    await deleteStudent(id);
    loadStudents(agent.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Please wait...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-800 mb-1">Access Denied</h1>
          <p className="text-sm text-gray-500">This link is invalid or has expired. Please contact Haklat for a valid registration link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Haklat Exam Management System</p>
          <h1 className="text-xl font-bold text-gray-900">{agent.school}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{agent.name} &nbsp;&bull;&nbsp; {agent.phone}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Registered Candidates</h2>
            <p className="text-sm text-gray-400 mt-0.5">{students.length} candidate{students.length !== 1 ? "s" : ""} registered</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Register Candidate
          </button>
        </div>

        {/* Student table */}
        {students.length === 0 ? (
          <div className="border border-dashed border-gray-200 rounded-xl py-14 text-center">
            <p className="text-sm font-medium text-gray-500">No candidates registered yet</p>
            <p className="text-xs text-gray-400 mt-1">Click <span className="font-medium">Register Candidate</span> to add your first student</p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Subjects</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{(s.subjects || []).length} subject{(s.subjects || []).length !== 1 ? "s" : ""}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openView(s)} className="text-xs text-gray-500 hover:text-gray-800 mr-3">View</button>
                      <button onClick={() => openEdit(s)} className="text-xs text-gray-500 hover:text-gray-800 mr-3">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 text-center">
          Haklat WAEC/NECO Exam Management &nbsp;&bull;&nbsp; This link is private to your school
        </p>
      </div>

      {/* View modal */}
      {modal === "view" && (
        <Modal title={form.name} onClose={closeModal}>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subjects ({form.subjects.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {form.subjects.map((s) => (
                <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded border border-gray-200">{s}</span>
              ))}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => { closeModal(); openEdit({ id: editId, ...form }); }} className="text-sm text-gray-600 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">Edit</button>
            <button onClick={closeModal} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">Close</button>
          </div>
        </Modal>
      )}

      {/* Add / Edit modal */}
      {modal === "form" && (
        <Modal title={editId ? "Edit Candidate" : "Register Candidate"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter candidate's full name"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subjects <span className="text-red-400">*</span>
                {form.subjects.length > 0 && <span className="ml-2 text-xs font-normal text-gray-400">{form.subjects.length} selected</span>}
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50 mb-2">
                {WAEC_SUBJECTS.map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubject(sub)}
                    className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                      form.subjects.includes(sub)
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
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
                  placeholder="Other subject not listed above..."
                  className="input flex-1 text-sm"
                />
                <button type="button" onClick={addCustomSubject} className="border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">Add</button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                {saving ? "Saving..." : editId ? "Save Changes" : "Register"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
