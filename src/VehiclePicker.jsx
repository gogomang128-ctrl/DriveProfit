import { settingsFor } from "./ownerPolicy";
import React, { useState } from "react";
import { vehicles, resolveVehicle } from "./engine";
export default function VehiclePicker({ vehicle, choose, policy }) {
  const [query, setQuery] = useState("");
  const v = resolveVehicle(vehicle);
  const settings = settingsFor(vehicle, policy);
  const norm = (t) =>
    t
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u064B-\u065F]/g, "")
      .trim();
  const matches = vehicles.filter(
    (x) =>
      x.type === v.type &&
      norm([x.name, x.model, x.search || ""].join(" ")).includes(norm(query)),
  );
  return (
    <>
      <div className="vehicleTabs" aria-label="نوع المركبة">
        {[
          ["سيارة", "سيارات"],
          ["موتوسيكل", "موتوسيكلات"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={v.type === key}
            onClick={() => {
              if (v.type !== key) {
                choose(vehicles.find((x) => x.type === key).id);
                setQuery("");
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="field">
        ابحث بالعربية أو الإنجليزية
        <input
          className="textBox"
          type="search"
          autoComplete="off"
          placeholder="مثلاً: صني، Corolla، 2022"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <label className="field">
        المركبة والفئة
        <select value={v.id} onChange={(e) => choose(e.target.value)}>
          {!matches.includes(v) && (
            <option value={v.id}>
              {v.name} {v.model} (الحالية)
            </option>
          )}
          {matches.map((x) => (
            <option value={x.id} key={x.id}>
              {x.name} · {x.model} {x.year ? `· ${x.year} ${x.gear}` : ""}
            </option>
          ))}
        </select>
      </label>
      <small>
        {matches.length
          ? `${matches.length} نتيجة`
          : "لا توجد نتيجة مطابقة؛ لم تتغير مركبتك."}
      </small>
      <p>
        بنزين {settings.grade} · {settings.rate} لتر / 100 كم ·{" "}
        {(100 / settings.rate).toFixed(2)} كم/لتر · تكلفة البنزين{" "}
        {((settings.rate * settings.prices[settings.grade]) / 100).toFixed(2)}{" "}
        ج.م/كم
      </p>
      <small>معدل تقديري منشور لحساب الرحلات، وليس قياساً لحساس الوقود.</small>
      {v.spec && (
        <a href={v.spec.url} target="_blank" rel="noreferrer">
          مرجع مواصفات الفئة ↗
        </a>
      )}
    </>
  );
}
