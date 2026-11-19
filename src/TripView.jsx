import React, { useEffect, useState } from "react";
import { Wallet, Gauge, Route, Fuel } from "lucide-react";
import TripMap from "./Map";
import { distance } from "./engine";
// This preview never enters useTracking, Android services, snapshots or trip history.
const sample = Array.from({ length: 31 }, (_, i) => ({
  lat: 30.0444 + i * 0.00011,
  lng: 31.2357 + i * 0.00007,
}));
export default function TripView({ trip, snapshot, settings, start }) {
  const [step, setStep] = useState(null);
  const demo = step !== null && !trip.active;
  useEffect(() => {
    if (!demo || step === sample.length - 1) return;
    const t = setTimeout(
      () => setStep((i) => (i == null ? null : i + 1)),
      1000,
    );
    return () => clearTimeout(t);
  }, [step, demo]);
  useEffect(() => {
    if (trip.active) setStep(null);
  }, [trip.active]);
  const route = demo ? sample.slice(0, step + 1) : trip.route;
  const t = demo
    ? {
        active: false,
        demo: true,
        route,
        point: sample[step],
        speed:
          step && step < sample.length - 1
            ? distance(sample[step - 1], sample[step]) * 3600
            : 0,
        km: route.reduce(
          (sum, p, i) => sum + (i ? distance(route[i - 1], p) : 0),
          0,
        ),
      }
    : trip;
  const cfg = demo ? settings : snapshot,
    liters = (t.km * cfg.rate) / 100;
  return (
    <>
      <TripMap
        expanded
        trip={t}
        onStart={() => {
          setStep(null);
          start();
        }}
      />
      {!trip.active && (
        <div className="mapProvider">
          <span>
            {demo
              ? "بيانات تدريبية فقط · لا تُحفظ في السجل"
              : "عاين طريقة التتبّع بدون استخدام موقعك"}
          </span>
          <button className="subtle" onClick={() => setStep(demo ? null : 0)}>
            {demo ? "إنهاء المحاكاة" : "تجربة محاكاة"}
          </button>
        </div>
      )}
      <div className="trackStats">
        {[
          [Gauge, "السرعة", t.speed, "كم/س"],
          [Route, "المسافة", t.km, "كم"],
          [Fuel, "الاستهلاك المقدّر", liters, "لتر"],
          [
            Wallet,
            "تكلفة البنزين المقدّرة",
            liters * cfg.prices[cfg.grade],
            "ج.م",
          ],
        ].map(([I, label, value, unit]) => (
          <div className="card" key={label}>
            <I />
            <small>
              {demo ? "محاكاة · " : ""}
              {label}
            </small>
            <b>
              {value.toLocaleString("en-US", { maximumFractionDigits: 2 })}{" "}
              {unit}
            </b>
          </div>
        ))}
      </div>
    </>
  );
}
