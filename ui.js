// ui.js：键序列同步控制台（双列对比 + 操作日志 + 一次请求一轮）
import { plan } from "./keys.js";
import { applyRequests } from "./apply.js";

export function mount(spec, parts) {
  let queue = (spec.requests || []).map(function (request) { return { edit_id: request.edit_id, after: request.after.slice() }; });
  let state = { list: (spec.before || []).slice(), ops: [], pending: 0, deferred: 0, note: "还没开始" };
  let budget = spec.budget;

  function runRound() {
    if (!queue.length) { state.note = "没有待处理的请求了"; return; }
    const request = queue.shift();
    const applied = queue.map(function (other) { return other.edit_id; });
    const result = applyRequests(state.list, [request], applied, budget);
    state.list = result.list || state.list;
    state.ops = (state.ops || []).concat(result.ops || []);
    state.pending = result.pending || 0;
    state.deferred = (state.deferred || 0) + (result.deferred || 0);
    state.note = "处理了 " + request.edit_id + "（目标 " + request.after.join(",") + "），未决 " + state.pending + " 个操作";
  }

  function runAll() {
    while (queue.length) runRound();
  }

  function column(title, keys, ghost) {
    const box = document.createElement("div");
    box.style.flex = "1";
    const head = document.createElement("div");
    head.textContent = title;
    head.style.fontSize = "12px";
    head.style.color = "#5b6474";
    head.style.marginBottom = "6px";
    box.appendChild(head);
    keys.forEach(function (key, index) {
      const row = document.createElement("div");
      row.className = "row" + (ghost.indexOf(key) >= 0 ? " ghost" : "");
      const tag = document.createElement("span");
      tag.textContent = index + " · " + key;
      row.appendChild(tag);
      const del = document.createElement("button");
      del.textContent = "×";
      del.title = "删掉这个键并同步";
      del.style.padding = "1px 7px";
      del.style.margin = "0";
      del.addEventListener("click", function () {
        queue.push({ edit_id: "ui-del-" + key + "-" + queue.length,
                     after: state.list.filter(function (other) { return other !== key; }) });
        runRound();
        draw();
      });
      row.appendChild(del);
      box.appendChild(row);
    });
    return box;
  }

  function draw() {
    const next = queue.length ? queue[0].after : state.list;
    parts.stage.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.gap = "18px";
    wrap.appendChild(column("当前列表", state.list, state.list.filter(function (key) { return next.indexOf(key) < 0; })));
    wrap.appendChild(column("下一个目标", next, next.filter(function (key) { return state.list.indexOf(key) < 0; })));
    parts.stage.appendChild(wrap);

    parts.legend.innerHTML = "";
    const chip = document.createElement("span");
    chip.className = "chip " + (state.pending ? "warn" : "ok");
    chip.textContent = "未决操作 " + state.pending + " 个 · 被推迟 " + state.deferred + " 次";
    parts.legend.appendChild(chip);
    const second = document.createElement("span");
    second.className = "chip";
    const nextOp = plan(state.list, next)[0];
    second.textContent = "下一个操作：" + (nextOp ? nextOp.join(" ") : "无");
    second.style.marginLeft = "8px";
    parts.legend.appendChild(second);

    parts.out.textContent = JSON.stringify({ 当前列表: state.list, 未决操作: state.pending, 操作日志: state.ops }, null, 1);
    parts.log.textContent = state.note + "（预算 " + budget + " 个操作/轮；还剩 " + queue.length + " 个请求）";
  }

  function build() {
    parts.controls.innerHTML = "";
    const stepBtn = document.createElement("button");
    stepBtn.className = "primary";
    stepBtn.textContent = "处理下一个请求";
    stepBtn.addEventListener("click", function () { runRound(); draw(); });
    const allBtn = document.createElement("button");
    allBtn.textContent = "全部同步";
    allBtn.addEventListener("click", function () { runAll(); draw(); });
    const shuffle = document.createElement("button");
    shuffle.textContent = "目标倒序";
    shuffle.addEventListener("click", function () {
      queue.push({ edit_id: "ui-rev-" + queue.length, after: state.list.slice().reverse() });
      runRound();
      draw();
    });
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "重置";
    resetBtn.addEventListener("click", function () {
      queue = (spec.requests || []).map(function (request) { return { edit_id: request.edit_id, after: request.after.slice() }; });
      state = { list: (spec.before || []).slice(), ops: [], pending: 0, deferred: 0, note: "已重置" };
      draw();
    });
    parts.controls.appendChild(stepBtn);
    parts.controls.appendChild(allBtn);
    parts.controls.appendChild(shuffle);
    parts.controls.appendChild(resetBtn);

    const label = document.createElement("label");
    label.textContent = "一轮最多执行几个操作（预算）";
    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.value = String(budget);
    input.addEventListener("change", function () {
      budget = Math.max(1, Number(input.value) || 1);
      draw();
    });
    parts.controls.appendChild(label);
    parts.controls.appendChild(input);

    const addLabel = document.createElement("label");
    addLabel.textContent = "目标列表末尾加一个键";
    const addInput = document.createElement("input");
    addInput.type = "text";
    addInput.value = "z";
    addInput.style.width = "54px";
    const addBtn = document.createElement("button");
    addBtn.textContent = "加键";
    addBtn.addEventListener("click", function () {
      const key = String(addInput.value || "z");
      const after = (queue.length ? queue[0].after : state.list).slice();
      after.push(key);
      queue.push({ edit_id: "ui-add-" + queue.length, after: after });
      runRound();
      draw();
    });
    parts.controls.appendChild(addLabel);
    parts.controls.appendChild(addInput);
    parts.controls.appendChild(addBtn);
  }

  build();
  draw();
}
