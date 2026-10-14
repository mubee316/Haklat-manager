export function getStudentFullName(s = {}) {
  return [s.firstName, s.otherName, s.surname].map((x) => (x || "").trim()).filter(Boolean).join(" ") || s.name || "";
}
export function getStudentIdentity(s = {}) {
  const old = (s.name || "").trim().split(/\s+/).filter(Boolean);
  return { firstName:s.firstName ?? old[0] ?? "", surname:s.surname ?? (old.length > 1 ? old[old.length-1] : ""), otherName:s.otherName ?? (old.length > 2 ? old.slice(1,-1).join(" ") : ""), nin:s.nin||"", dateOfBirth:s.dateOfBirth||"", phone:s.phone||"", passportUrl:s.passportUrl||"", passportFile:null };
}
export default function StudentIdentityFields({form,setForm}) {
 return <div className="grid sm:grid-cols-2 gap-4">
  <Field label="First Name *"><input required autoComplete="given-name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} className="input"/></Field>
  <Field label="Surname *"><input required autoComplete="family-name" value={form.surname} onChange={e=>setForm({...form,surname:e.target.value})} className="input"/></Field>
  <Field label="Other Name"><input value={form.otherName} onChange={e=>setForm({...form,otherName:e.target.value})} className="input"/></Field>
  <Field label="NIN"><input inputMode="numeric" maxLength={11} pattern="[0-9]{11}" title="Enter an 11-digit NIN" value={form.nin} onChange={e=>setForm({...form,nin:e.target.value.replace(/\D/g,"").slice(0,11)})} className="input"/></Field>
  <Field label="Date of Birth"><input type="date" value={form.dateOfBirth} onChange={e=>setForm({...form,dateOfBirth:e.target.value})} className="input"/></Field>
  <Field label="Phone Number"><input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="input"/></Field>
  <div className="sm:col-span-2"><Field label="Passport Photograph">
   <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setForm({...form,passportFile:e.target.files?.[0]||null})} className="input"/>
   <p className="text-xs text-gray-400 mt-1">JPEG, PNG or WebP; maximum 5 MB.</p>
   {form.passportFile&&<p className="text-xs mt-1">{form.passportFile.name}</p>}
   {!form.passportFile&&form.passportUrl&&<a href={form.passportUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600">View current passport</a>}
  </Field></div>
 </div>;
}
function Field({label,children}) { return <div><label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>{children}</div>; }