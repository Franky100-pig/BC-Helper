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

function startProgress() {
  let total = 21000000;
  fetch("pyodide/manifest.json")
    .then((r) => (r.ok ? r.json() : null))
    .then((m) => { if (m && m.total > 0) total = m.total; })
    .catch(() => {});
  const bar = document.getElementById("engineBar");
  if (!bar || typeof setInterval !== "function") return;
  const timer = setInterval(() => {
    let loaded = 0;
    try {
      performance.getEntriesByType("resource").forEach((entry) => {
        if (String(entry.name).indexOf("/pyodide/") !== -1) {
          loaded += entry.transferSize || entry.encodedBodySize || entry.decodedBodySize || 0;
        }
      });
    } catch (e) {}
    bar.style.width = Math.min(100, Math.round((loaded / total) * 100)) + "%";
    if (window.BC.ready || window.BC.error) {
      clearInterval(timer);
      if (window.BC.ready) bar.style.width = "100%";
    }
  }, 300);
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

let bootPromise = null;
function boot() {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    startProgress();
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
        setStatus("正在启动 Python 运行时…");
        pyodide = await withTimeout(loader({ indexURL: base }), LOAD_TIMEOUT_MS, base);
        setStatus("正在加载 SymPy…");
        await withTimeout(pyodide.loadPackage("sympy"), LOAD_TIMEOUT_MS, "sympy");
        break;
      } catch (err) {
        lastError = String(err);
        pyodide = null;
      }
    }

    if (!pyodide) {
      window.BC.error = lastError;
      setStatus("引擎加载失败：" + lastError, "error");
      showRetry();
      return;
    }

    try {
      const FS = pyodide.FS;
      try { FS.mkdir("/bc"); } catch (e) {}
      const files = window.BC_CORE_FILES || {};
      for (const name of Object.keys(files)) {
        FS.writeFile("/bc/" + name, files[name]);
      }
      const init = [
        "import sys, json",
        'if "/bc" not in sys.path:',
        '    sys.path.insert(0, "/bc")',
        "import engine",
        "def _bc_dispatch(req_json):",
        "    return json.dumps(engine.dispatch(json.loads(req_json)), ensure_ascii=False)",
        '"ok"',
      ].join("\n");
      pyodide.runPython(init);
      window.BC.dispatch = (payload) => JSON.parse(pyodide.runPython(dispatchPy(payload)));
      window.BC.pyodide = pyodide;
      window.BC.ready = true;
      setStatus("引擎已就绪 · SymPy 在本地运行", "ready");
      const computeBtn = document.getElementById("compute");
      if (computeBtn) computeBtn.disabled = false;
    } catch (err) {
      window.BC.error = String(err);
      setStatus("引擎初始化失败：" + String(err), "error");
      showRetry();
    }
  })();
  bootPromise.then(() => { bootPromise = null; }, () => { bootPromise = null; });
  return bootPromise;
}

window.BC.retry = boot;
boot();
