"use strict";

/* desmos.js — 考场模式的绘图面板。
 * 优先用 Desmos Graphing Calculator API；脚本加载失败或超时（大陆网络常见）
 * 时自动降级到内置 canvas 绘图，保证断网也有图看。
 */
// Desmos Graphing Calculator API key（用户自有 key，替换官方 demo key 以去掉试用横幅）。
const DESMOS_API_KEY = "85dc7bee976f4d9dae05016023ae80f2";
const DESMOS_SCRIPT = "https://www.desmos.com/api/v1.10/calculator.js?apiKey=" + DESMOS_API_KEY + "&lang=zh-CN";
const DESMOS_TIMEOUT = 9000;

const graph = {
  instance: null,
  mode: "loading", // loading | desmos | canvas
  latex: "y=x^2",
  src: "x^2", // 原始表达式（绘图用），与 latex 分开保存
  deg: false,
  cleared: false, // 用户点「清空」后，缩放/重绘/切主题不能把曲线偷偷画回来
  canvasView: { xmin: -10, xmax: 10, ymin: -6, ymax: 6 },
};

function loadScript(url, timeout) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeout);
    const s = document.createElement("script");
    s.src = url;
    s.onload = () => finish(!!window.Desmos && !!window.Desmos.GraphingCalculator);
    s.onerror = () => finish(false);
    document.head.appendChild(s);
  });
}

function graphStatus(msg, kind) {
  const el = document.getElementById("graphStatus");
  if (!el) return;
  el.textContent = msg;
  el.className = "graph-status " + (kind || "");
}

async function initGraph() {
  if (graph.instance || graph.mode === "canvas") return;
  // 离线快速兜底：navigator.onLine 明确为 false 时直接降级，
  // 不等 loadScript 的 9 秒超时（离线白等体验很差）。
  if (navigator.onLine === false) {
    graph.fromOffline = true;
    useCanvas("当前离线 · 已切换到内置绘图（联网后自动恢复 Desmos）");
    return;
  }
  graphStatus("正在连接 Desmos…");
  const ok = await loadScript(DESMOS_SCRIPT, DESMOS_TIMEOUT);
  if (ok) {
    try {
      const elt = document.getElementById("desmos");
      graph.instance = window.Desmos.GraphingCalculator(elt, {
        keypad: true,
        language: "zh-CN",
        expressions: true,
        settingsMenu: true,
        fontSize: 14,
        degreeMode: graph.deg,
      });
      graph.mode = "desmos";
      document.getElementById("desmosWrap").hidden = false;
      document.getElementById("canvasWrap").hidden = true;
      applyGraph();
      graphStatus("Desmos 已就绪 · 可缩放、追踪交点", "ok");
      return;
    } catch (e) {}
  }
  useCanvas("Desmos 连接失败，已切换到内置绘图（离线可用）");
}

function useCanvas(msg) {
  graph.mode = "canvas";
  const desmosWrap = document.getElementById("desmosWrap");
  const canvasWrap = document.getElementById("canvasWrap");
  if (desmosWrap) desmosWrap.hidden = true;
  if (canvasWrap) canvasWrap.hidden = false;
  drawCanvas();
  graphStatus(msg, "warn");
}

function setGraphExpression(latex, deg, src) {
  // latex 为 null 时只更新角度制，必须复用上一次的 LaTeX，否则曲线会被清空。
  // latex 为 null 表示只同步角度制，此时保留 cleared 状态。
  if (latex !== null) graph.cleared = false;
  graph.latex = latex || graph.latex;
  if (typeof src === "string" && src.trim()) graph.src = src;
  if (typeof deg === "boolean") graph.deg = deg;
  if (graph.mode === "desmos" && graph.instance) {
    try {
      graph.instance.updateSettings({ degreeMode: graph.deg });
    } catch (e) {}
    if (graph.cleared) return;
    graph.instance.setExpression({
      id: "bc-f",
      latex: graph.latex,
      color: "#2f74b5",
      lineWidth: 3,
    });
  } else if (graph.mode === "canvas") {
    drawCanvas();
  }
}

function applyGraph() {
  if (graph.cleared) return;
  if (graph.mode === "desmos" && graph.instance) {
    graph.instance.setExpression({ id: "bc-f", latex: graph.latex, color: "#2f74b5", lineWidth: 3 });
  } else if (graph.mode === "canvas") {
    drawCanvas();
  }
}

function clearGraph() {
  graph.cleared = true;
  if (graph.mode === "desmos" && graph.instance) graph.instance.removeExpression({ id: "bc-f" });
  else drawCanvas(true);
}

