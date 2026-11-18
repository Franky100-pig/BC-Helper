"use strict";

// 浏览器里的 SymPy 引擎：优先用同源 /pyodide/，失败再依次试公开镜像。
window.BC = { ready: false, error: null, dispatch: null, retry: null };

try {
  if (navigator.serviceWorker && location &&
      (location.protocol === "https:" || location.hostname === "localhost" ||
       location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
} catch (e) {}

const PYODIDE_SOURCES = [
  "./pyodide/",
  "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
  "https://fastly.jsdelivr.net/pyodide/v0.26.2/full/",
  "https://gcore.jsdelivr.net/pyodide/v0.26.2/full/",
];
const SCRIPT_TIMEOUT_MS = 10000;
const LOAD_TIMEOUT_MS = 120000;

function setStatus(msg, kind) {
  const box = document.getElementById("engineBox");
  const el = document.getElementById("engineStatus");
  if (el) el.textContent = msg;
  if (box) {
    box.classList.toggle("ready", kind === "ready");
    box.classList.toggle("error", kind === "error");
  }
}

/* 离线缓存状态徽标（只查询、不干预引擎启动）。 */
function reportCacheStatus(ready) {
  const el = document.getElementById("cacheStatus");
  if (!el || !navigator.serviceWorker || !("caches" in window)) return;
  const onMsg = (event) => {
    if (!event.data || event.data.type !== "BC_CACHE_STATUS_RESULT") return;
    const s = event.data.payload || {};
    if (s.engine) {
      el.className = "cache-status ready";
      el.textContent = "✓ 引擎已装到浏览器 · " + s.files + " 个文件在本地，断网也能算";
      navigator.serviceWorker.removeEventListener("message", onMsg);
    } else if (ready) {
      el.className = "cache-status warn";
      el.textContent = "引擎已就绪，正在后台写入离线缓存…";
      setTimeout(ask, 3000);
    } else {
      el.className = "cache-status";
      el.textContent = "首次启动：正在把引擎装进浏览器（约 19 MB）…";
    }
  };
  const ask = () => {
    const ctrl = navigator.serviceWorker.controller;
    if (ctrl) ctrl.postMessage({ type: "BC_CACHE_STATUS" });
  };
  navigator.serviceWorker.addEventListener("message", onMsg);
  ask();
  if (!ready) setTimeout(ask, 1500);
}

/* 进度用「阶段」而非 transferSize 估算：
 * 旧逻辑靠 performance 条目的 transferSize 累加，缓存命中时 transferSize=0，
 * 进度条会卡在 0 再瞬间跳 100，看起来像卡死。真正耗时的是 WASM 编译 + SymPy
 * import（CPU），不是下载，所以按启动阶段推进才反映真实进度。 */
function setProgress(pct) {
  const bar = document.getElementById("engineBar");
  if (bar) bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
}

function loadScript(url) {
  return new Promise((resolve) => {
    let done = false;
    const script = document.createElement("script");
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), SCRIPT_TIMEOUT_MS);
    script.src = url;
    script.onload = () => finish(true);
    script.onerror = () => finish(false);
    document.head.appendChild(script);
  });
}

function withTimeout(promise, ms, tag) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(tag + " 超时")), ms)),
  ]);
}

function showRetry() {
  const el = document.getElementById("engineStatus");
  if (!el || document.getElementById("engineRetry")) return;
  const btn = document.createElement("button");
  btn.id = "engineRetry";
  btn.type = "button";
  btn.className = "ghost";
  btn.style.marginLeft = "10px";
  btn.textContent = "重试引擎";
  btn.onclick = () => {
    window.BC.error = null;
    btn.remove();
    setStatus("正在重新加载计算引擎…");
    boot();
  };
  el.appendChild(btn);
}

function dispatchPy(payload) {
  return "_bc_dispatch(" + JSON.stringify(JSON.stringify(payload)) + ")";
}

/* Worker 优先：WASM 编译和 SymPy import 放进后台线程，
 * 首次加载的十几秒里讲义 / 考场计算器 / Desmos 仍能正常操作。 */
const BRIDGE_SRC = (document.currentScript && document.currentScript.src) || "";
const WORKER_URL = BRIDGE_SRC
  ? BRIDGE_SRC.replace(/bridge\.js(\?.*)?$/, "engine-worker.js$1")
  : "engine-worker.js";

let worker = null;
let bootPromise = null;
let bootResolve = null;
let inlineTried = false;
let nextRequest = 0;
const pending = new Map();

window.BC.dispatch = (payload) => new Promise((resolve, reject) => {
  if (!window.BC.ready || !worker) {
    reject(new Error("推导引擎还在后台加载"));
    return;
  }
  const id = ++nextRequest;
  pending.set(id, { resolve, reject });
  try {
    worker.postMessage({ type: "dispatch", id, payload });
  } catch (err) {
    pending.delete(id);
    reject(err);
  }
});

