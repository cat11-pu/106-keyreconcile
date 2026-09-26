// keys.js：操作序列与单步执行
const DUP_KEY_CODE = "E_DUP_KEY";

function assertUnique(keys) {
  const seen = new Set();
  for (const key of keys) {
    if (seen.has(key)) {
      const error = new Error("duplicate key: " + key);
      error.code = DUP_KEY_CODE;
      throw error;
    }
    seen.add(key);
  }
}

// plan(live, after)：先按当前顺序删掉不在目标里的键，再按目标顺序逐个就位
export function plan(live, after) {
  const current = (live || []).slice();
  const target = (after || []).slice();
  assertUnique(current);
  assertUnique(target);
  const ops = [];
  const keep = new Set(target);
  const list = [];
  for (const key of current) {
    if (keep.has(key)) list.push(key);
    else ops.push(["remove", key, -1]);
  }
  for (let index = 0; index < target.length; index += 1) {
    const key = target[index];
    const at = list.indexOf(key);
    if (at < 0) {
      ops.push(["insert", key, index]);
      list.splice(index, 0, key);
    } else if (at !== index) {
      ops.push(["move", key, index]);
      list.splice(at, 1);
      list.splice(index, 0, key);
    }
  }
  return ops;
}

// apply(list, op)：单步执行一个操作，返回新列表
export function apply(list, op) {
  const kind = op[0];
  if (kind === "remove") return list.filter(function (key) { return key !== op[1]; });
  if (kind === "insert") return list.slice(0, op[2]).concat([op[1]]).concat(list.slice(op[2]));
  const rest = list.filter(function (key) { return key !== op[1]; });
  return rest.slice(0, op[2]).concat([op[1]]).concat(rest.slice(op[2]));
}
