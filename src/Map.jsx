import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPinned,
  LocateFixed,
  Plus,
  Minus,
  Navigation,
  Radio,
  ArrowUpLeft,
} from "lucide-react";
export default function TripMap({ trip, onOpen, expanded = false }) {
  const root = useRef(),
    map = useRef(),
    marker = useRef(),
    line = useRef();
  const [zoom, Z] = useState(1);
  const live = !!trip.point;
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!live) return;
    const m = L.map(root.current, {
      zoomControl: false,
      scrollWheelZoom: false,
    }).setView([trip.point.lat, trip.point.lng], 15);
    map.current = m;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    ).addTo(m);
    tiles
      .on("tileerror", () => setTileError(true))
      .on("tileload", () => setTileError(false));
    marker.current = L.circleMarker(m.getCenter(), {
      radius: 7,
      color: "#161b13",
      fillColor: "#b5ee47",
      fillOpacity: 1,
    }).addTo(m);
    line.current = L.polyline([], { color: "#79a822" }).addTo(m);
    return () => {
      m.remove();
      map.current = null;
    };
  }, [live]);
  useEffect(() => {
    if (live && map.current) {
      marker.current.setLatLng(trip.point);
      line.current.setLatLngs(trip.route);
      map.current.panTo(trip.point);
    }
  }, [trip.point]);
  function change(n) {
    if (map.current) map.current.setZoom(map.current.getZoom() + n);
    else Z(Math.max(1, Math.min(2.6, zoom + n * 0.25)));
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
              : "معاينة المسار"}
        </span>
      </div>
      <div className={"mapCanvas " + (expanded ? "expanded" : "")}>
        <div className="actualMap" ref={root} />
        {!live && !trip.active && (
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
        {live && tileError && (
          <span className="mapCity offline">تعذّر تحميل خلفية الخريطة</span>
        )}
        <div className="mapTools">
          <button aria-label="تكبير الخريطة" onClick={() => change(1)}>
            <Plus />
          </button>
          <button aria-label="تصغير الخريطة" onClick={() => change(-1)}>
            <Minus />
          </button>
          <button
            aria-label="توسيط الخريطة"
            onClick={() => (live ? map.current?.panTo(trip.point) : Z(1))}
          >
            <LocateFixed />
          </button>
        </div>
        {!live && !trip.active && (
          <span className="mapCity">
            <Navigation size={12} /> القاهرة، مصر
          </span>
        )}
      </div>
      <div className="mapfoot">
        <span>
          <Radio size={15} />
          {trip.active ? "جارٍ تتبّع الرحلة" : "التتبّع غير نشط"}
        </span>
        {!expanded && (
          <button onClick={onOpen}>
            عرض الخريطة <ArrowUpLeft size={15} />
          </button>
        )}
      </div>
    </section>
  );
}
