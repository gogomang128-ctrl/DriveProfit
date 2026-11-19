import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Download,
  LockKeyhole,
  Radio,
  Route,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import {
  createProfile,
  persistProfile,
  readProfile,
  profileRPC,
} from "./profile";
import { native } from "./tracking";
export function DownloadApp() {
  const [release, R] = useState(null);
  useEffect(() => {
    if (native) return;
    let active = true;
    fetch("/data/android-release.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => {
        if (
          active &&
          v?.verified === true &&
          v.url.startsWith(
            "https://github.com/gogomang128-ctrl/DriveProfit/releases/download/",
          )
        )
          R(v);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  if (native) return null;
  return release ? (
    <a href={release.url} className="apkLink" rel="noreferrer">
      <Download size={17} />
      <span>
        تنزيل التطبيق APK{" "}
        <small>
          {release.version} · {release.size_mb} MB · تجريبي
        </small>
      </span>
    </a>
  ) : (
    <span className="apkWaiting">
      <Smartphone size={15} />
      نسخة أندرويد قيد التحقق
    </span>
  );
}
export function CaptainAccount({ profile, change, close }) {
  const [busy, B] = useState(false),
    [error, E] = useState(""),
    [confirm, C] = useState(false);
  async function act(erase) {
    B(true);
    E("");
    try {
      await profileRPC(profile, erase);
      const next = erase ? null : { ...profile, synced: true };
      persistProfile(next);
      change(next);
      if (erase) close();
    } catch {
      E(
        "لم يؤكّد الخادم العملية. بياناتك المحلية لم تتغير؛ أعد المحاولة باتصال مستقر.",
      );
    } finally {
      B(false);
    }
  }
  return (
    <div className="formBody">
      <div className="notice">
        <UserRound />
        <div>
          <b>{profile.name}</b>
          <p dir="ltr">{profile.phone}</p>
        </div>
      </div>
      <p>
        {profile.synced
          ? "تم حفظ ملفك على الخادم وهذا الجهاز."
          : "محفوظ على الجهاز فقط. اضغط للمزامنة مع الخادم."}{" "}
        لا يثبت هذا التسجيل ملكية الرقم، ولا تُرسل بيانات الرحلات أو الموقع إلى
        خادم التسجيل.
      </p>
      {!profile.synced && (
        <button className="lime" disabled={busy} onClick={() => act(false)}>
          مزامنة ملفي
        </button>
      )}
      {confirm ? (
        <>
          <p className="warn">
            حذف الاسم والرقم من الخادم وهذا الجهاز؟ لا يؤثر ذلك على سجل الرحلات
            المحلي.
          </p>
          <button className="subtle" disabled={busy} onClick={() => act(true)}>
            نعم، احذف ملفي
          </button>
          <button disabled={busy} onClick={() => C(false)}>
            إلغاء
          </button>
        </>
      ) : (
        <button className="subtle" disabled={busy} onClick={() => C(true)}>
          حذف ملف التسجيل
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
export default function Entry({ enter }) {
  const [name, N] = useState(""),
    [phone, P] = useState(""),
    [busy, B] = useState(false),
    [error, E] = useState(""),
    [consent, C] = useState(false);
  async function join(e) {
    e.preventDefault();
    if (!consent || busy) return;
    B(true);
    E("");
    try {
      let p = createProfile(name, phone);
      persistProfile(p);
      try {
        await profileRPC(p);
        p = { ...p, synced: true };
        persistProfile(p);
      } catch {
        /* Local copy explicitly remains pending, never claim server success. */
      }
      enter(p);
    } catch (e) {
      E(e.message || "تعذّر حفظ البيانات على هذا الجهاز.");
    } finally {
      B(false);
    }
  }
  return (
    <div className="accessPage" dir="rtl">
      <header className="accessNav">
        <div className="entryBrand">
          <img src="/logo.webp" alt="" />
          <strong dir="ltr">
            Drive<span>Profit</span>
          </strong>
        </div>
        <span className="tag green">
          <i className="dot" /> بوابة الكابتن
        </span>
      </header>
      <main className="entryMain">
        <div className="sectionBar">
          <span className="overline">
            <i />
            DRIVER ACCESS
          </span>
          <span className="mini-label">EGYPT / EG</span>
        </div>
        <div className="entryGrid">
          <section className="entryHero">
            <div className="introFilm">
              <picture>
                <source
                  media="(prefers-reduced-motion: reduce)"
                  srcSet="/logo.webp"
                />
                <img
                  src="/intro.webp"
                  alt="شعار مساعد الكابتن المتحرك"
                  width="448"
                  height="252"
                />
              </picture>
              <span className="filmId">DP — 01</span>
            </div>
            <div className="heroPitch">
              <span className="overline">
                <i />
                مساعد السائق الذكي
              </span>
              <h1>
                كل مشوار <em>محسوب.</em>
              </h1>
              <p>
                اعرف تكلفة البنزين وصافي ربحك قبل ما تقبل الرحلة، وتابع مشوارك
                في مكان واحد.
              </p>
              <div className="heroChips">
                <span>
                  <Route size={14} /> تتبّع المسار
                </span>
                <span>
                  <Check size={14} /> حساب الربح
                </span>
              </div>
              <DownloadApp />
            </div>
          </section>
          <form className="joinForm" onSubmit={join}>
            <span className="joinIcon">
              <UserRound size={24} />
            </span>
            <h2>أهلًا بيك يا كابتن</h2>
            <p>أنشئ ملفك مرة واحدة للدخول السريع من هذا الجهاز.</p>
            <label className="field">
              اسم الكابتن
              <input
                className="textBox"
                autoComplete="name"
                placeholder="اكتب اسمك"
                minLength="2"
                maxLength="64"
                required
                value={name}
                onChange={(e) => N(e.target.value)}
              />
            </label>
            <label className="field">
              رقم الموبايل
              <input
                className="textBox"
                type="tel"
                dir="ltr"
                autoComplete="tel"
                placeholder="01X XXXX XXXX"
                maxLength="22"
                required
                value={phone}
                onChange={(e) => P(e.target.value)}
              />
            </label>
            <label className="joinConsent">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => C(e.target.checked)}
              />
              أوافق على حفظ اسمي ورقمي على هذا الجهاز وخادم DriveProfit. يمكنني
              حذفهما من ملف الكابتن.
            </label>
            {error && (
              <p className="warn" role="alert">
                {error}
              </p>
            )}
            <button className="lime full" disabled={busy}>
              {busy ? "جارٍ حفظ ملفك…" : "تسجيل ودخول"}
              <ArrowLeft size={16} />
            </button>
            <button
              className="guest"
              type="button"
              disabled={busy}
              onClick={() => enter(null)}
            >
              استكشف كضيف
            </button>
          </form>
        </div>
        <div className="entryFoot">
          <span>
            <ShieldCheck size={15} /> بيانات الرحلات تبقى على جهازك
          </span>
          <span className="mini-label">DRIVEPROFIT · CAPTAIN EDITION</span>
        </div>
      </main>
    </div>
  );
}
