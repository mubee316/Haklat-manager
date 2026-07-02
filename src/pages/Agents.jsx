import { useEffect, useState } from "react";
import { getAgents, addAgent, updateAgent, deleteAgent, generateToken } from "../lib/firestore";
import Modal from "../components/Modal";

const empty = { name: "", school: "", phone: "", email: "" };

function portalUrl(token) {
  return `${window.location.origin}/portal/${token}`;
}

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(null); // agentId of the one just copied

  const load = () =>
    getAgents().then((data) => { setAgents(data); setLoading(false); });

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setEditId(null); setSaveError(""); setModal("form"); };
  const openEdit = (agent) => {
    setForm({ name: agent.name, school: agent.school, phone: agent.phone, email: agent.email || "" });
    setEditId(agent.id);
    setModal("form");
  };
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      if (editId) { await updateAgent(editId, form); }
      else { await addAgent(form); }
      await load();
      closeModal();
    } catch (err) {
      setSaveError(err.message || "Failed to save. Check Firestore rules.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this agent? Students linked to them will lose their agent reference.")) return;
    await deleteAgent(id);
    load();
  };

  const handleGenerateToken = async (agent) => {
    if (!confirm("Generate a new portal link for this agent? The old link will stop working.")) return;
    await updateAgent(agent.id, { token: generateToken() });
    load();
  };

  const handleCopy = (agent) => {
    navigator.clipboard.writeText(portalUrl(agent.token));
    setCopied(agent.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Agents / Schools</h2>
          <p className="text-gray-500 text-sm mt-0.5">Each agent gets a private link to register their own students</p>
        </div>
        <button onClick={openAdd} className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add Agent
        </button>
      </div>

      <input
        type="text"
        placeholder="Search agents..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full sm:w-72 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-700"
      />

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">No agents found. Add one to get started.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent) => (
            <div key={agent.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{agent.name}</p>
                  <p className="text-sm text-gray-500">{agent.school}</p>
                </div>
                <div className="flex gap-2 ml-2 shrink-0">
                  <button onClick={() => openEdit(agent)} className="text-xs text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => handleDelete(agent.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-500">
                {agent.phone && <p><span className="text-gray-400 text-xs">Tel</span> &nbsp;<a href={`tel:${agent.phone}`} className="hover:underline text-gray-700">{agent.phone}</a></p>}
                {agent.email && <p><span className="text-gray-400 text-xs">Email</span> &nbsp;<a href={`mailto:${agent.email}`} className="hover:underline text-gray-700">{agent.email}</a></p>}
              </div>

              {/* Portal link section */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Agent Portal Link</p>
                {agent.token ? (
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={portalUrl(agent.token)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 flex-1 min-w-0 text-gray-600 truncate"
                    />
                    <button
                      onClick={() => handleCopy(agent)}
                      className={`shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors ${
                        copied === agent.id
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {copied === agent.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleGenerateToken(agent)}
                    className="text-xs text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    Generate Link
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "form" && (
        <Modal title={editId ? "Edit Agent" : "Add Agent"} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Agent / Contact Name *">
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mr. Bello" className="input" />
            </Field>
            <Field label="School / Organisation *">
              <input type="text" required value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} placeholder="e.g. Unity Secondary School" className="input" />
            </Field>
            <Field label="Phone Number *">
              <input type="tel" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 08012345678" className="input" />
            </Field>
            <Field label="Email (optional)">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. agent@school.edu.ng" className="input" />
            </Field>
            {saveError && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{saveError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
              <button type="submit" disabled={saving} className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                {saving ? "Saving..." : editId ? "Save Changes" : "Add Agent"}
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
