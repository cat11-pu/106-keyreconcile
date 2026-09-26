import fs from "node:fs";
import { render } from "./app.js";
import { applyRequests } from "./apply.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/keys.json", "utf8"));
const view = render(spec);

emit("最终列表 =", JSON.stringify(view.list));
emit("首轮执行操作数 =", view.first_done);
emit("首轮未决操作数 =", view.first_left);
emit("被推迟请求数 =", view.deferred);
emit("收尾执行操作数 =", view.closing);
emit("最终未决数 =", view.pending);
emit("全量操作数 =", view.full_ops);
emit("重复同步操作数 =", view.repeat_ops);
emit("跳过请求数 =", view.skipped);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  const bad = applyRequests(["a", "b"], [{ edit_id: "kx", after: ["a", "a"] }], [], 2);
  emit("重复键错误码 =", bad && bad.code ? bad.code : "no-error");
} catch (error) {
  emit("重复键错误码 =", error.code || error.message);
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "最终列表": [
    "x",
    "b",
    "d",
    "y"
  ],
  "首轮执行操作数": 3,
  "首轮未决操作数": 1,
  "被推迟请求数": 0,
  "收尾执行操作数": 0,
  "最终未决数": 0,
  "全量操作数": 9,
  "重复同步操作数": 0,
  "跳过请求数": 1,
  "重复键错误码": "E_DUP_KEY"
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
