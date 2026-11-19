import React, { useRef, useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { regionalLayer } from "./maps/offline";
import { streetLayer } from "./maps/streets";
import { Plus, Minus, LocateFixed } from "lucide-react";
export default function LiveMap({ point, route }) {
  const root = useRef(null),
    m = useRef(),
    line = useRef(),
    mark = useRef(),
    follow = useRef(true),
    first = useRef(point);
  const [base, setBase] = useState("loading"),
    [following, followState] = useState(true);
  useEffect(() => {
    const map = L.map(root.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      preferCanvas: true,
      minZoom: 5,
      maxZoom: 19,
    }).setView(first.current || [30.0444, 31.2357], first.current ? 16 : 13);
    m.current = map;
    const regional = regionalLayer(map).addTo(map);
    map.attributionControl.addAttribution("Natural Earth");
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
    const ac = new AbortController();
    let streets;
    const fallback = () => {
      if (ac.signal.aborted) return;
      ac.abort();
      streets?.off();
      if (streets && map.hasLayer(streets)) map.removeLayer(streets);
      regional.addTo(map);
      if (map.getZoom() > 11) map.setZoom(10);
      setBase("offline");
    };
    const timer = setTimeout(fallback, 8000);
    streetLayer(ac.signal)
      .then((layer) => {
        if (ac.signal.aborted) return;
        streets = layer;
        layer.once("tileload", () => {
          clearTimeout(timer);
          setBase("online");
          regional.remove();
        });
        layer.once("tileerror", fallback).addTo(map);
      })
      .catch(fallback);
    line.current = L.polyline([], { color: "#1565d8", weight: 6 }).addTo(map);
    mark.current = L.circleMarker([0, 0], {
      radius: 9,
      color: "#fff",
      fillColor: "#155cd0",
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
      clearTimeout(timer);
      ac.abort();
      streets?.off();
      map.remove();
      m.current = null;
    };
  }, []);
  useEffect(() => {
    if (!point || !m.current) return;
    mark.current.setLatLng(point).addTo(m.current);
    line.current.setLatLngs(route);
    if (follow.current) {
      if (!first.current)
        m.current.setView(point, base === "offline" ? 10 : 16, {
          animate: false,
        });
      else m.current.panTo(point, { animate: false });
    }
    first.current = point;
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
            m.current?.setView(
              point || [30.0444, 31.2357],
              base === "offline" ? 10 : point ? 16 : 13,
            );
          }}
        >
          <LocateFixed />
        </button>
      </div>
      {base !== "online" && (
        <span className="mapCity offline">
          {base === "loading"
            ? "تحميل تفاصيل الشوارع…"
            : "خريطة إقليمية دون إنترنت · تفاصيل الشوارع غير متاحة"}
        </span>
      )}
    </>
  );
}
