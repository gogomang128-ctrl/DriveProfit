import React, { useState } from "react";
import { vehicles, resolveVehicle } from "./engine";
export default function VehiclePicker({ draft, D }) {
  const [query, setQuery] = useState(""),
    [km, K] = useState(""),
    [liters, F] = useState("");
  const calibrated = (100 * Number(liters)) / Number(km);
  const v = resolveVehicle(draft.vehicle);
  const norm = (t) =>
    t
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u064B-\u065F]/g, "")
      .trim();
  const matches = vehicles.filter((x) =>
    norm([x.name, x.model, x.search || ""].join(" ")).includes(norm(query)),
  );
  return (
    <>
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
        <select
          value={v.id}
          onChange={(e) => {
            const x = resolveVehicle(e.target.value);
            D({
              ...draft,
              vehicle: x.id,
              grade: x.grade,
              rate: x.rate,
              mode: "mixed",
            });
          }}
        >
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
      {v.city && (
        <>
          <div className="consumptionModes">
            {[
              ["city", "زحام", v.city],
              ["highway", "سفر", v.highway],
              ["mixed", "مختلط", v.rate],
            ].map(([key, title, rate]) => (
              <button
                type="button"
                key={key}
                className={+draft.rate === rate ? "picked" : ""}
                onClick={() => D({ ...draft, rate, mode: key })}
              >
                {title}
                <b>{rate.toFixed(2)}</b>
              </button>
            ))}
          </div>
          <small>
            لتر / 100 كم · المختلط 60٪ من المسافة داخل المدينة. خزان هذه النسخة{" "}
            {v.tank} لتر؛ لا يعني أنه ممتلئ. طابق الأوكتان مع كتيّب سيارتك.
          </small>
        </>
      )}
      <details className="calibrate">
        <summary>معايرة الاستهلاك من تفويلتين</summary>
        <p>
          فوّل حتى نفس المستوى مرتين. أدخل المسافة بين التفويلتين واللترات
          المضافة في الثانية؛ لا تستخدم سعة الخزان الكلية.
        </p>
        <div className="fields">
          <label className="field">
            المسافة (كم)
            <input
              className="textBox"
              inputMode="decimal"
              type="number"
              min="0.1"
              step="any"
              value={km}
              onChange={(e) => K(e.target.value)}
            />
          </label>
          <label className="field">
            اللترات المضافة
            <input
              className="textBox"
              inputMode="decimal"
              type="number"
              min="0.01"
              step="any"
              value={liters}
              onChange={(e) => F(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="subtle"
          disabled={
            !(
              Number(km) > 0 &&
              Number(liters) > 0 &&
              calibrated >= 0.1 &&
              calibrated <= 100
            )
          }
          onClick={() =>
            D({ ...draft, rate: +calibrated.toFixed(3), mode: "measured" })
          }
        >
          استخدام القياس{" "}
          {Number.isFinite(calibrated) && calibrated > 0
            ? calibrated.toFixed(2) + " لتر / 100 كم"
            : ""}
        </button>
      </details>
    </>
  );
}
