import L from "leaflet";
import egypt from "./egypt.json";
// Public domain Natural Earth 1:10m, generalised geometry, not turn-by-turn navigation.
export function regionalLayer(map) {
  map.createPane("regional");
  map.getPane("regional").style.zIndex = 190;
  const renderer = L.canvas({ pane: "regional", padding: 0.15 });
  const shapes = L.layerGroup();
  for (const [name, color, weight] of [
    ["roads", "#74765f", 1.8],
    ["rivers", "#4388a7", 3],
  ])
    L.polyline(egypt[name], {
      renderer,
      color,
      weight,
      interactive: false,
    }).addTo(shapes);
  const arabic = {
    Cairo: "القاهرة",
    Giza: "الجيزة",
    Alexandria: "الإسكندرية",
    Suez: "السويس",
    Aswan: "أسوان",
    Luxor: "الأقصر",
  };
  for (const [name, lat, lng] of egypt.places) {
    const dot = L.circleMarker([lat, lng], {
      renderer,
      radius: 3,
      color: "#bfca96",
      interactive: false,
    }).addTo(shapes);
    dot.bindTooltip(arabic[name] || name, {
      permanent: true,
      direction: "top",
      className: "cityLabel",
      pane: "regional",
    });
  }
  return shapes;
}
