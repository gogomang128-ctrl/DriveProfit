import L from "leaflet";
import { VectorTile } from "@mapbox/vector-tile";
import Pbf from "pbf";

// OpenFreeMap serves vector data, not OSM's community raster tile service.
const HOST = "https://tiles.openfreemap.org";
export async function streetLayer(signal) {
  const meta = await fetch(HOST + "/planet", { signal, credentials: "omit" });
  if (!meta.ok) throw Error("Street metadata unavailable");
  const { tiles } = await meta.json(),
    template = tiles?.[0];
  if (
    typeof template !== "string" ||
    !template.startsWith(HOST + "/planet/") ||
    !["{z}", "{x}", "{y}"].every((k) => template.includes(k))
  )
    throw Error("Invalid vector source");
  const layer = L.gridLayer({
    maxNativeZoom: 14,
    minZoom: 5,
    maxZoom: 19,
    keepBuffer: 1,
    updateWhenIdle: true,
    attribution:
      '<a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://openmaptiles.org/">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>',
  });
  const controllers = new WeakMap();
  layer.createTile = (coords, done) => {
    const canvas = document.createElement("canvas"),
      ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.height = Math.round(256 * ratio);
    const ac = new AbortController(),
      abort = () => ac.abort();
    controllers.set(canvas, ac);
    signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, 9000);
    const url = template
      .replace("{z}", coords.z)
      .replace("{x}", coords.x)
      .replace("{y}", coords.y);
    fetch(url, { signal: ac.signal, credentials: "omit" })
      .then(async (r) => {
        if (!r.ok) throw Error("Street detail unavailable");
        const vt = new VectorTile(
          new Pbf(new Uint8Array(await r.arrayBuffer())),
        );
        const ctx = canvas.getContext("2d");
        ctx.scale(ratio, ratio);
        ctx.fillStyle = "#edeae1";
        ctx.fillRect(0, 0, 256, 256);
        function draw(name, color, width) {
          const group = vt.layers[name];
          if (!group) return;
          const scale = 256 / group.extent;
          for (let i = 0; i < group.length; i++) {
            const f = group.feature(i);
            if (f.type !== (width ? 2 : 3)) continue;
            ctx.beginPath();
            for (const ring of f.loadGeometry()) {
              ring.forEach((p, j) =>
                j
                  ? ctx.lineTo(p.x * scale, p.y * scale)
                  : ctx.moveTo(p.x * scale, p.y * scale),
              );
              if (!width) ctx.closePath();
            }
            if (width) {
              ctx.lineWidth = width;
              ctx.strokeStyle = color;
              if (
                name === "transportation" &&
                ["motorway", "trunk", "primary"].includes(f.properties.class)
              ) {
                ctx.strokeStyle = "#ca8c35";
                ctx.lineWidth = 2.5;
              }
              ctx.stroke();
            } else {
              ctx.fillStyle = color;
              ctx.fill("evenodd");
            }
          }
        }
        draw("park", "#c3ddbb");
        draw("water", "#9acfe8");
        draw("building", "#ded8d0");
        draw("waterway", "#70b3d8", 1.4);
        draw("transportation", "#81858a", 1.25);
        // Label a limited number of named streets, avoiding nearby duplicates.
        const labels = vt.layers.transportation_name,
          used = [];
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#fff";
        ctx.fillStyle = "#344049";
        if (coords.z >= 12 && labels)
          for (let i = 0; i < labels.length && used.length < 6; i++) {
            const f = labels.feature(i),
              name = f.properties["name:ar"] || f.properties.name;
            if (!name || f.type !== 2) continue;
            const line = f.loadGeometry()[0];
            if (!line?.length) continue;
            const p = line[Math.floor(line.length / 2)],
              x = (p.x * 256) / labels.extent,
              y = (p.y * 256) / labels.extent,
              w = ctx.measureText(name).width / 2;
            if (
              x < w ||
              x > 256 - w ||
              y < 12 ||
              y > 244 ||
              used.some(
                (a) =>
                  Math.abs(a.x - x) < a.w + w + 6 && Math.abs(a.y - y) < 18,
              )
            )
              continue;
            used.push({ x, y, w });
            ctx.strokeText(name, x, y);
            ctx.fillText(name, x, y);
          }
        const names = vt.layers.place;
        ctx.fillStyle = "#27363d";
        ctx.textAlign = "center";
        ctx.font = "11px sans-serif";
        if (names)
          for (let i = 0; i < Math.min(16, names.length); i++) {
            const f = names.feature(i),
              p = f.loadGeometry()[0]?.[0];
            if (p && f.type === 1)
              ctx.fillText(
                f.properties["name:ar"] || f.properties.name || "",
                (p.x * 256) / names.extent,
                (p.y * 256) / names.extent,
              );
          }
        if (!signal.aborted && controllers.has(canvas)) done(null, canvas);
      })
      .catch((e) => {
        if (!signal.aborted && controllers.has(canvas)) done(e, canvas);
      })
      .finally(() => {
        clearTimeout(timer);
        signal.removeEventListener("abort", abort);
      });
    return canvas;
  };
  layer.on("tileunload", ({ tile }) => {
    const ac = controllers.get(tile);
    controllers.delete(tile);
    ac?.abort();
  });
  return layer;
}
