import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plus, Minus, LocateFixed } from "lucide-react";
export default function LiveMap({ point, route }) {
  const root = useRef(null),
    m = useRef(),
    line = useRef(),
    mark = useRef(),
    follow = useRef(true),
    first = useRef(point);
  const [failed, F] = useState(false),
    [following, followState] = useState(true);
  useEffect(() => {
    const map = L.map(root.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      preferCanvas: true,
    }).setView(first.current || [30.0444, 31.2357], first.current ? 15 : 12);
    m.current = map;
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        keepBuffer: 1,
        updateWhenIdle: true,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );
    tiles
      .on("tileerror", () => F(true))
      .on("tileload", () => F(false))
      .addTo(map);
    line.current = L.polyline([], { color: "#99bf45", weight: 4 }).addTo(map);
    mark.current = L.circleMarker([0, 0], {
      radius: 7,
      color: "#1d241a",
      fillColor: "#b6ec50",
      fillOpacity: 1,
    });
    map.on("dragstart", () => {
      follow.current = false;
      followState(false);
    });
    let resize;
    if (window.ResizeObserver) {
      resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
      resize.observe(root.current);
    }
    return () => {
      resize?.disconnect();
      tiles.off();
      map.remove();
      m.current = null;
    };
  }, []);
  useEffect(() => {
    if (!point || !m.current) return;
    mark.current.setLatLng(point).addTo(m.current);
    line.current.setLatLngs(route);
    if (follow.current) m.current.panTo(point, { animate: false });
  }, [point, route]);
  return (
    <>
      <div className="actualMap" ref={root} />
      <div className="mapTools">
        <button aria-label="تكبير الخريطة" onClick={() => m.current?.zoomIn()}>
          <Plus />
        </button>
        <button aria-label="تصغير الخريطة" onClick={() => m.current?.zoomOut()}>
          <Minus />
        </button>
        <button
          aria-label="توسيط الخريطة"
          aria-pressed={following}
          onClick={() => {
            follow.current = true;
            followState(true);
            m.current?.setView(point || [30.0444, 31.2357], point ? 15 : 12);
          }}
        >
          <LocateFixed />
        </button>
      </div>
      {failed && (
        <span className="mapCity offline">
          الخلفية غير متاحة · لا يتوقف حساب المسافة
        </span>
      )}
    </>
  );
}
