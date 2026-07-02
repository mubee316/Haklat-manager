import { useState } from "react";

const STORAGE_KEY = "haklat_admin_auth";
const CORRECT_PIN = import.meta.env.VITE_ADMIN_PIN;

export default function AdminGate({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === "1");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
      setPin("");
    }
  };

  if (authed) return children;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-xs">
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Haklat Exam Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Staff Login</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Access PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(false); }}
              placeholder="Enter your PIN"
              autoFocus
              className="input text-base"
            />
            {error && (
              <p className="text-red-500 text-xs mt-2">Incorrect PIN. Please try again.</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-lg text-sm font-semibold"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
