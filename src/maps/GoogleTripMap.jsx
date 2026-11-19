import React, { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { LocateFixed } from "lucide-react";
const cairo = { lat: 30.0444, lng: 31.2357 };
let configured = false,
  authFailed = false;
const subscribers = new Set();
function maps() {
  if (authFailed) throw Error("Maps authorization failed");
  if (!configured) {
    configured = true;
    setOptions({
      key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      language: "ar",
      region: "EG",
      v: "quarterly",
    });
    window.gm_authFailure = () => {
      authFailed = true;
      for (const fail of subscribers) fail();
    };
  }
  return importLibrary("maps");
}
export default function GoogleTripMap({ point, route, onFailure }) {
  const root = useRef(null),
    view = useRef(null),
    latest = useRef({ point, route }),
    follow = useRef(true);
  const [ready, R] = useState(false),
    [following, F] = useState(true);
  useEffect(() => {
    latest.current = { point, route };
  }, [point, route]);
  useEffect(() => {
    let alive = true,
      events = [];
    const fail = () => {
      if (alive) onFailure(true);
    };
    subscribers.add(fail);
    const timer = setTimeout(fail, 12000);
    (async () => {
      const { Map, Polyline, Circle } = await maps();
      if (!alive) return;
      const start = latest.current.point;
      const map = new Map(root.current, {
        center: start || cairo,
        zoom: start ? 16 : 13,
        mapTypeId: "roadmap",
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        clickableIcons: false,
        gestureHandling: "greedy",
        zoomControl: true,
      });
      view.current = {
        map,
        line: new Polyline({ map, strokeColor: "#164eb4", strokeWeight: 6 }),
        dot: new Circle({
          radius: 12,
          strokeColor: "#fff",
          strokeWeight: 3,
          fillColor: "#135ada",
          fillOpacity: 1,
          clickable: false,
        }),
        hadFix: !!start,
      };
      events.push(
        map.addListener("tilesloaded", () => clearTimeout(timer)),
        map.addListener("dragstart", () => {
          follow.current = false;
          F(false);
        }),
      );
      R(true);
    })().catch(fail);
    return () => {
      alive = false;
      clearTimeout(timer);
      subscribers.delete(fail);
      events.forEach((e) => e.remove());
      const v = view.current;
      if (v) {
        v.line.setMap(null);
        v.dot.setMap(null);
        view.current = null;
      }
    };
  }, [onFailure]);
  useEffect(() => {
    const v = view.current;
    if (!v || !ready) return;
    v.line.setPath(route.map(({ lat, lng }) => ({ lat, lng })));
    if (!point) {
      v.dot.setMap(null);
      return;
    }
    const p = { lat: point.lat, lng: point.lng };
    v.dot.setCenter(p);
    v.dot.setMap(v.map);
    if (follow.current) {
      if (!v.hadFix) v.map.setZoom(16);
      v.map.panTo(p);
    }
    v.hadFix = true;
  }, [ready, point, route]);
  return (
    <>
      <div className="actualMap" ref={root} aria-label="خريطة شوارع Google" />
      <div className="mapTools">
        <button
          aria-label="توسيط الخريطة"
          aria-pressed={following}
          onClick={() => {
            follow.current = true;
            F(true);
            view.current?.map.setCenter(point || cairo);
            view.current?.map.setZoom(point ? 16 : 13);
          }}
        >
          <LocateFixed />
        </button>
      </div>
      {!ready && <small className="mapCity offline">تحميل خرائط Google…</small>}
    </>
  );
}
