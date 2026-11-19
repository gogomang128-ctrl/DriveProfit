import { fetchPrices } from "./prices";
import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/cairo";
import {
  LayoutDashboard,
  Calculator,
  MapPinned,
  History,
  Motorbike,
  Fuel,
  Bell,
  Settings2,
  Menu,
  X,
  ChevronLeft,
  CalendarDays,
  Play,
  Square,
  Activity,
  Route,
  Wallet,
  Flag,
  Pencil,
  Check,
  CarFront,
  SlidersHorizontal,
  Gauge,
  Droplet,
  Navigation,
  Info,
  ShieldCheck,
  Layers,
  LocateFixed,
  Clock3,
  UserRound,
  PanelRight,
} from "lucide-react";
import Entry, { CaptainAccount, DownloadApp } from "./Entry";
import { readProfile } from "./profile";
import VehiclePicker from "./VehiclePicker";
import { resolveVehicle, initial, calc } from "./engine";
import { native, Driver, useTracking } from "./tracking";
import TripMap from "./Map";
import "./style.css";
const nf = (n, d = 1) =>
    Number(n).toLocaleString("en-US", { maximumFractionDigits: d }),
  money = (n) => Number(n).toFixed(2);
function load(k, v) {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? v;
  } catch {
    return v;
  }
}
const navs = [
  ["dash", "لوحة القيادة", LayoutDashboard],
  ["calc", "حاسبة الرحلة", Calculator],
  ["map", "التتبّع المباشر", MapPinned],
  ["log", "سجل الرحلات", History],
  ["vehicle", "مركبتي", Motorbike],
  ["fuel", "أسعار الوقود", Fuel],
  ["alerts", "التنبيهات", Bell],
  ["settings", "الإعدادات", Settings2],
];
function Modal({ title, close, children }) {
  const box = useRef();
  useEffect(() => {
    const old = document.activeElement;
    box.current?.focus();
    function key(e) {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const els = [
          ...box.current.querySelectorAll(
            "button:not(:disabled),input,select,a[href]",
          ),
        ];
        if (!els.length) return;
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els.at(-1).focus();
        } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
          e.preventDefault();
          els[0].focus();
        }
      }
    }
    window.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      old?.focus();
    };
  }, []);
  return (
    <div
      className="backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className="modal card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex="-1"
        ref={box}
      >
        <div className="cardTitle">
          <h3>{title}</h3>
          <button className="iconBtn" aria-label="إغلاق" onClick={close}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Field({
  label,
  unit,
  value,
  change,
  min = 0,
  max = 100000,
  step = "any",
}) {
  return (
    <label className="field">
      {label}
      <span>
        <input
          type="number"
          required
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => change(e.target.value)}
        />
        <em>{unit}</em>
      </span>
    </label>
  );
}
function CalculatorCard({ s }) {
  const [km, K] = useState("12"),
    [fare, F] = useState("85"),
    [result, R] = useState(null);
  function run(e) {
    e.preventDefault();
    R(calc(+km, +fare, s.rate, s.prices[s.grade], s.wear));
  }
  useEffect(() => R(null), [km, fare, s]);
  return (
    <section className="card calculator">
      <div className="cardTitle">
        <h3>
          <Calculator />
          حاسبة الجدوى السريعة
        </h3>
        <span className="mini-label">CALC / 01</span>
      </div>
      <div className="calcBody">
        <p>اعرف صافي ربحك قبل قبول الرحلة.</p>
        <form onSubmit={run}>
          <div className="fields">
            <Field label="سعر الرحلة" unit="ج.م" value={fare} change={F} />
            <Field
              label="مسافة الرحلة"
              unit="كم"
              value={km}
              change={K}
              min={0.01}
            />
          </div>
          <button className="lime full">
            <Calculator size={16} />
            احسب صافي الربح
          </button>
        </form>
        {result && (
          <div
            role="status"
            className={"result " + (result.net < 0 ? "loss" : "")}
          >
            <b>
              {result.net < 0 ? "تحذير: رحلة خاسرة" : "صافي الربح المتوقع"}:{" "}
              {money(result.net)} ج.م
            </b>
            <small>
              بنزين {money(result.fuel)} ج.م · صيانة{" "}
              {money(result.cost - result.fuel)} ج.م
            </small>
          </div>
        )}
        <div className="calcNote">
          <Info size={14} />
          يشمل تكلفة البنزين ونسبة الصيانة ({s.wear}٪).
        </div>
      </div>
    </section>
  );
}
function FuelCard({ s, edit }) {
  return (
    <section className="card fuel">
      <div className="cardTitle">
        <h3>
          <Fuel />
          أسعار البنزين
        </h3>
        <span className="country">
          <i />
          مصر
        </span>
      </div>
      <div className="fuelRows">
        {[80, 92, 95].map((g, i) => (
          <div
            className={"fuelRow " + (g === s.grade ? "selected" : "")}
            key={g}
          >
            <span className={"oil oil" + i}>
              <Droplet size={15} />
            </span>
            <b>
              بنزين <bdi>{g}</bdi>
            </b>
            {s.grade === g && <span className="activeGrade">مُختار</span>}
            <strong>{money(s.prices[g])}</strong>
            <small>ج.م / لتر</small>
          </div>
        ))}
      </div>
      <div className="fuelFoot">
        <span>
          <Clock3 size={12} />
          {s.updated
            ? "تعديل يدوي"
            : "مرجع: " +
              new Date(
                (s.asOf || "2026-11-17") + "T12:00:00",
              ).toLocaleDateString("ar-EG", {
                day: "numeric",
                month: "long",
                year: "numeric",
                numberingSystem: "latn",
              })}
        </span>
        <button onClick={edit}>
          <Pencil size={12} />
          تعديل
        </button>
      </div>
    </section>
  );
}
function VehicleCard({ s, edit }) {
  let v = resolveVehicle(s.vehicle);
  return (
    <section className="hero">
      <div className="heroGrid" />
      <div className="heroArt">
        {v.type === "موتوسيكل" ? (
          <img src="/motorcycle.webp" alt="صورة توضيحية لموتوسيكل" />
        ) : (
          <CarFront className="bigCar" />
        )}
      </div>
      <div className="heroCopy">
        <span className="tag green">
          <i className="dot" />
          المركبة النشطة
        </span>
        <h2>
          {v.name} <bdi>{v.model}</bdi>
        </h2>
        <p>
          {v.type}
          <span> / </span>
          {v.cc} سي سي<span> / </span>بنزين {s.grade}
        </p>
        <button className="subtle" onClick={edit}>
          <SlidersHorizontal size={14} />
          تغيير المركبة
        </button>
      </div>
      <span className="artCode">
        {v.type === "موتوسيكل" ? "MOTO" : "AUTO"} SERIES <i /> {v.cc}
      </span>
      <div className="heroFoot">
        <span>
          <Fuel />
          الاستهلاك <b>{nf(s.rate, 2)}</b> لتر / 100 كم
        </span>
        <i />
        <span>
          <Route />
          كفاءة الوقود <b>{nf(100 / s.rate, 2)}</b> كم / لتر
        </span>
      </div>
    </section>
  );
}
const charts = [
  "0,30 10,24 21,27 31,19 45,21 54,14 66,18 77,10 86,13 100,2",
  "0,28 10,27 20,20 32,22 41,15 50,19 62,12 75,14 85,8 100,6",
  "0,31 12,30 21,24 32,24 40,18 51,19 60,13 69,14 78,8 87,11 100,3",
  "0,28 10,28 19,18 28,18 39,23 49,14 59,15 70,8 79,11 90,7 100,7",
];
function Stats({ list, range, setRange }) {
  let demo = !list.length;
  const rows = list.filter(
    (x) =>
      Date.now() - x.at < (range === "اليوم" ? 1 : 7) * 86400000 &&
      (range !== "اليوم" ||
        new Date(x.at).toDateString() === new Date().toDateString()),
  );
  let vals = demo
    ? range === "اليوم"
      ? [342.5, 12, 86.4, 2.59]
      : [1964, 71, 507.2, 15.22]
    : [
        rows.reduce((a, x) => a + x.net, 0),
        rows.length,
        rows.reduce((a, x) => a + x.km, 0),
        rows.reduce((a, x) => a + x.liters, 0),
      ];
  return (
    <>
      <div className="sectionBar">
        <h3>
          <span className="slash">//</span>ملخّص الأداء
        </h3>
        <div className="range">
          {demo && <small>بيانات توضيحية</small>}
          <select
            aria-label="فترة ملخّص الأداء"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option>اليوم</option>
            <option>آخر 7 أيام</option>
          </select>
        </div>
      </div>
      <div className="stats">
        {[
          [Wallet, "صافي الربح", "ج.م", "#b6e858"],
          [Flag, "عدد الرحلات", "رحلة", "#80b6ff"],
          [Route, "المسافة المقطوعة", "كم", "#b698f5"],
          [Fuel, "الوقود المستهلك", "لتر", "#f1ae66"],
        ].map(([Icon, title, unit, color], i) => (
          <div key={title} className="stat card" style={{ "--accent": color }}>
            <div className="statTitle">
              <span>
                <Icon size={16} />
              </span>
              {title}
            </div>
            <div className="statValue">
              <bdi>{nf(vals[i], 2)}</bdi>
              <small>{unit}</small>
            </div>
            {demo && (
              <svg viewBox="0 0 100 40" className="spark" aria-hidden="true">
                <defs>
                  <linearGradient id={"g" + i} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity=".2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`${charts[i]} 100,40 0,40`}
                  fill={`url(#g${i})`}
                />
                <polyline
                  points={charts[i]}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
function App({ profile, changeProfile, showEntry }) {
  const [page, P] = useState("dash"),
    [modal, M] = useState(""),
    [mobile, U] = useState(false),
    [s, S] = useState(() => load("dp.settings", initial)),
    [draft, D] = useState(s),
    [list, H] = useState(() => load("dp.history", [])),
    [range, G] = useState("اليوم"),
    [fare, F] = useState(""),
    [msg, N] = useState(""),
    [alerts, A] = useState([]);
  const tracking = useTracking(),
    { trip } = tracking;
  const [nativeNote, NN] = useState("");
  const snap = useRef(load("dp.snapshot", s));
  const notices = useRef({});
  const close = () => M("");
  useEffect(() => {
    let alive = true;
    fetchPrices(s.asOf)
      .then((feed) => {
        if (alive)
          S((old) =>
            old.updated
              ? old
              : {
                  ...old,
                  prices: feed.prices,
                  asOf: feed.asOf,
                  source: feed.source,
                },
          );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  function note(t) {
    N(t);
  }
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => N(""), 3500);
    return () => clearTimeout(t);
  }, [msg]);
  function goto(key) {
    U(false);
    if (["vehicle", "fuel", "settings", "alerts"].includes(key)) {
      D(JSON.parse(JSON.stringify(s)));
      NN("");
      M(key);
    } else {
      P(key);
      window.scrollTo(0, 0);
    }
  }
  useEffect(() => {
    localStorage.setItem("dp.settings", JSON.stringify(s));
    if (native)
      Driver.configure({ settings: s }).catch(() =>
        note("تعذّر تحديث إعدادات الفقاعة"),
      );
  }, [s]);
  useEffect(() => {
    localStorage.setItem("dp.history", JSON.stringify(list));
  }, [list]);
  useEffect(() => {
    if (!trip.active) return;
    const notify = (k, text) => {
      if (Date.now() - (notices.current[k] || 0) < 60000) return;
      notices.current[k] = Date.now();
      A((a) => [text, ...a].slice(0, 20));
      note(text);
      if (!native && s.sound && window.speechSynthesis) {
        let u = new SpeechSynthesisUtterance(text);
        u.lang = "ar-EG";
        speechSynthesis.speak(u);
      }
    };
    if (trip.speed > snap.current.speed)
      notify("speed", "السرعة أعلى من الحد المحدد. خفّف سرعتك.");
    if (snap.current.tank - (trip.km * snap.current.rate) / 100 < 1)
      notify("fuel", "البنزين المتبقي أقل من لتر واحد.");
  }, [trip, s]);
  useEffect(() => {
    if (!mobile) return;
    function key(e) {
      if (e.key === "Escape") U(false);
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [mobile]);
  function save(e) {
    e.preventDefault();
    let d = {
      ...draft,
      rate: +draft.rate,
      wear: +draft.wear,
      tank: +draft.tank,
      speed: +draft.speed,
      prices: Object.fromEntries(
        Object.entries(draft.prices).map(([k, v]) => [k, +v]),
      ),
    };
    if (
      modal === "fuel" &&
      JSON.stringify(d.prices) !== JSON.stringify(s.prices)
    )
      d.updated = Date.now();
    S(d);
    close();
    note("تم حفظ التعديلات");
  }
  async function begin() {
    snap.current = JSON.parse(JSON.stringify(s));
    localStorage.setItem("dp.snapshot", JSON.stringify(s));
    if (await tracking.start(s)) {
      close();
      note("بدأ تتبّع الرحلة");
    }
  }
  async function end(e) {
    e.preventDefault();
    try {
      const t = await tracking.stop();
      const cfg = snap.current,
        r = calc(t.km, +fare, cfg.rate, cfg.prices[cfg.grade], cfg.wear);
      H((h) => [{ ...r, km: t.km, fare: +fare, at: Date.now() }, ...h]);
      F("");
      close();
      note("تم حفظ الرحلة في السجل");
    } catch {
      note("تعذّر إنهاء الرحلة. أعد المحاولة.");
    }
  }
  const openTrip = () => M(trip.active ? "end" : "start");
  const title = navs.find((n) => n[0] === page)?.[1] || "";
  const date = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    numberingSystem: "latn",
  }).format(new Date());
  let sidebarGroup = (start, end) =>
    navs.slice(start, end).map(([key, label, Icon]) => (
      <button
        key={key}
        onClick={() => goto(key)}
        className={"navItem " + (page === key ? "sel" : "")}
      >
        <Icon size={18} />
        {label}
        {key === "map" && (
          <i className={"statusDot " + (trip.active ? "on" : "")} />
        )}
      </button>
    ));
  return (
    <div className="shell">
      {mobile && <div className="shade" onClick={() => U(false)} />}
      <aside className={mobile ? "open" : ""}>
        <div className="brand">
          <img src="/logo.webp" alt="شعار DriveProfit" />
          <div>
            <strong dir="ltr">
              Drive<span>Profit</span>
            </strong>
            <small>مساعد الكابتن الذكي</small>
          </div>
        </div>
        <nav>
          <label>مساحة العمل</label>
          {sidebarGroup(0, 4)}
          <hr />
          <label>إدارة المركبة</label>
          {sidebarGroup(4, 8)}
        </nav>
        <div className="sideBottom">
          <DownloadApp />
          <div className="system">
            <i className="dot" />
            النظام جاهز <Activity size={15} />
          </div>
          <div className="profile">
            <span className="avatar">
              <UserRound />
            </span>
            <div>
              <b>{profile?.name || "حساب الكابتن"}</b>
              <small>
                {profile
                  ? profile.synced
                    ? "ملف الكابتن"
                    : "بانتظار المزامنة"
                  : "متابعة كضيف"}
              </small>
            </div>
            <button
              aria-label="فتح ملف الكابتن"
              onClick={() => {
                if (profile) M("profile");
                else if (trip.active) note("أنه الرحلة قبل التسجيل");
                else showEntry();
              }}
            >
              <Settings2 size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header>
          <div className="crumb">
            <button
              aria-label="فتح القائمة"
              className="mobileToggle"
              onClick={() => U(true)}
            >
              <Menu />
            </button>
            <PanelRight className="desktopIcon" size={16} />
            <span>مساحة العمل</span>
            <ChevronLeft size={13} />
            <b>{title}</b>
          </div>
          <div className="headerLeft">
            <span>
              <CalendarDays size={14} />
              {date}
            </span>
            <i />
            <button
              className="alertBtn"
              aria-label="عرض التنبيهات"
              onClick={() => goto("alerts")}
            >
              <Bell size={17} />
              {alerts.length > 0 && <i />}
            </button>
          </div>
        </header>
        <main>
          <div className="intro">
            <div>
              <div className="overline">
                <i />
                DRIVER WORKSPACE
              </div>
              <h1>{title}</h1>
              <p>
                {
                  {
                    dash: "نظرة شاملة على مركبتك، رحلاتك وأرباحك في مكان واحد.",
                    calc: "احسب تكلفة كل عرض قبل قبول الرحلة.",
                    map: "تابع مسارك وسرعتك واستهلاك الوقود أثناء القيادة.",
                    log: "راجع تفاصيل الرحلات المحفوظة على هذا الجهاز.",
                  }[page]
                }
              </p>
            </div>
            <button className="lime start" onClick={openTrip}>
              {trip.active ? (
                <Square size={15} />
              ) : (
                <Play size={15} fill="currentColor" />
              )}
              {trip.active ? "إنهاء الرحلة" : "بدء رحلة جديدة"}
            </button>
          </div>
          {page === "dash" ? (
            <>
              <div className="topGrid">
                <VehicleCard s={s} edit={() => goto("vehicle")} />
                <FuelCard s={s} edit={() => goto("fuel")} />
              </div>
              <Stats list={list} range={range} setRange={G} />
              <div className="sectionBar toolsTitle">
                <h3>
                  <span className="slash">//</span>أدوات القيادة
                </h3>
                <span className="mini-label">DRIVER TOOLS</span>
              </div>
              <div className="toolsGrid">
                <TripMap trip={trip} onOpen={() => goto("map")} />
                <CalculatorCard s={s} />
              </div>
            </>
          ) : page === "calc" ? (
            <div className="topGrid">
              <CalculatorCard s={s} />
              <FuelCard s={s} edit={() => goto("fuel")} />
            </div>
          ) : page === "map" ? (
            <>
              <TripMap expanded trip={trip} />
              <div className="trackStats">
                {[
                  [Gauge, "السرعة", nf(trip.speed), "كم/س"],
                  [Route, "المسافة", nf(trip.km, 2), "كم"],
                  [
                    Fuel,
                    "الاستهلاك المقدّر",
                    nf((trip.km * snap.current.rate) / 100, 2),
                    "لتر",
                  ],
                ].map(([I, t, v, u]) => (
                  <div className="card" key={t}>
                    <I />
                    <small>{t}</small>
                    <b>
                      {v} {u}
                    </b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <section className="card history">
              <div className="cardTitle">
                <h3>
                  <History />
                  الرحلات المحفوظة
                </h3>
                <span className="tag">{list.length} رحلة</span>
              </div>
              {!list.length ? (
                <div className="empty">
                  <Route />
                  <h3>لم تسجّل أي رحلة بعد</h3>
                  <p>ابدأ التتبّع، ثم أنهِ الرحلة لإضافة أرباحها إلى السجل.</p>
                  <button className="subtle" onClick={openTrip}>
                    {trip.active ? "إنهاء الرحلة" : "ابدأ رحلتك الأولى"}
                  </button>
                </div>
              ) : (
                <div className="tableWrap">
                  <table>
                    <thead>
                      <tr>
                        {[
                          "التاريخ",
                          "المسافة",
                          "الأجرة",
                          "التكاليف",
                          "صافي الربح",
                        ].map((x) => (
                          <th key={x}>{x}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((x, i) => (
                        <tr key={i}>
                          <td>{new Date(x.at).toLocaleString("ar-EG")}</td>
                          <td>{nf(x.km)} كم</td>
                          <td>{money(x.fare)}</td>
                          <td>{money(x.cost)}</td>
                          <td>{money(x.net)} ج.م</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {tracking.error && (
            <p className="warn" role="alert">
              {tracking.error}
            </p>
          )}
        </main>
      </div>
      {modal && (
        <Modal
          title={
            navs.find((n) => n[0] === modal)?.[1] ||
            {
              profile: "ملف الكابتن",
              start: "بدء رحلة جديدة",
              end: "إنهاء وحفظ الرحلة",
            }[modal]
          }
          close={close}
        >
          {modal === "profile" && profile ? (
            <CaptainAccount
              profile={profile}
              change={changeProfile}
              close={close}
            />
          ) : ["vehicle", "fuel", "settings"].includes(modal) ? (
            <form className="formBody" onSubmit={save}>
              {modal === "vehicle" ? (
                <>
                  <p>اختر مركبتك وعدّل الاستهلاك حسب تجربتك الفعلية.</p>
                  <VehiclePicker draft={draft} D={D} />
                  <Field
                    label="معدل الاستهلاك التقديري"
                    unit="لتر / 100 كم"
                    min={0.1}
                    max={100}
                    value={draft.rate}
                    change={(v) => D({ ...draft, rate: v })}
                  />
                  <label className="field">
                    نوع البنزين
                    <select
                      value={draft.grade}
                      onChange={(e) => D({ ...draft, grade: +e.target.value })}
                    >
                      {[80, 92, 95].map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : modal === "fuel" ? (
                <>
                  <p>
                    أسعار مرجعية بتاريخ <bdi>{draft.asOf || "2026-11-17"}</bdi>،
                    وليست تغذية لحظية. عدّلها لتطابق سعر المحطة.
                  </p>
                  {[80, 92, 95].map((g) => (
                    <Field
                      key={g}
                      label={"بنزين " + g}
                      unit="ج.م / لتر"
                      min={0.01}
                      value={draft.prices[g]}
                      change={(v) =>
                        D({ ...draft, prices: { ...draft.prices, [g]: v } })
                      }
                    />
                  ))}
                  <a
                    href={draft.source || "https://khalfelhadth.com/159806"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    مصدر الأسعار المرجعية ↗
                  </a>
                  <button
                    type="button"
                    className="subtle"
                    onClick={async () => {
                      try {
                        const feed = await fetchPrices(s.asOf);
                        S((old) => ({
                          ...old,
                          prices: feed.prices,
                          updated: null,
                          source: feed.source,
                          asOf: feed.asOf,
                        }));
                        close();
                        note("تمت استعادة أحدث أسعار المرجع المتاحة");
                      } catch {
                        note("تعذّر تحديث الأسعار. تم الاحتفاظ بالقيم الحالية.");
                      }
                    }}
                  >
                    استعادة الأسعار المرجعية
                  </button>
                </>
              ) : (
                <>
                  <Field
                    label="حد السرعة للتنبيه"
                    unit="كم / س"
                    min={5}
                    max={200}
                    value={draft.speed}
                    change={(v) => D({ ...draft, speed: v })}
                  />
                  <Field
                    label="احتياطي الصيانة من أجرة الرحلة"
                    unit="٪"
                    max={100}
                    value={draft.wear}
                    change={(v) => D({ ...draft, wear: v })}
                  />
                  <Field
                    label="البنزين المتاح عند بدء الرحلة"
                    unit="لتر"
                    min={0.1}
                    max={150}
                    value={draft.tank}
                    change={(v) => D({ ...draft, tank: v })}
                  />
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={draft.sound}
                      onChange={(e) => D({ ...draft, sound: e.target.checked })}
                    />
                    تنبيه صوتي أثناء التتبّع
                  </label>
                  <div className="perm">
                    <h4>
                      <Layers size={16} />
                      المساعد العائم لإندرايف
                    </h4>
                    <p>
                      {native
                        ? "بعد تفعيل الخدمة، تُقرأ نصوص عروض إندرايف محلياً لحساب الربح فقط. لا تُحفظ نصوص الشاشة ولا يتم قبول العروض تلقائياً. يمكنك إلغاء الصلاحية من إعدادات الجهاز."
                        : "الفقاعة وقراءة شاشة إندرايف متاحتان في نسخة أندرويد فقط. في المتصفح استخدم حاسبة الرحلة يدوياً."}
                    </p>
                    {native && (
                      <button
                        type="button"
                        className="subtle"
                        onClick={() =>
                          Driver.accessibility().catch(() =>
                            NN("تعذّر فتح إعدادات الجهاز"),
                          )
                        }
                      >
                        فتح إعدادات إمكانية الوصول
                      </button>
                    )}
                    {nativeNote}
                  </div>
                </>
              )}
              <button className="lime full">
                <Check size={16} />
                حفظ التغييرات
              </button>
            </form>
          ) : modal === "alerts" ? (
            <div className="formBody">
              <div className="notice">
                <ShieldCheck />
                <div>
                  <b>تنبيهات القيادة</b>
                  <p>حد السرعة {s.speed} كم/س · تنبيه الوقود عند أقل من لتر.</p>
                </div>
              </div>
              {alerts.length ? (
                alerts.map((a, i) => (
                  <p className="warn" key={i}>
                    {a}
                  </p>
                ))
              ) : (
                <p>لا توجد تنبيهات مسجّلة خلال هذه الجلسة.</p>
              )}
              <button className="subtle" onClick={() => goto("settings")}>
                ضبط التنبيهات <SlidersHorizontal size={15} />
              </button>
            </div>
          ) : modal === "start" ? (
            <div className="formBody">
              <div className="notice">
                <LocateFixed />
                <div>
                  <b>تتبّع الرحلة باستخدام GPS</b>
                  <p>
                    {native
                      ? "يستمر التتبّع في الخلفية بإشعار ظاهر حتى إنهاء الرحلة."
                      : "اترك الصفحة مفتوحة أثناء الرحلة. التتبّع في الخلفية يحتاج نسخة أندرويد."}
                  </p>
                </div>
              </div>
              <p>
                يُستخدم موقعك لحساب المسافة والسرعة. عند عرض الخريطة الحية تُطلب
                بلاطات المنطقة من OpenStreetMap. لا يتم حفظ مسار الرحلة في
                السجل.
              </p>
              {tracking.error && <p className="warn">{tracking.error}</p>}
              <button
                className="lime full"
                disabled={tracking.pending}
                onClick={begin}
              >
                <Navigation size={16} />
                {tracking.pending
                  ? "جارٍ تحديد الموقع…"
                  : "السماح بالموقع وبدء التتبّع"}
              </button>
            </div>
          ) : (
            <form className="formBody" onSubmit={end}>
              <p>
                المسافة المقطوعة: {nf(trip.km, 2)} كم. أدخل الأجرة الفعلية لحفظ
                صافي الربح.
              </p>
              <Field label="أجرة الرحلة" unit="ج.م" value={fare} change={F} />
              <button className="lime full">إنهاء وحفظ الرحلة</button>
            </form>
          )}
        </Modal>
      )}
      {msg && (
        <div className="toast" role="status">
          <Info size={16} />
          {msg}
        </div>
      )}
    </div>
  );
}
function Root() {
  const [profile, setProfile] = useState(readProfile);
  const [inside, open] = useState(
    () => !!readProfile() || sessionStorage.getItem("dp.guest") === "1",
  );
  function enter(p) {
    setProfile(p);
    if (!p) sessionStorage.setItem("dp.guest", "1");
    else sessionStorage.removeItem("dp.guest");
    open(true);
  }
  return inside ? (
    <App
      profile={profile}
      changeProfile={(p) => {
        setProfile(p);
        if (!p) sessionStorage.setItem("dp.guest", "1");
      }}
      showEntry={() => {
        sessionStorage.removeItem("dp.guest");
        open(false);
      }}
    />
  ) : (
    <Entry enter={enter} />
  );
}
createRoot(document.getElementById("root")).render(<Root />);
