// apply.js：同步请求与预算（基线：不应用请求、不清未决）
import { plan, apply } from "./keys.js";

export function applyRequests(before, requests, applied, budget) {
  return { list: before || [], firstDone: 0, firstLeft: 0, deferred: 0,
           closing: 0, pending: 0, ops: [], skipped: 0 };
}
