import { Capacitor, registerPlugin } from "@capacitor/core";
import { useEffect, useState, useRef } from "react";
import { distance } from "./engine";
export const native = Capacitor.getPlatform() === "android",
  Driver = registerPlugin("Driver");
const blank = { km: 0, speed: 0, point: null, route: [], active: false };
export function useTracking() {
  const [trip, set] = useState(blank),
    [error, err] = useState(""),
    [gpsDisabled, setGpsDisabled] = useState(false),
    [pending, wait] = useState(false);
  const watch = useRef(null),
    ref = useRef(blank);
  function update(t) {
    ref.current = t;
    set(t);
  }
  useEffect(() => {
    let alive = true;
    async function poll() {
      try {
        let t = await Driver.status();
        if (alive && t.active) update({ ...blank, ...t });
        else if (alive && ref.current.active)
          update({ ...ref.current, active: false, speed: 0 });
      } catch {
        if (alive) err("تعذّر الاتصال بخدمة التتبّع");
      }
    }
    if (native) poll();
    const timer = native ? setInterval(poll, 1500) : null;
    return () => {
      alive = false;
      clearInterval(timer);
      if (watch.current != null)
        navigator.geolocation.clearWatch(watch.current);
    };
  }, []);
  async function start(settings) {
    err("");
    wait(true);
    setGpsDisabled(false);
    try {
      if (native) {
        await Driver.start({ settings });
        update({ ...blank, active: true });
        return true;
      }
      if (!window.isSecureContext || !navigator.geolocation)
        throw Error("unsupported");
      const opts = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
      const fix = await new Promise((ok, no) =>
        navigator.geolocation.getCurrentPosition(ok, no, opts),
      );
      let last = null;
      update({ ...blank, active: true });
      function sample(pos) {
        let { latitude: lat, longitude: lng, accuracy, speed } = pos.coords;
        let point = { lat, lng, time: pos.timestamp };
        if (accuracy > 65) return;
        const d = last ? distance(last, point) : 0,
          dt = last ? (point.time - last.time) / 1000 : 0;
        if (last && (dt <= 0 || (d / dt) * 3600 > 220)) return;
        let step = d > Math.max(0.009, accuracy * 0.0005) ? d : 0;
        err("");
        let t = ref.current;
        update({
          ...t,
          km: t.km + step,
          speed: Math.max(
            0,
            speed != null ? speed * 3.6 : dt ? (step / dt) * 3600 : 0,
          ),
          point,
          route: [...t.route.slice(-799), point],
        });
        if (!last || step) last = point;
      }
      sample(fix);
      watch.current = navigator.geolocation.watchPosition(
        sample,
        () => err("انقطع تحديث الموقع. تحقّق من إشارة GPS."),
        opts,
      );
      return true;
    } catch (e) {
      setGpsDisabled(e?.message === "GPS disabled");
      err(
        e?.message === "unsupported"
          ? "الموقع غير متاح هنا. افتح التطبيق عبر HTTPS في متصفح مستقل أو استخدم نسخة أندرويد."
          : e?.code === 1 || e?.message === "Precise location required"
            ? "لم يُسمح بالموقع. فعّل إذن الموقع الدقيق من إعدادات التطبيق أو الموقع، ثم أعد المحاولة."
            : e?.code === 3
              ? "انتهت مهلة تحديد الموقع. انتقل إلى مكان مكشوف وأعد المحاولة."
              : e?.code === 2 || e?.message === "GPS disabled"
                ? "تعذّر تحديد الموقع. شغّل خدمة الموقع GPS في الجهاز ثم أعد المحاولة."
                : "تعذّر بدء التتبّع. فعّل GPS واسمح بالموقع الدقيق، وبإشعار الرحلة على أندرويد، ثم أعد المحاولة.",
      );
      return false;
    } finally {
      wait(false);
    }
  }
  async function stop() {
    if (native) {
      const final = await Driver.stop();
      update({ ...ref.current, ...final });
    } else if (watch.current != null) {
      navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
    }
    update({ ...ref.current, active: false, speed: 0 });
    return ref.current;
  }
  return { trip, start, stop, error, pending, gpsDisabled };
}
