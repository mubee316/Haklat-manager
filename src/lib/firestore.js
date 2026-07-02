import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export function generateToken() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// ── Agents ──────────────────────────────────────────────────────────────────

export async function getAgents() {
  const snap = await getDocs(query(collection(db, "agents"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getAgentByToken(token) {
  const snap = await getDocs(query(collection(db, "agents"), where("token", "==", token)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function addAgent(data) {
  return addDoc(collection(db, "agents"), {
    ...data,
    token: generateToken(),
    createdAt: serverTimestamp(),
  });
}

export async function updateAgent(id, data) {
  return updateDoc(doc(db, "agents", id), data);
}

export async function deleteAgent(id) {
  return deleteDoc(doc(db, "agents", id));
}

// ── Students ─────────────────────────────────────────────────────────────────

export async function getStudents() {
  const snap = await getDocs(query(collection(db, "students"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getStudentsByAgent(agentId) {
  const snap = await getDocs(
    query(collection(db, "students"), where("agentId", "==", agentId))
  );
  const students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return students.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addStudent(data) {
  return addDoc(collection(db, "students"), { ...data, createdAt: serverTimestamp() });
}

export async function updateStudent(id, data) {
  return updateDoc(doc(db, "students", id), data);
}

export async function deleteStudent(id) {
  return deleteDoc(doc(db, "students", id));
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function getSessions() {
  const snap = await getDocs(query(collection(db, "sessions"), orderBy("date", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addSession(data) {
  return addDoc(collection(db, "sessions"), { ...data, createdAt: serverTimestamp() });
}

export async function deleteSession(id) {
  return deleteDoc(doc(db, "sessions", id));
}

// ── Attendance ────────────────────────────────────────────────────────────────

export async function getAttendance(sessionId) {
  const snap = await getDocs(collection(db, "sessions", sessionId, "attendance"));
  const map = {};
  snap.docs.forEach((d) => {
    map[d.id] = d.data().present;
  });
  return map;
}

export async function setAttendance(sessionId, studentId, present) {
  const ref = doc(db, "sessions", sessionId, "attendance", studentId);
  return setDoc(ref, { present });
}

export async function bulkSaveAttendance(sessionId, attendanceMap) {
  const writes = Object.entries(attendanceMap).map(([studentId, present]) =>
    setDoc(doc(db, "sessions", sessionId, "attendance", studentId), { present })
  );
  return Promise.all(writes);
}
