"use strict";
/* SymPy 引擎跑在 Web Worker 里：WASM 编译 + import 不占主线程，
 * 所以首次加载的十几秒里，讲义、考场计算器、Desmos 都能正常点。 */

const TIMEOUT_MS = 120000;
let pyodide = null;

function progress(pct, status) {
  self.postMessage({ type: "progress", pct: pct, status: status });
}

function withTimeout(promise, ms, tag) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(tag + " 超时")), ms)),
  ]);
}

function absolute(base) {
  try { return new URL(base, self.location.href).href; } catch (e) { return base; }
}

function prefetchWheels(base) {
  // 网络 IO 与 WASM 编译重叠；SW cache-first 保证缓存命中时不重复下载。
  ["sympy-1.12-py3-none-any.whl", "mpmath-1.3.0-py3-none-any.whl"].forEach((name) => {
    try { fetch(absolute(base + name)).catch(() => {}); } catch (e) {}
  });
}

async function bootstrap(msg) {
  progress(6, "正在后台启动 Python 引擎（页面仍可正常使用）…");
  const sources = (msg.sources && msg.sources.length) ? msg.sources : ["./pyodide/"];
  let lastError = "未知错误";

  for (const rawBase of sources) {
    const base = absolute(rawBase);
    try {
      prefetchWheels(base);
      progress(16, "正在加载引擎脚本…");
      importScripts(base + "pyodide.js");
      if (typeof self.loadPyodide !== "function") {
        lastError = "无法加载 " + base + "pyodide.js";
        continue;
      }
      progress(30, "正在后台编译 Python 运行时（首次较慢）…");
      pyodide = await withTimeout(self.loadPyodide({ indexURL: base }), TIMEOUT_MS, base);
      progress(62, "正在后台加载 SymPy…");
      await withTimeout(pyodide.loadPackage("sympy"), TIMEOUT_MS, "sympy");
      progress(82, "正在初始化推导规则…");
      break;
    } catch (err) {
      lastError = String(err);
      pyodide = null;
    }
  }

  if (!pyodide) throw new Error(lastError);

  const FS = pyodide.FS;
  try { FS.mkdir("/bc"); } catch (e) {}
  const files = msg.coreFiles || {};
  for (const name of Object.keys(files)) FS.writeFile("/bc/" + name, files[name]);
  pyodide.runPython([
    "import sys, json",
    'if "/bc" not in sys.path:',
    '    sys.path.insert(0, "/bc")',
    "import engine",
    "def _bc_dispatch(req_json):",
    "    return json.dumps(engine.dispatch(json.loads(req_json)), ensure_ascii=False)",
    '"ok"',
  ].join("\n"));
  progress(94, "推导规则就绪，正在连接…");
  self.postMessage({ type: "ready" });
}

function dispatch(msg) {
  try {
    if (!pyodide) throw new Error("引擎尚未就绪");
    const code = "_bc_dispatch(" + JSON.stringify(JSON.stringify(msg.payload)) + ")";
    const result = JSON.parse(pyodide.runPython(code));
    self.postMessage({ type: "dispatch", id: msg.id, ok: true, result: result });
  } catch (err) {
    self.postMessage({ type: "dispatch", id: msg.id, ok: false, error: String(err) });
  }
}

self.onmessage = async (event) => {
  const msg = event.data || {};
  if (msg.type === "boot") {
    try {
      await bootstrap(msg);
    } catch (err) {
      pyodide = null;
      self.postMessage({ type: "error", error: String(err) });
    }
    return;
  }
  if (msg.type === "dispatch") dispatch(msg);
};
