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

// 源顺序按「国内实测可达性」排：同源优先，其次 fastly / gcore 镜像。
// cdn.jsdelivr.net 在国内常被墙（实测 0 字节却耗满超时），放到最后兜底，
// 避免同源失败后还要空等它 10 秒才轮到能用的镜像。
const PYODIDE_SOURCES = [
  "./pyodide/",
  "https://fastly.jsdelivr.net/pyodide/v0.26.2/full/",
  "https://gcore.jsdelivr.net/pyodide/v0.26.2/full/",
  "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
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

/* 让 SW 在后台把引擎文件（约 19 MB）写进 Cache Storage。
 * 页面一加载就空闲预热：用户看讲义 / 首页的这几秒，引擎已在后台下载，
 * 等第一次点「计算」时多半已缓存好，只剩 WASM 编译 + import，不用干等下载。
 * SW 里的 cacheFirst 保证已缓存的文件不会重复下载，可安全重复调用。 */
function primeEngineCache() {
  if (!navigator.serviceWorker) return;
  const send = () => {
    const ctrl = navigator.serviceWorker.controller;
    if (ctrl) ctrl.postMessage({ type: "BC_CACHE_PRIME" });
  };
  if (navigator.serviceWorker.controller) send();
  else if (navigator.serviceWorker.ready && typeof navigator.serviceWorker.ready.then === "function") {
    navigator.serviceWorker.ready.then(send).catch(() => {});
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

/* 不能叫 loadScript：desmos.js 也定义了同名全局函数且后加载会覆盖它，
 * 旧名会让主线程兜底启动把 undefined 当 timeout 传给 Desmos 的版本，
 * 结果 setTimeout(..., 0) 先触发，所有 Pyodide 源都被误判为加载失败。 */
function loadPyodideScript(url) {
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

/* Worker 优先：WASM 编译和 SymPy import 放进后台线程，首次「计算」才触发，
 * 整个启动期间讲义 / 考场计算器 / Desmos 仍能正常操作。 */
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
  notifyReady(message);
  if (bootResolve) { bootResolve(); bootResolve = null; }
}

/* 按需启动：页面加载时不再编译 WASM。第一次点「计算」才 boot，讲义和考场
 * 模式（纯 JS 数值引擎）因此秒开。等待者队列让「首次计算」在引擎就绪后
 * 自动续跑，而不是丢掉这次点击。boot 本身幂等，重复调用安全。 */
const readyWaiters = [];
function notifyReady(err) {
  readyWaiters.splice(0).forEach((fn) => fn(err));
}

function onWorkerMessage(event) {
  const msg = event.data || {};
  if (msg.type === "progress") {
    if (msg.status) setStatus(msg.status);
    if (typeof msg.pct === "number") setProgress(msg.pct);
    if (typeof window.BC.onProgress === "function") window.BC.onProgress(msg);
    return;
  }
  if (msg.type === "ready") {
    window.BC.ready = true;
    window.BC.error = null;
    setProgress(100);
    setStatus("引擎已就绪 · SymPy 在后台运行，页面不卡顿", "ready");
    primeEngineCache();   // 引擎已在本地跑起来，此刻补缓存不与首次下载抢带宽
    reportCacheStatus(true);
    const computeBtn = document.getElementById("compute");
    if (computeBtn) computeBtn.disabled = false;
    notifyReady();
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
        if (!(await loadPyodideScript(base + "pyodide.js")) || typeof window.loadPyodide !== "function") {
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
      notifyReady(lastError);
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
      notifyReady();
    } catch (err) {
      window.BC.error = String(err);
      setStatus("引擎初始化失败：" + String(err), "error");
      showRetry();
      notifyReady(String(err));
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
  // worker 失败回退时会在 onerror 里替换 bootPromise；只清理自己那一次，
  // 否则旧 promise 的微任务会把新的 inline boot 引用抹掉，导致重复启动。
  const started = bootPromise;
  const clearIfCurrent = () => { if (bootPromise === started) bootPromise = null; };
  started.then(clearIfCurrent, clearIfCurrent);
  return started;
}

/* 按需启动：返回 Promise，就绪时 resolve，失败时 reject。
 * 页面加载不再自动 boot —— 第一次求导 / 积分点「计算」时才触发。 */
window.BC.ensureReady = () => new Promise((resolve, reject) => {
  if (window.BC.ready) { resolve(); return; }
  if (window.BC.error) { reject(new Error(window.BC.error)); return; }
  readyWaiters.push((err) => (err ? reject(new Error(err)) : resolve()));
  boot();
});

window.BC.retry = boot;
// 不再在页面加载时自动启动引擎；由第一次「计算」经 ensureReady 触发。

// 但引擎文件（19 MB）可以在空闲时后台预下载到 Cache Storage：这不启动 WASM
// 编译，不占主线程，纯网络 IO。用户看首页 / 讲义的几秒里引擎就下好了，
// 首次点「计算」只剩编译 + import，等待时间大幅缩短。
(function warmCacheWhenIdle() {
  const run = () => primeEngineCache();
  if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 2000 });
  else setTimeout(run, 1200);
})();
