import assert from "node:assert";
import { plan, apply } from "../keys.js";
import { applyRequests } from "../apply.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const requests = [{ edit_id: "k1", after: ["b", "a"] }];

check("plan returns a list", () => {
  assert.ok(Array.isArray(plan(["a", "b"], ["b", "a"])));
});

check("apply returns a list", () => {
  assert.ok(Array.isArray(apply(["a", "b"], ["remove", "a", -1])));
});

check("applyRequests returns list", () => {
  assert.ok(Array.isArray(applyRequests(["a", "b"], requests, [], 1).list));
});

check("applyRequests reports pending", () => {
  assert.strictEqual(typeof applyRequests(["a", "b"], requests, [], 1).pending, "number");
});

check("applyRequests reports deferred", () => {
  assert.strictEqual(typeof applyRequests(["a", "b"], requests, [], 1).deferred, "number");
});

check("render exposes repeat_ops", () => {
  const spec = { before: ["a", "b"], requests: requests, applied: [], budget: 1 };
  assert.strictEqual(typeof render(spec).repeat_ops, "number");
});

console.log("6 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
