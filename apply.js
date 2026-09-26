// apply.js：同步请求与预算
// 每轮先清上一轮未决（受预算限制），清不完就推迟本轮请求；
// 全部请求处理完后若仍有未决，收尾一次做完（不受预算）。
import { plan, apply } from "./keys.js";

export function applyRequests(before, requests, applied, budget) {
  const done = new Set(applied || []);
  const limit = (typeof budget === "number" && budget > 0) ? Math.floor(budget) : Infinity;
  let list = (before || []).slice();
  let pending = [];
  const ops = [];
  let firstDone = 0;
  let firstLeft = 0;
  let firstSet = false;
  let deferred = 0;
  let closing = 0;
  let skipped = 0;

  function runOne(op) {
    list = apply(list, op);
    ops.push(op);
  }

  for (const request of requests || []) {
    if (done.has(request.edit_id)) { skipped += 1; continue; }
    let remaining = limit;
    while (pending.length && remaining > 0) {
      runOne(pending.shift());
      remaining -= 1;
    }
    if (pending.length) { deferred += 1; continue; }
    const planned = plan(list, request.after);
    let roundDone = 0;
    while (planned.length && remaining > 0) {
      runOne(planned.shift());
      remaining -= 1;
      roundDone += 1;
    }
    pending = pending.concat(planned);
    if (!firstSet) {
      firstSet = true;
      firstDone = roundDone;
      firstLeft = pending.length;
    }
  }

  while (pending.length) {
    runOne(pending.shift());
    closing += 1;
  }

  return { list: list, ops: ops, firstDone: firstDone, firstLeft: firstLeft,
           deferred: deferred, closing: closing, pending: pending.length, skipped: skipped };
}
