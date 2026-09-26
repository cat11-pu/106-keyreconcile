// app.js：渲染结果
import { plan } from "./keys.js";
import { applyRequests } from "./apply.js";

export function render(spec) {
  const requests = spec.requests || [];
  const first = applyRequests(spec.before || [], requests, spec.applied || [], spec.budget);
  let full = (spec.before || []).slice();
  const fullOps = [];
  for (const request of requests) {
    for (const op of plan(full, request.after)) {
      full = (function (list, step) {
        if (step[0] === "remove") return list.filter(function (key) { return key !== step[1]; });
        if (step[0] === "insert") return list.slice(0, step[2]).concat([step[1]]).concat(list.slice(step[2]));
        return list.filter(function (key) { return key !== step[1]; }).slice(0, step[2])
          .concat([step[1]]).concat(list.filter(function (key) { return key !== step[1]; }).slice(step[2]));
      })(full, op);
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
