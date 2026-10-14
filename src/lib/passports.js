import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
export async function uploadPassport(file) {
  if (!file) return "";
  if (!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Passport must be a JPEG, PNG or WebP image.");
  if (file.size > 5*1024*1024) throw new Error("Passport image must be 5 MB or smaller.");
  const r=ref(storage,"passports/"+crypto.randomUUID());
  await uploadBytes(r,file,{contentType:file.type});
  return getDownloadURL(r);
}