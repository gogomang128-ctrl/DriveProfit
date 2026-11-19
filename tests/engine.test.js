import test from "node:test";
import assert from "node:assert/strict";
import { calc, distance } from "../src/engine.js";
test("fuel and net include maintenance", () => {
  assert.deepEqual(calc(100, 100, 3, 20, 5), {
    liters: 3,
    fuel: 60,
    cost: 65,
    net: 35,
  });
  assert.ok(calc(100, 1, 3, 20, 0).net < 0);
});
test("invalid input", () => {
  for (let x of [-1, NaN, Infinity]) assert.throws(() => calc(x, 1, 3, 20, 5));
});
test("GPS km", () =>
  assert.ok(
    Math.abs(distance({ lat: 0, lng: 0 }, { lat: 0, lng: 1 }) - 111.195) <
      0.001,
  ));
