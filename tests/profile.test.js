import test from "node:test";
import assert from "node:assert/strict";
import { normalizePhone, createProfile } from "../src/profile.js";
test("Egyptian mobile formats normalize to E.164", () => {
  for (const n of [
    "01000000000",
    "٠١٠٠٠٠٠٠٠٠٠",
    "00201000000000",
    "+20 100 000 0000",
  ])
    assert.equal(normalizePhone(n), "+201000000000");
  for (const n of ["", "123", "+201400000000", "02000000000", "010000000001"])
    assert.equal(normalizePhone(n), null);
});
test("device enrollment never derives credential from a phone", () => {
  const one = createProfile("Test Driver", "01000000000"),
    two = createProfile("Test Driver", "01000000000");
  assert.match(one.device, /^[a-f0-9]{64}$/);
  assert.notEqual(one.device, two.device);
  assert.equal(one.synced, false);
  assert.throws(() => createProfile(" ", "01000000000"));
});
