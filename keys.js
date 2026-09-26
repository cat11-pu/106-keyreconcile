// keys.js：操作序列与单步执行
// 操作形如 ["remove", key, -1] / ["insert", key, index] / ["move", key, index]

function dupError(key) {
  const error = new Error("E_DUP_KEY: 重复键 " + key);
  error.code = "E_DUP_KEY";
  return error;
}

function assertUnique(keys) {
  const seen = new Set();
  for (const key of keys) {
    if (seen.has(key)) throw dupError(key);
    seen.add(key);
  }
}

export function plan(live, after) {
  assertUnique(live);
  assertUnique(after);
  const ops = [];
  const list = live.slice();
  for (const key of live) {
    if (after.indexOf(key) < 0) {
      ops.push(["remove", key, -1]);
      list.splice(list.indexOf(key), 1);
    }
  }
  for (let index = 0; index < after.length; index += 1) {
    const key = after[index];
    const at = list.indexOf(key);
    if (at === index) continue;
    if (at < 0) {
      ops.push(["insert", key, index]);
      list.splice(index, 0, key);
    } else {
      ops.push(["move", key, index]);
      list.splice(at, 1);
      list.splice(index, 0, key);
    }
  }
  return ops;
}

export function apply(list, op) {
  const type = op[0];
  const key = op[1];
  const index = op[2];
  if (type === "remove") return list.filter(function (other) { return other !== key; });
  if (type === "insert") return list.slice(0, index).concat([key]).concat(list.slice(index));
  if (type === "move") {
    const rest = list.filter(function (other) { return other !== key; });
    return rest.slice(0, index).concat([key]).concat(rest.slice(index));
  }
  return list.slice();
}