function drawCanvas(blank) {
  const canvas = document.getElementById("plotCanvas");
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = Math.max(320, rect.width || 600), h = Math.max(280, rect.height || 420);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const light = document.documentElement.getAttribute("data-theme") === "light";
  const gridColor = "#e6e9ee";
  const axisColor = "#8b98a5";
  const textColor = "#5f6b76";
  const curveColor = "#2f74b5";

  const v = graph.canvasView;
  const X = (x) => (x - v.xmin) / (v.xmax - v.xmin) * w;
  const Y = (y) => h - (y - v.ymin) / (v.ymax - v.ymin) * h;

  // 网格
  const stepX = niceStep((v.xmax - v.xmin) / 10);
  const stepY = niceStep((v.ymax - v.ymin) / 8);
  ctx.lineWidth = 1;
  ctx.strokeStyle = gridColor;
  ctx.beginPath();
  for (let x = Math.ceil(v.xmin / stepX) * stepX; x <= v.xmax; x += stepX) {
    ctx.moveTo(X(x), 0); ctx.lineTo(X(x), h);
  }
  for (let y = Math.ceil(v.ymin / stepY) * stepY; y <= v.ymax; y += stepY) {
    ctx.moveTo(0, Y(y)); ctx.lineTo(w, Y(y));
  }
  ctx.stroke();

  // 坐标轴
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, Y(0)); ctx.lineTo(w, Y(0));
  ctx.moveTo(X(0), 0); ctx.lineTo(X(0), h);
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = "11px ui-monospace, monospace";
  ctx.fillText("x", w - 14, Y(0) - 6);
  ctx.fillText("y", X(0) + 6, 14);
  for (let x = Math.ceil(v.xmin / stepX) * stepX; x <= v.xmax; x += stepX) {
    if (Math.abs(x) > 1e-9) ctx.fillText(String(+x.toFixed(2)), X(x) + 3, Y(0) + 14);
  }

  if (blank || graph.cleared) return;
  // 优先用 app 传入的表达式；兜底读液晶屏文本（元素 id 是 calcExpr，不是 calcInput）。
  const expr = document.getElementById("calcExpr");
  const fromScreen = expr ? (expr.textContent || "").trim() : "";
  const raw = graph.src || fromScreen;
  let src = raw;
  try { src = window.BCCalc.graphSource ? window.BCCalc.graphSource(raw) : raw; } catch (e) {}
  if (!src) return;
  let f;
  try {
    f = window.BCCalc.compile(src, graph.deg, window.__bcAns);
  } catch (e) {
    return;
  }

  // 采样；遇到无定义/跳变就断线，避免画出渐近线的竖线
  ctx.strokeStyle = curveColor;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const N = Math.max(600, Math.round(w * 2));
  let prev = null;
  for (let i = 0; i <= N; i++) {
    const x = v.xmin + (v.xmax - v.xmin) * i / N;
    let y;
    try { y = f(x); } catch (e) { prev = null; continue; }
    if (!isFinite(y) || Math.abs(y) > (v.ymax - v.ymin) * 100) { prev = null; continue; }
    const px = X(x), py = Y(y);
    if (prev === null || Math.abs(py - prev) > h * 0.8) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
    prev = py;
  }
  ctx.stroke();
}

function niceStep(raw) {
  if (!(raw > 0)) return 1;
  const exp = Math.floor(Math.log10(raw));
  const base = Math.pow(10, exp);
  const n = raw / base;
  const mult = n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10;
  return mult * base;
}

function zoomCanvas(factor) {
  const v = graph.canvasView;
  const cx = (v.xmin + v.xmax) / 2, cy = (v.ymin + v.ymax) / 2;
  const halfX = (v.xmax - v.xmin) / 2 * factor;
  const halfY = (v.ymax - v.ymin) / 2 * factor;
  graph.canvasView = { xmin: cx - halfX, xmax: cx + halfX, ymin: cy - halfY, ymax: cy + halfY };
  drawCanvas();
}

function resetCanvas() {
  graph.canvasView = { xmin: -10, xmax: 10, ymin: -6, ymax: 6 };
  drawCanvas();
}

// 网络恢复后自动从 canvas 切回 Desmos（前提是因离线降级、且尚未成功连上）。
window.addEventListener("online", () => {
  if (graph.mode === "canvas" && graph.fromOffline && !graph.instance) {
    graph.fromOffline = false;
    graph.mode = "loading";
    initGraph();
  }
});

window.BCGraph = {
  init: initGraph,
  setExpression: setGraphExpression,
  clear: clearGraph,
  zoom: zoomCanvas,
  reset: resetCanvas,
  redraw: drawCanvas,
  get mode() { return graph.mode; },
};
