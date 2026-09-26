// apply.js：同步请求与预算（按序处理、先清未决、收尾一次做完）
import { plan, apply } from "./keys.js";

export function applyRequests(before, requests, applied, budget) {
  let list = (before || []).slice();
  const done = applied || [];
  const limit = budget == null ? Infinity : Math.max(0, budget);
  const ops = [];
  let pendingOps = [];
  let firstDone = 0;
  let firstLeft = 0;
  let firstSeen = false;
  let deferred = 0;
  let skipped = 0;

  function runOne(op) {
    list = apply(list, op);
    ops.push(op);
  }

  for (const request of requests || []) {
    if (done.indexOf(request.edit_id) >= 0) { skipped += 1; continue; }
    let roundBudget = limit;
    let roundDone = 0;
    if (pendingOps.length) {
      while (pendingOps.length && roundBudget > 0) {
        runOne(pendingOps.shift());
        roundBudget -= 1;
        roundDone += 1;
      }
      if (pendingOps.length) {
        deferred += 1;
        if (!firstSeen) { firstSeen = true; firstDone = roundDone; firstLeft = pendingOps.length; }
        continue;
      }
    }
    const steps = plan(list, request.after);
    for (const step of steps) {
      if (roundBudget > 0) {
        runOne(step);
        roundBudget -= 1;
        roundDone += 1;
      } else {
        pendingOps.push(step);
      }
    }
    if (!firstSeen) { firstSeen = true; firstDone = roundDone; firstLeft = pendingOps.length; }
  }

  let closing = 0;
  while (pendingOps.length) {
    runOne(pendingOps.shift());
    closing += 1;
  }

  return { list: list, ops: ops, firstDone: firstDone, firstLeft: firstLeft,
           deferred: deferred, closing: closing, pending: pendingOps.length, skipped: skipped };
}
