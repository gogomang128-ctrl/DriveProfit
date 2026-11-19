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
