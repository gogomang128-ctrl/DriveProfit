// Offline contract test: exercises the official loader URL, not live Google billing/auth.
import { build, preview } from "vite";
import { chromium } from "playwright-core";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const outDir = await mkdtemp(join(tmpdir(), "dp-map-"));
let server, b;
try {
  await build({
    logLevel: "error",
    define: {
      "import.meta.env.VITE_GOOGLE_MAPS_API_KEY": JSON.stringify("test-only"),
    },
    build: { outDir },
  });
  server = await preview({
    build: { outDir },
    preview: { port: 0, host: "127.0.0.1" },
  });
  const origin = "http://127.0.0.1:" + server.httpServer.address().port;
  b = await chromium.launch({
    ...(process.env.CHROME_BIN
      ? { executablePath: process.env.CHROME_BIN }
      : { channel: "chrome" }),
    args: ["--no-sandbox"],
  });
  const p = await b.newPage();
  let scripts = 0;
  await p.route("https://maps.googleapis.com/maps/api/js*", (r) => {
    scripts++;
    const u = new URL(r.request().url());
    assert.equal(u.searchParams.get("language"), "ar");
    assert.equal(u.searchParams.get("key"), "test-only");
    return r.fulfill({
      contentType: "text/javascript",
      body: `google.maps.importLibrary=async()=>({Map:class {constructor(el,options){el.dataset.zoom=options.zoom}addListener(e,cb){if(e==='tilesloaded')cb();return {remove(){}}}},Circle:class{setMap(){}},Polyline:class{setPath(p){window.pathLength=p.length}setMap(){}}});google.maps.__ib__();`,
    });
  });
  await p.route("https://tiles.openfreemap.org/**", (r) => r.abort());
  await p.goto(origin);
  await p.getByRole("button", { name: "استكشف كضيف" }).click();
  await p.getByRole("button", { name: "عرض الخريطة" }).click();
  await p.waitForFunction(() => window.pathLength === 0);
  assert.equal(scripts, 1);
  assert.equal(
    await p.getByLabel("خريطة شوارع Google").getAttribute("data-zoom"),
    "13",
  );
  await p.evaluate(() => window.gm_authFailure());
  await p.getByText(/تعذّر تحميل Google/).waitFor();
  await p.locator(".leaflet-container").waitFor();
  console.log(
    "PASS: configured official Maps loader and authorization-failure fallback (mock SDK)",
  );
} finally {
  await b?.close();
  if (server) await new Promise((ok) => server.httpServer.close(ok));
  await rm(outDir, { recursive: true, force: true });
}
