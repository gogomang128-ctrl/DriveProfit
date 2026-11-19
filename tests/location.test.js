import test from "node:test";
import assert from "node:assert/strict";
import { webLocationBlock, locationProblem } from "../src/locationAccess.js";
test("blocked embedded view, insecure origin and unsupported browser need distinct remedies", () => {
  const w = { isSecureContext: true, self: 1, top: 2 },
    policy = { allowsFeature: () => false };
  assert.equal(webLocationBlock(w, { featurePolicy: policy }, {}), "frame");
  assert.equal(
    webLocationBlock({ ...w, top: 1 }, { permissionsPolicy: policy }, {}),
    "policy",
  );
  assert.equal(webLocationBlock({ isSecureContext: false }, {}, {}), "secure");
  assert.equal(webLocationBlock(w, {}, {}), "unsupported");
  assert.equal(webLocationBlock(w, {}, { geolocation: {} }), "");
});
test("recover from an OS switch separately from an app permission", () => {
  for (const [e, kind] of [
    ["GPS disabled", "gps"],
    ["Approximate only", "app"],
    ["Precise location required", "app"],
    ["Trip notification permission required", "app"],
    ["browser-denied", "browser"],
  ])
    assert.equal(locationProblem(Error(e))[0], kind);
  assert.equal(locationProblem({ code: 1 }, true)[0], "frame");
});
