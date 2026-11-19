import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { preview } from "vite";
const server = await preview({
  preview: { host: "127.0.0.1", port: 0, open: false },
});
const base = "http://127.0.0.1:" + server.httpServer.address().port;
let b;
try {
  b = await chromium.launch({
    ...(process.env.CHROME_BIN
      ? { executablePath: process.env.CHROME_BIN }
      : { channel: "chrome" }),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const p = await b.newPage({ viewport: { width: 1366, height: 870 } });
  let errors = [],
    registered = 0,
    erased = 0;
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.route("**/rest/v1/rpc/register_driver", async (r) => {
    assert.equal(r.request().postDataJSON().p_phone, "+201000000000");
    registered++;
    await r.fulfill({ contentType: "application/json", body: "true" });
  });
  await p.route("**/rest/v1/rpc/erase_driver", (r) => {
    erased++;
    return r.fulfill({ contentType: "application/json", body: "true" });
  });
  await p.route("https://tile.openstreetmap.org/**", (r) => r.abort());
  await p.goto(base);
  await p.evaluate(() => document.fonts.ready);
  await p.getByLabel("اسم الكابتن").fill("اختبار تجريبي");
  await p.getByLabel("رقم الموبايل").fill("٠١٠٠٠٠٠٠٠٠٠");
  await p.getByRole("checkbox").check();
  await p.getByRole("button", { name: "تسجيل ودخول" }).click();
  await p.getByRole("heading", { name: "لوحة القيادة" }).waitFor();
  assert.equal(registered, 1);
  await p.reload();
  await p.getByRole("heading", { name: "لوحة القيادة" }).waitFor();
  await p.getByRole("button", { name: "تغيير المركبة" }).click();
  await p.getByRole("searchbox").fill("تيبو");
  await p.getByLabel("المركبة والفئة").selectOption("fiat_tipo_14_mt");
  await p.getByRole("button", { name: /زحام/ }).click();
  await p.getByText("معايرة الاستهلاك من تفويلتين").click();
  await p.getByLabel("المسافة (كم)", { exact: true }).fill("300");
  await p.getByLabel("اللترات المضافة").fill("24");
  await p.getByRole("button", { name: /استخدام القياس/ }).click();
  await p.getByRole("button", { name: "حفظ التغييرات" }).click();
  assert.equal(
    await p.evaluate(
      () => JSON.parse(localStorage.getItem("dp.settings")).rate,
    ),
    8,
  );
  await p.getByRole("button", { name: "عرض الخريطة" }).click();
  await p.locator(".leaflet-container").waitFor();
  await p.getByRole("button", { name: "تكبير الخريطة" }).click();
  await p.waitForTimeout(400);
  await p.getByRole("button", { name: "تصغير الخريطة" }).click();
  await p.waitForFunction(() => !document.querySelector(".leaflet-zoom-anim"));
  await p.waitForTimeout(350);
  const box = await p.locator(".leaflet-container").boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await p.mouse.down();
  await p.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 40, {
    steps: 8,
  });
  await p.mouse.up();
  assert.equal(
    await p
      .getByRole("button", { name: "توسيط الخريطة" })
      .getAttribute("aria-pressed"),
    "false",
  );
  await p.getByRole("button", { name: "توسيط الخريطة" }).click();
  assert.equal(
    await p
      .getByRole("button", { name: "توسيط الخريطة" })
      .getAttribute("aria-pressed"),
    "true",
  );
  await p.getByRole("button", { name: "فتح ملف الكابتن" }).click();
  await p.getByRole("button", { name: "حذف ملف التسجيل" }).click();
  await p.getByRole("button", { name: "نعم، احذف ملفي" }).click();
  await p.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(erased, 1);
  assert.equal(
    await p.evaluate(() => localStorage.getItem("dp.profile.v1")),
    null,
  );
  await p.evaluate(() => sessionStorage.clear());
  await p.reload();
  await p.setViewportSize({ width: 360, height: 800 });
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth),
    360,
  );
  await p.getByRole("button", { name: "استكشف كضيف" }).click();
  await p.getByRole("button", { name: "فتح القائمة" }).click();
  await p.getByRole("button", { name: "سجل الرحلات", exact: true }).click();
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log(
    "PASS: local return, registration/deletion (mocked transport), vehicle selection/calibration, map zoom/drag/recenter, unavailable tiles, guest and mobile 360px",
  );
  await p.setViewportSize({ width: 1280, height: 820 });
  await p.addInitScript(() => {
    const now = Date.now(),
      pos = (lat, time) => ({
        coords: { latitude: lat, longitude: 31.2357, accuracy: 5, speed: 4 },
        timestamp: time,
      });
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (ok) => ok(pos(30.0444, now)),
        watchPosition: (ok) => {
          ok(pos(30.0454, now + 20000));
          return 1;
        },
        clearWatch() {},
      },
    });
  });
  await p.reload();
  await p.getByRole("button", { name: "بدء رحلة جديدة" }).click();
  await p.getByRole("button", { name: "السماح بالموقع وبدء التتبّع" }).click();
  await p.getByRole("button", { name: "إنهاء الرحلة", exact: true }).click();
  await p.getByRole("dialog").getByRole("spinbutton").fill("100");
  await p.getByRole("button", { name: "إنهاء وحفظ الرحلة" }).click();
  await p.getByRole("button", { name: "سجل الرحلات", exact: true }).click();
  await p.locator("tbody tr").waitFor();
  const [saved] = await p.evaluate(() =>
    JSON.parse(localStorage.getItem("dp.history")),
  );
  assert.ok(saved.km > 0.1 && saved.km < 0.12);
  assert.ok(Math.abs(saved.liters - saved.km * 0.08) < 1e-8);
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log("PASS: GPS trace and measured fuel consumption saved");
} finally {
  await b?.close();
  await new Promise((done) => server.httpServer.close(done));
}
