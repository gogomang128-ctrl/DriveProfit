import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validFeed } from "../src/prices.js";
const feed = JSON.parse(
  readFileSync(new URL("../public/data/fuel-eg.json", import.meta.url)),
);
test("reviewed price catalog has all three grades", () =>
  assert.ok(validFeed(feed)));
test("reject stale, missing or malformed data", () => {
  assert.equal(validFeed(feed, "2027-01-01"), false);
  for (const bad of [
    { prices: { 92: 22 } },
    { source: "javascript:void(0)" },
    { asOf: "2026-11-31" },
    { currency: "USD" },
  ])
    assert.equal(validFeed({ ...feed, ...bad }), false);
});
import { parsePrices } from "../supabase/functions/egypt-fuel-prices/index.js";
import { freshCheck } from "../src/prices.js";
test("only accept three unambiguous domestic EGP per litre rows", () => {
  const row = (name, price, unit = "جنيه/لتر") =>
    `<tr><td><img></td><td>${name}</td><td>${price}</td><td>${unit}</td></tr>`;
  const rows =
    row("بنزين ٨٠", "٢٠٫٧٥") + row("بنزين 92", "22.25") + row("بنزين 95", "24");
  assert.deepEqual(parsePrices(rows + row("سولار", "20.5")), feed.prices);
  assert.throws(() => parsePrices(rows.replace("جنيه/لتر", "USD")));
  assert.throws(() => parsePrices(rows + row("بنزين 95", "25")));
});
test("snapshot and expired fetch must never count as live", () => {
  const now = Date.parse(feed.asOf);
  assert.equal(freshCheck(feed, now), false);
  const sample = { ...feed, checkedAt: new Date(now).toISOString() };
  assert.ok(freshCheck(sample, now));
  assert.equal(freshCheck(sample, now + 600000), false);
});
