"use strict";
/* 页脚「使用人数」计数逻辑的回归测试（Node，无浏览器）。
 *
 * app.js 里的 initUsageCounter 是最后一个 IIFE；本脚本把它整段抽出来，在 vm 里
 * 用假的 DOM / localStorage / fetch 跑一遍，验证几件关键的事：
 *   1. 本机第一次打开 -> /hit（+1），并记下 bc-counted
 *   2. 之后（或拿不到 localStorage）-> /get，绝不重复虚增
 *   3. 数字渲染成 <b>（加粗），文案是 "{n} 人用 BC Helper 学微积分"
 *   4. 千分位（1234 -> 1,234）
 *   5. 取不到数字 / 接口出错 -> 整行保持隐藏，绝不显示 0 或报错
 *
 * 用法：node tools/test_counter.js   （失败 exit 1）
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const WEB = path.resolve(__dirname, "..", "web");
const appSrc = fs.readFileSync(path.join(WEB, "app.js"), "utf8");

const marker = "(function initUsageCounter";
const at = appSrc.indexOf(marker);
if (at < 0) {
  console.error("找不到 initUsageCounter —— app.js 结构变了，测试需要同步更新。");
  process.exit(1);
}
const counterSrc = appSrc.slice(at);

function makeRow() {
  const row = { hidden: true, parts: [] };
  Object.defineProperty(row, "textContent", {
    get() { return row.parts.map((p) => p.text).join(""); },
    set(v) { if (v === "") row.parts = []; },
  });
  row.appendChild = (n) => row.parts.push(n);
  return row;
}

function run({ counted, storeOK, value, fail = false, ok = true, en = false }) {
  const store = {};
  if (counted) store["bc-counted"] = "1";
  const localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { if (!storeOK) throw new Error("blocked"); store[k] = String(v); },
    removeItem: (k) => { if (!storeOK) throw new Error("blocked"); delete store[k]; },
  };
  const row = makeRow();
  const document = {
    getElementById: (id) => (id === "usageRow" ? row : null),
    createElement: () => ({
      kind: "el", text: "",
      get textContent() { return this.text; },
      set textContent(v) { this.text = String(v); },
    }),
    createTextNode: (v) => ({ kind: "text", text: String(v) }),
  };
  let calledUrl = null;
  const fetch = async (url) => {
    calledUrl = url;
    if (fail) throw new Error("offline");
    return { ok, json: async () => ({ value }) };
  };

  const sandbox = { window: {}, localStorage, document, fetch, console };
  sandbox.window = sandbox;
  if (en) {
    sandbox.BC_I18N = { t: (s) => (s === "{n} 人用 BC Helper 学微积分"
      ? "{n} people learning calculus with BC Helper" : s) };
  }
  vm.createContext(sandbox);
  vm.runInContext(counterSrc, sandbox);
  return new Promise((res) => setTimeout(() => res({ row, calledUrl, store }), 30));
}

(async () => {
  let pass = 0, fail = 0;
  const check = (name, cond, extra) => {
    if (cond) { pass++; console.log("  ✓ " + name); }
    else { fail++; console.log("  ✗ " + name + (extra ? "  -> " + extra : "")); }
  };

  console.log("[首次打开, n=7] 期望 /hit + 加粗数字 + 显示");
  let r = await run({ counted: false, storeOK: true, value: 7 });
  check("首次 /hit", /\/hit\//.test(r.calledUrl), r.calledUrl);
  check("整行显示", r.row.hidden === false);
  check("文案 '7 人用 BC Helper 学微积分'", r.row.textContent === "7 人用 BC Helper 学微积分", JSON.stringify(r.row.textContent));
  check("数字是 <b>", r.row.parts.some((p) => p.kind === "el" && p.text === "7"));
  check("写入 bc-counted", r.store["bc-counted"] === "1");

  console.log("[再次打开] 期望 /get（不虚增）");
  r = await run({ counted: true, storeOK: true, value: 42 });
  check("已计过 -> /get", /\/get\//.test(r.calledUrl), r.calledUrl);
  check("文案 '42 人用…'", r.row.textContent === "42 人用 BC Helper 学微积分", JSON.stringify(r.row.textContent));
  check("已计过不写 store", r.store["bc-counted"] === "1");

  console.log("[n=1234] 期望千分位");
  r = await run({ counted: true, storeOK: true, value: 1234 });
  check("千分位 1,234", r.row.textContent === "1,234 人用 BC Helper 学微积分", JSON.stringify(r.row.textContent));

  console.log("[拿不到 localStorage] 期望 /get，绝不 /hit（不虚增）");
  r = await run({ counted: false, storeOK: false, value: 5 });
  check("存储不可用 -> /get", /\/get\//.test(r.calledUrl), r.calledUrl);
  check("不写 bc-counted", !("bc-counted" in r.store));

  console.log("[接口失败 / 非 ok / 非数字] 期望整行隐藏");
  r = await run({ counted: true, storeOK: true, value: 5, fail: true });
  check("fetch 抛错 -> 隐藏", r.row.hidden === true);
  r = await run({ counted: true, storeOK: true, value: 5, ok: false });
  check("!res.ok -> 隐藏", r.row.hidden === true);
  r = await run({ counted: true, storeOK: true, value: "oops" });
  check("非数字 -> 隐藏", r.row.hidden === true);

  console.log("[英文模式] 期望英文文案");
  r = await run({ counted: true, storeOK: true, value: 7, en: true });
  check("英文文案", r.row.textContent === "7 people learning calculus with BC Helper", JSON.stringify(r.row.textContent));

  console.log("\n" + pass + " passed, " + fail + " failed");
  process.exit(fail ? 1 : 0);
})();