function failBoot(message) {
  window.BC.error = message;
  if (worker) { worker.terminate(); worker = null; }
  pending.forEach((p) => p.reject(new Error(message)));
  pending.clear();
  setProgress(0);
  setStatus("引擎加载失败：" + message, "error");
  showRetry();
  if (bootResolve) { bootResolve(); bootResolve = null; }
}

function onWorkerMessage(event) {
  const msg = event.data || {};
  if (msg.type === "progress") {
    if (msg.status) setStatus(msg.status);
    if (typeof msg.pct === "number") setProgress(msg.pct);
    return;
  }
  if (msg.type === "ready") {
    window.BC.ready = true;
    window.BC.error = null;
    setProgress(100);
    setStatus("引擎已就绪 · SymPy 在后台运行，页面不卡顿", "ready");
    reportCacheStatus(true);
    const computeBtn = document.getElementById("compute");
    if (computeBtn) computeBtn.disabled = false;
    if (bootResolve) { bootResolve(); bootResolve = null; }
    return;
  }
  if (msg.type === "error") {
    failBoot(msg.error || "未知错误");
    return;
  }
  if (msg.type === "dispatch") {
    const p = pending.get(msg.id);
    if (!p) return;
    pending.delete(msg.id);
    if (msg.ok) p.resolve(msg.result);
    else p.reject(new Error(msg.error || "计算失败"));
  }
}

/* 老浏览器 / Worker 加载失败时的兜底：退回原来的主线程启动。 */
function bootInline() {
  inlineTried = true;
  setProgress(6);
  reportCacheStatus(false);
  try {
    fetch("pyodide/sympy-1.12-py3-none-any.whl").catch(() => {});
    fetch("pyodide/mpmath-1.3.0-py3-none-any.whl").catch(() => {});
  } catch (e) {}
  return (async () => {
    let loader = null;
    let pyodide = null;
    let lastError = "未知错误";
    for (const base of PYODIDE_SOURCES) {
      if (!loader) {
        setStatus("正在加载引擎脚本：" + (base.indexOf("http") === 0 ? new URL(base).host : "本站"));
        if (!(await loadScript(base + "pyodide.js")) || typeof window.loadPyodide !== "function") {
          lastError = "无法加载 " + base + "pyodide.js";
          continue;
        }
        loader = window.loadPyodide;
      }
      try {
        setStatus("正在编译 Python 运行时（首次较慢）…");
        setProgress(30);
        pyodide = await withTimeout(loader({ indexURL: base }), LOAD_TIMEOUT_MS, base);
        setStatus("正在加载 SymPy…");
        setProgress(62);
        await withTimeout(pyodide.loadPackage("sympy"), LOAD_TIMEOUT_MS, "sympy");
        setProgress(80);
        break;
      } catch (err) {
        lastError = String(err);
        pyodide = null;
      }
    }
    if (!pyodide) {
      window.BC.error = lastError;
      setProgress(0);
      setStatus("引擎加载失败：" + lastError, "error");
      showRetry();
      return;
    }
    try {
      const FS = pyodide.FS;
      try { FS.mkdir("/bc"); } catch (e) {}
      const files = window.BC_CORE_FILES || {};
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
      window.BC.dispatch = (payload) => JSON.parse(pyodide.runPython(dispatchPy(payload)));
      window.BC.pyodide = pyodide;
      window.BC.ready = true;
      setProgress(100);
      setStatus("引擎已就绪 · SymPy 在本地运行", "ready");
      reportCacheStatus(true);
      const computeBtn = document.getElementById("compute");
      if (computeBtn) computeBtn.disabled = false;
    } catch (err) {
      window.BC.error = String(err);
      setStatus("引擎初始化失败：" + String(err), "error");
      showRetry();
    }
  })();
}

function boot() {
  if (window.BC.ready && worker) return Promise.resolve();
  if (bootPromise) return bootPromise;
  setProgress(6);
  reportCacheStatus(false);

  if (typeof Worker !== "function" || inlineTried) {
    bootPromise = bootInline();
  } else {
    try {
      if (worker) worker.terminate();
      worker = new Worker(WORKER_URL);
      worker.onmessage = onWorkerMessage;
      worker.onerror = (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        const err = (e && e.message) || "后台引擎启动失败";
        if (worker) { worker.terminate(); worker = null; }
        if (bootResolve) { bootResolve(); bootResolve = null; }
        setStatus("后台引擎不可用，正在退回主线程…");
        bootPromise = bootInline();
      };
      setStatus("正在后台启动计算引擎（页面可继续使用）…");
      worker.postMessage({
        type: "boot",
        coreFiles: window.BC_CORE_FILES || {},
        sources: PYODIDE_SOURCES,
      });
      bootPromise = new Promise((resolve) => { bootResolve = resolve; });
    } catch (err) {
      worker = null;
      bootPromise = bootInline();
    }
  }
  bootPromise.then(() => { bootPromise = null; }, () => { bootPromise = null; });
  return bootPromise;
}

window.BC.retry = boot;
boot();
