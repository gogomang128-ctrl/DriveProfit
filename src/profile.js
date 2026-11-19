// This is a PUBLISHABLE client key, never a service-role or database credential.
const origin = "https://dwxsofojrfmbmmqluesq.supabase.co",
  key = "sb_publishable_vCTG6it5a3c4JO6eexXVMg_gsAHcr3-";
export function normalizePhone(input) {
  let n = input
    .trim()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
    .replace(/[\s()-]/g, "")
    .replace(/^0020/, "+20")
    .replace(/^0(?=1)/, "+20");
  return /^\+201[0125]\d{8}$/.test(n) ? n : null;
}
export function createProfile(name, phone) {
  name = name.trim();
  phone = normalizePhone(phone);
  if (
    name.length < 2 ||
    name.length > 64 ||
    /[\u0000-\u001f]/.test(name) ||
    !phone
  )
    throw Error("أدخل الاسم ورقم موبايل مصري صحيح.");
  const device = Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
  return { name, phone, device, synced: false, consent: 1 };
}
const store = "dp.profile.v1";
export function readProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(store));
    return p?.consent === 1 &&
      typeof p.name === "string" &&
      p.name.trim().length >= 2 &&
      typeof p.phone === "string" &&
      normalizePhone(p.phone) &&
      /^[0-9a-f]{64}$/.test(p.device)
      ? p
      : null;
  } catch {
    return null;
  }
}
export function persistProfile(p) {
  if (p) localStorage.setItem(store, JSON.stringify(p));
  else localStorage.removeItem(store);
}
// Serialize mutations from this tab: an in-flight retry must finish before an erase.
let tail = Promise.resolve();
export function profileRPC(p, erase = false) {
  const operation = tail.then(() => request(p, erase));
  tail = operation.catch(() => {});
  return operation;
}
async function request(p, erase) {
  const ac = new AbortController(),
    timer = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch(
      `${origin}/rest/v1/rpc/${erase ? "erase_driver" : "register_driver"}`,
      {
        method: "POST",
        headers: { apikey: key, "Content-Type": "application/json" },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: ac.signal,
        body: JSON.stringify(
          erase
            ? { p_device: p.device }
            : {
                p_device: p.device,
                p_name: p.name,
                p_phone: p.phone,
                p_consent: p.consent,
              },
        ),
      },
    );
    if (!res.ok || (await res.json()) !== true)
      throw Error("تعذّر الاتصال بخادم التسجيل.");
    return true;
  } finally {
    clearTimeout(timer);
  }
}
