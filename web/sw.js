/* bc-static-v2：首次访问把页面 + KaTeX + 浏览器里的 Python 引擎全部写进 Cache Storage。
 * 策略：
 *  - install 预缓存应用外壳（小文件），skipWaiting + claim 立刻接管
 *  - 导航请求 network-first（更新能生效），断网回退到缓存的 index.html
 *  - 其余同源 GET cache-first：第一次下载即缓存，之后秒开、可离线
 *  - 跨域（Desmos CDN）完全不碰，避免 opaque 响应污染缓存
 */
const CACHE = "bc-static-v2";

const SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./bridge.js",
  "./calc-engine.js",
  "./desmos.js",
  "./sw.js",
  "./core_bundle.js",
  "./vendor/katex/katex.min.css",
  "./vendor/katex/katex.min.js",
];

async function prime(cache, urls) {
  // 并行预缓存：串行下载大文件会阻塞页面后续请求（含引擎脚本）。
  const results = await Promise.all(urls.map((url) => cache.add(url).then(() => 1).catch(() => 0)));
  return results.reduce((a, b) => a + b, 0);
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await prime(cache, SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.indexOf("bc-") === 0 && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
    // 延迟预热引擎大文件：等首屏脚本加载完成，不与引擎启动抢带宽。
    // 这样第一次打开后，引擎就完整躺在 Cache Storage 里，之后断网也能算。
    setTimeout(() => {
      caches.open(CACHE).then((cache) => prime(cache, ENGINE)).catch(() => {});
    }, 6000);
  })());
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return (await cache.match(req)) || (await cache.match("./index.html")) || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return; // Desmos 等第三方交给浏览器默认处理
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }
  event.respondWith(cacheFirst(req));
});

// 页面可主动查询缓存进度
const ENGINE = [
  "./pyodide/pyodide.js", "./pyodide/pyodide.asm.js", "./pyodide/pyodide.asm.wasm",
  "./pyodide/python_stdlib.zip", "./pyodide/pyodide-lock.json", "./pyodide/manifest.json",
  "./pyodide/sympy-1.12-py3-none-any.whl", "./pyodide/mpmath-1.3.0-py3-none-any.whl",
];

self.addEventListener("message", (event) => {
  if (!event.data) return;
  if (event.data.type === "BC_CACHE_PRIME") {
    // 引擎已在页面跑起来，此刻再补缓存，不与首次下载抢带宽。
    (async () => {
      const cache = await caches.open(CACHE);
      await prime(cache, ENGINE);
    })().catch(() => {});
    return;
  }
  if (event.data.type !== "BC_CACHE_STATUS") return;
  (async () => {
    const cache = await caches.open(CACHE);
    const keys = await cache.keys();
    const urls = keys.map((k) => k.url);
    const has = (needle) => urls.some((u) => u.indexOf(needle) !== -1);
    const result = {
      shell: has("index.html") && has("app.js"),
      engine: has("pyodide.asm.wasm") && has("sympy-") && has("python_stdlib.zip"),
      files: urls.length,
    };
    if (event.source && event.source.postMessage) {
      event.source.postMessage({ type: "BC_CACHE_STATUS_RESULT", payload: result });
    }
  })().catch(() => {});
});
