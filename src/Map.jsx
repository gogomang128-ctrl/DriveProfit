import React, { lazy, Suspense, useState } from "react";
const GoogleTripMap = lazy(() => import("./maps/GoogleTripMap"));
const googleEnabled = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
const LiveMap = lazy(() => import("./LiveMap"));
import {
  MapPinned,
  LocateFixed,
  Plus,
  Minus,
  Navigation,
  Radio,
  ArrowUpLeft,
} from "lucide-react";
export default function TripMap({ trip, onOpen, onStart, expanded = false }) {
  const [failed, setFailed] = useState(false);
  const [zoom, Z] = useState(1);
  const live = !!trip.point,
    interactive = live || expanded;
  function change(n) {
    Z((z) => Math.max(1, Math.min(2.6, z + n * 0.25)));
  }
  return (
    <section className="card mapCard">
      <div className="cardTitle">
        <h3>
          <MapPinned />
          خريطة التتبّع
        </h3>
        <span className={"tag " + (trip.active ? "green" : "")}>
          <i className="dot" />
          {trip.active
            ? live
              ? "تتبّع مباشر"
              : "بانتظار GPS"
            : live
              ? "آخر مسار"
              : expanded
                ? "استكشاف الخريطة"
                : "معاينة المسار"}
        </span>
      </div>
      <div className={"mapCanvas " + (expanded ? "expanded" : "")}>
        {interactive && (
          <Suspense fallback={<div className="waiting">جارٍ فتح الخريطة…</div>}>
            {googleEnabled && !failed ? (
              <GoogleTripMap
                point={trip.point}
                route={trip.route}
                onFailure={setFailed}
              />
            ) : (
              <LiveMap point={trip.point} route={trip.route} />
            )}
          </Suspense>
        )}
        {!interactive && !trip.active && (
          <img
            className="atlas"
            src="/map.svg"
            style={{ transform: `scale(${zoom})` }}
            alt="خريطة توضيحية لمسار في القاهرة"
          />
        )}
        {trip.active && !live && (
          <div className="waiting">
            <LocateFixed size={20} />
            بانتظار إشارة موقع دقيقة…
          </div>
        )}
        {!interactive && (
          <div className="mapTools">
            <button aria-label="تكبير الخريطة" onClick={() => change(1)}>
              <Plus />
            </button>
            <button aria-label="تصغير الخريطة" onClick={() => change(-1)}>
              <Minus />
            </button>
            <button aria-label="توسيط الخريطة" onClick={() => Z(1)}>
              <LocateFixed />
            </button>
          </div>
        )}
        {!interactive && !trip.active && (
          <span className="mapCity">
            <Navigation size={12} /> القاهرة، مصر
          </span>
        )}
      </div>
      {expanded && (
        <div className="mapProvider">
          <span>
            {googleEnabled && !failed
              ? "خرائط Google"
              : failed
                ? "تعذّر تحميل Google · خريطة بديلة"
                : "خريطة بديلة · Google غير مفعّلة داخل التطبيق"}
          </span>
          <a
            href={
              "https://www.google.com/maps/search/?api=1&query=" +
              encodeURIComponent(
                trip.point
                  ? `${trip.point.lat},${trip.point.lng}`
                  : "القاهرة، مصر",
              )
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {trip.point
              ? "فتح موقعي في خرائط Google"
              : "فتح القاهرة في خرائط Google"}{" "}
            ↗
          </a>
        </div>
      )}
      <div className="mapfoot">
        <span>
          <Radio size={15} />
          {trip.active ? "جارٍ تتبّع الرحلة" : "التتبّع غير نشط"}
        </span>
        {expanded && !trip.active && (
          <button onClick={onStart}>
            <LocateFixed size={16} />
            تفعيل GPS وبدء التتبّع
          </button>
        )}
        {!expanded && (
          <button onClick={onOpen}>
            عرض الخريطة <ArrowUpLeft size={15} />
          </button>
        )}
      </div>
    </section>
  );
}
