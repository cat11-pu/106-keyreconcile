// app.js：渲染结果
import { plan, apply } from "./keys.js";
import { applyRequests } from "./apply.js";

export function render(spec) {
  const requests = spec.requests || [];
  const first = applyRequests(spec.before || [], requests, spec.applied || [], spec.budget);
  let full = (spec.before || []).slice();
  const fullOps = [];
  for (const request of requests) {
    for (const op of plan(full, request.after)) {
      full = apply(full, op);
      fullOps.push(op);
    }
  }
  const again = plan(first.list || [], requests.length ? requests[requests.length - 1].after : (spec.before || []));
  return {
    list: first.list,
    ops: first.ops,
    first_done: first.firstDone,
    first_left: first.firstLeft,
    deferred: first.deferred,
    closing: first.closing,
    pending: first.pending,
    repeat_ops: again.length,
    full_ops: fullOps.length,
    skipped: first.skipped
  };
}
