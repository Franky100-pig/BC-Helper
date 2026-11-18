"use strict";

const $ = (id) => document.getElementById(id);
const STORE = "bc-state-v1";

const EXAMPLES = {
  derivative: [
    { label: "乘积法则 (product rule)", expr: "x^2*sin(x)" },
    { label: "链式法则 (chain rule)", expr: "sin(x^2)" },
    { label: "指数链 (exponential chain)", expr: "e^(2x)" },
    { label: "对数函数 (logarithmic)", expr: "ln(x)" },
    { label: "三阶导 (higher order)", expr: "x^5", order: 3 },
  ],
  integral: [
    { label: "换元 (u-substitution)", expr: "x^2*sqrt(x^3+1)", method: "substitution" },
    { label: "分部 (integration by parts)", expr: "x*ln(x)", method: "parts" },
    { label: "三角 (trigonometric)", expr: "sin(x)^2*cos(x)" },
    { label: "定积分 (definite)", expr: "x^2", kind: "definite", lower: "0", upper: "2" },
    { label: "反正切 (arctangent)", expr: "1/(1+x^2)" },
  ],
};

const DEFAULT_STATE = {
  mode: "derivative",
  expr: "x^2*sin(x)+e^(2x)",
  order: 1,
  at: "",
  kind: "indefinite",
  method: "auto",
  lower: "0",
  upper: "2",
  showSteps: true,
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "{}");
    return Object.assign({}, DEFAULT_STATE, saved);
  } catch (e) {
    return Object.assign({}, DEFAULT_STATE);
  }
}
function saveState() {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
}
let state = loadState();

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function math(value) {
  if (!value) return "";
  const tex = value.latex || value.text || "";
  if (window.katex && tex) {
    try {
      return window.katex.renderToString(tex, { throwOnError: false, displayMode: false });
    } catch (e) {}
  }
  return escapeHtml(value.text || tex);
}

function renderExamples() {
  const box = $("examples");
  box.innerHTML = "";
  EXAMPLES[state.mode].forEach((ex) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = ex.label;
    btn.onclick = () => applyExample(ex);
    box.appendChild(btn);
  });
}

function applyExample(ex) {
  state.expr = ex.expr;
  if (ex.order !== undefined) state.order = ex.order;
  if (ex.at !== undefined) state.at = ex.at;
  if (ex.kind !== undefined) state.kind = ex.kind;
  if (ex.method !== undefined) state.method = ex.method;
  if (ex.lower !== undefined) state.lower = ex.lower;
  if (ex.upper !== undefined) state.upper = ex.upper;
  syncControls();
  saveState();
  compute();
}

function syncControls() {
  $("expr").value = state.expr;
  $("order").value = String(state.order);
  $("at").value = state.at;
  $("kind").value = state.kind;
  $("method").value = state.method;
  $("lower").value = state.lower;
  $("upper").value = state.upper;
  $("showSteps").checked = !!state.showSteps;
  $("derivativeControls").hidden = state.mode !== "derivative";
  $("integralControls").hidden = state.mode !== "integral";
  $("boundsRow").hidden = state.kind !== "definite";
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === state.mode);
  });
  renderExamples();
}

function setMode(mode) {
  state.mode = mode;
  syncControls();
  saveState();
}

function renderSteps(steps) {
  const box = $("stepsBox");
  if (!state.showSteps || !steps || !steps.length) { box.innerHTML = ""; return; }
  const html = steps.map((s) => {
    const indent = Math.min(s.depth || 0, 5) * 16;
    const formula = s.formula ? `<div class="formula">${escapeHtml(s.formula)}</div>` : "";
    const note = s.note ? `<div class="note">${escapeHtml(s.note)}</div>` : "";
    return `<div class="step" style="margin-left:${indent}px">
      <div class="rule">${escapeHtml(s.title)}</div>
      ${formula}
      <div class="flow">${math(s.before)}<span class="arrow">→</span>${math(s.after)}</div>
      ${note}
    </div>`;
  }).join("");
  box.innerHTML = `<div class="steps-title">解题步骤 (worked steps)</div>${html}`;
}

function renderError(message) {
  const ans = $("answerBox");
  ans.className = "answer error-box";
  ans.textContent = message;
  $("secondaryBox").hidden = true;
  $("stepsBox").innerHTML = "";
}

function renderResult(res) {
  if (!res.ok) { renderError(res.error.message); return; }
  const ans = $("answerBox");
  ans.className = "answer";
  ans.innerHTML = math(res.answer);
  const sec = $("secondaryBox");
  if (res.secondary) {
    sec.hidden = false;
    sec.innerHTML = "原表达式 / 中间结果：" + math(res.secondary);
  } else {
    sec.hidden = true;
    sec.innerHTML = "";
  }
  renderSteps(res.steps);
}

async function compute() {
  const expr = $("expr").value.trim();
  const payload = { op: state.mode, expr };
  if (state.mode === "derivative") {
    payload.order = Number($("order").value);
    payload.at = $("at").value.trim();
  } else {
    payload.kind = $("kind").value;
    payload.method = $("method").value;
    if (payload.kind === "definite") {
      payload.lower = $("lower").value.trim();
      payload.upper = $("upper").value.trim();
    }
  }
  $("answerBox").className = "answer placeholder";
  $("answerBox").textContent = "计算中…";
  $("stepsBox").innerHTML = "";
  try {
    let res;
    if (window.BC && window.BC.ready && window.BC.dispatch) {
      res = await window.BC.dispatch(payload);
    } else {
      // SymPy 在后台线程启动，页面不会卡；没就绪时给明确提示，
      // 引导到纯 JS 的考场模式（不依赖 SymPy，离线也能用）。
      renderError("推导引擎还在后台加载（首次约十几秒，之后自动秒开）。" +
        "页面可继续用「考场模式」算数值，或稍后点「计算」重试。");
      return;
    }
    renderResult(res);
  } catch (err) {
    renderError("计算失败：" + err.message);
  }
}

function collectState() {
  state.expr = $("expr").value;
  state.order = Number($("order").value);
  state.at = $("at").value;
  state.kind = $("kind").value;
  state.method = $("method").value;
  state.lower = $("lower").value;
  state.upper = $("upper").value;
  state.showSteps = $("showSteps").checked;
  saveState();
}

const THEME_STORE = "bc-theme";

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  try { localStorage.setItem(THEME_STORE, next); } catch (e) {}
  if (window.BCGraph) window.BCGraph.redraw();
}

/* ---------------- 考场模式：991 风格计算器 + Desmos ---------------- */
const EXAM_STORE = "bc-exam-v1";
const DEFAULT_EXAM = { expr: "sin(30)", deg: true, frac: false, ans: 0, result: "0", view: "study" };

function loadExam() {
  try { return Object.assign({}, DEFAULT_EXAM, JSON.parse(localStorage.getItem(EXAM_STORE) || "{}")); }
  catch (e) { return Object.assign({}, DEFAULT_EXAM); }
}
let exam = loadExam();
let graphInited = false;

function saveExam() {
  try { localStorage.setItem(EXAM_STORE, JSON.stringify(exam)); } catch (e) {}
}

function examExpr() { return $("calcExpr").textContent.trim() || "0"; }

function updateExamScreen() {
  $("calcExpr").textContent = exam.expr || "0";
  $("angleInd").textContent = exam.deg ? "DEG" : "RAD";
  if ($("graphAngle")) $("graphAngle").textContent = exam.deg ? "DEG" : "RAD";
  $("fmtInd").textContent = exam.frac ? "D/C" : "F";
  $("ansInd").textContent = window.__bcAns == null ? "0" : String(window.__bcAns).slice(0, 14);
}

function equalPress() {
  const res = window.BCCalc.evaluate(exam.expr, {
    deg: exam.deg, frac: exam.frac, ans: window.__bcAns,
  });
  const out = $("calcResult");
  if (res.ok) {
    out.className = "result";
    out.textContent = res.text;
    window.__bcAns = res.value;
    exam.ans = res.value;
    exam.result = res.text;
    saveExam();
    if (graphInited) {
      try {
        window.BCGraph.setExpression(window.BCCalc.graphLatex(exam.expr), exam.deg, exam.expr);
      } catch (e) {}
    }
  } else {
    out.className = "result error";
    const msg = res.error.indexOf("x 赋值") !== -1
      ? "含变量 x · 试试 d/dx(函数, 点) 或 ∫(函数, 下限, 上限)"
      : "Error · " + res.error;
    out.textContent = msg;
    exam.result = msg;
    saveExam();
  }
  updateExamScreen();
}

/* 切角度 / 分数格式后，把当前表达式按新模式重算一遍，
 * 否则计算器和 Desmos 会显示不同单位下的两个结果（用户截图里的 DEG/RAD 不一致）。 */
function hasAnsRef() { return /\bans\b/i.test(exam.expr || ""); }

// 返回 "ok" / "ans" / "invalid"：含 Ans 的表达式不能自动重算，
// 否则会把上一次结果又喂回去，Ans 变成 6→7→8 这种自增。
function recomputeCurrent() {
  if (hasAnsRef()) return "ans";
  if (!window.BCCalc || typeof window.BCCalc.evaluate !== "function") return "invalid";
  const probe = window.BCCalc.evaluate(exam.expr, {
    deg: exam.deg, frac: exam.frac, ans: window.__bcAns,
  });
  if (!probe.ok) return "invalid";
  equalPress();
  return "ok";
}

function insertText(text) {
  if (exam.expr === "0" || exam.expr === "") exam.expr = "";
  exam.expr += text;
  saveExam();
  updateExamScreen();
}

function examKey(action) {
  if (action === "clear") {
    exam.expr = ""; window.__bcAns = 0; exam.result = "0";
    $("calcResult").className = "result";
    $("calcResult").textContent = "0";
    saveExam(); updateExamScreen();
  } else if (action === "del") {
    exam.expr = exam.expr.slice(0, -1);
    saveExam(); updateExamScreen();
  } else if (action === "equals") {
    equalPress();
  } else if (action === "angle") {
    exam.deg = !exam.deg; saveExam(); updateExamScreen();
    if (graphInited && window.BCGraph) window.BCGraph.setExpression(null, exam.deg, exam.expr);
    const state = recomputeCurrent();
    const detail = state === "ok" ? " · 当前表达式已按新单位重算"
      : state === "ans" ? " · 含 Ans 的表达式按 = 重新计算"
      : " · 表达式未算完，按 = 重新计算";
    graphStatus("已切到 " + (exam.deg ? "DEG" : "RAD") + detail, state === "ok" ? "ok" : "warn");
  } else if (action === "frac") {
    exam.frac = !exam.frac; saveExam(); updateExamScreen();
    const state = recomputeCurrent();
    if (state !== "ok") {
      graphStatus(state === "ans" ? "含 Ans 的表达式按 = 刷新结果"
        : "显示格式已切换 · 按 = 刷新结果", "warn");
    }
  }
}

function switchView(view) {
  // 从讲义切走时清掉 #notes/<id>，否则刷新会被旧 hash 强行带回讲义页。
  if (view !== "notes" && noteIdFromHash()) {
    history.replaceState(null, "", location.pathname + location.search);
  }
  exam.view = view;
  saveExam();
  $("viewStudy").hidden = view !== "study";
  $("viewExam").hidden = view !== "exam";
  $("viewNotes").hidden = view !== "notes";
  document.querySelectorAll(".view-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.view === view);
  });
  if (view === "exam") {
    updateExamScreen();
    if (!graphInited && window.BCGraph) {
      graphInited = true;
      window.BCGraph.init();
    }
    if (graphInited && window.BCGraph && window.BCCalc) {
      try { window.BCGraph.setExpression(window.BCCalc.graphLatex(exam.expr), exam.deg, exam.expr); } catch (e) {}
    }
  }
  if (view === "notes") renderNotesPage();
}

function graphStatus(msg, kind) {
  const el = $("graphStatus");
  if (!el) return;
  el.textContent = msg;
  el.className = "graph-status " + (kind || "");
}

function initExamEvents() {
  document.querySelectorAll(".view-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchView(tab.dataset.view));
  });
  $("calcKeys").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.ins !== undefined) insertText(btn.dataset.ins);
    else if (btn.dataset.act) examKey(btn.dataset.act);
  });
  document.addEventListener("keydown", (e) => {
    if ($("viewExam").hidden) return;
    if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const map = { "*": "*", "/": "/", "-": "-", "+": "+", "^": "^", "(": "(", ")": ")", ",": "," };
    if (/^[0-9.x]$/.test(e.key)) insertText(e.key);
    else if (map[e.key]) insertText(map[e.key]);
    else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equalPress(); }
    else if (e.key === "Backspace") { e.preventDefault(); examKey("del"); }
    else if (e.key === "Escape") examKey("clear");
  });
  $("plotNow").addEventListener("click", () => {
    if (!window.BCGraph) return;
    if (!exam.expr || !exam.expr.trim()) {
      graphStatus("请先输入表达式再画图", "warn");
      return;
    }
    try {
      window.BCGraph.setExpression(window.BCCalc.graphLatex(exam.expr), exam.deg, exam.expr);
      graphStatus("已绘制 " + exam.expr, "ok");
    } catch (e) {
      graphStatus("这个表达式暂时画不了：" + e.message, "warn");
    }
  });
  $("graphClear").addEventListener("click", () => {
    window.BCGraph.clear();
    graphStatus("已清空图像", "");
  });
  $("plotIn").addEventListener("click", () => window.BCGraph.zoom(0.6));
  $("plotOut").addEventListener("click", () => window.BCGraph.zoom(1.6));
  $("plotReset").addEventListener("click", () => window.BCGraph.reset());
  $("themeToggleExam").addEventListener("click", toggleTheme);
}

window.__bcAns = exam.ans || 0;

function initEvents() {
  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });
  ["expr", "order", "at", "kind", "method", "lower", "upper", "showSteps"].forEach((id) => {
    $(id).addEventListener("change", () => {
      collectState();
      if (id === "kind") syncControls();
    });
  });
  $("expr").addEventListener("input", collectState);
  $("compute").addEventListener("click", compute);
  $("printPdf").addEventListener("click", () => window.print());
  $("themeToggle").addEventListener("click", toggleTheme);
  $("expr").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); compute(); }
  });
}

/* ---------------- 小讲义：数据驱动的分篇导航 ----------------
 * 数据见 notes.js（window.BC_NOTES），结构仿 LA-Helper。
 * 左侧分类目录 + 右侧正文，hash = #notes/<id> 可分享、可前进后退。 */
const NOTES = window.BC_NOTES;
let currentNote = null;

function noteIdFromHash() {
  const m = /^#notes\/([\w-]+)$/.exec(location.hash || "");
  return m ? m[1] : null;
}

function renderNotesNav(activeId) {
  const nav = $("notesNav");
  if (!nav || !NOTES) return;
  nav.innerHTML = NOTES.byCat().map((cat) => {
    const items = cat.items.map((a) =>
      `<button type="button" class="note-nav${a.id === activeId ? " active" : ""}" data-note="${a.id}">` +
      `${escapeHtml(a.title)}<small>${escapeHtml(a.tag)}</small></button>`
    ).join("");
    return `<div class="note-cat"><div class="note-cat-label">${escapeHtml(cat.label)}</div>${items}</div>`;
  }).join("");
  nav.querySelectorAll(".note-nav").forEach((btn) => {
    btn.addEventListener("click", () => openNote(btn.dataset.note));
  });
}

function renderNoteArticle(id) {
  const box = $("notesArticle");
  if (!box || !NOTES) return;
  const a = NOTES.find(id);
  if (!a) {
    box.innerHTML = "<h2>小讲义</h2><p class='note-lead'>从左侧选一篇开始读。</p>";
    return;
  }
  box.innerHTML =
    `<h2>${escapeHtml(a.title)}</h2>` +
    `<span class="note-tag">${escapeHtml(a.tag)}</span>` +
    `<p class="note-lead">${a.lead}</p>` +
    NOTES.blocksHtml(a.blocks);
  // Unit 总览里的「已覆盖 · 阅读」按钮跳到对应讲义
  box.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => openNote(btn.dataset.jump));
  });
  renderNotesMath();
}

function openNote(id, updateHash) {
  if (!NOTES || !NOTES.find(id)) return;
  currentNote = id;
  renderNotesNav(id);
  renderNoteArticle(id);
  if (updateHash !== false && noteIdFromHash() !== id) {
    history.pushState(null, "", "#notes/" + id);
  }
}

function renderNotesPage() {
  if (!NOTES) return;
  const fromHash = noteIdFromHash();
  const id = fromHash && NOTES.find(fromHash) ? fromHash : (currentNote || NOTES.articles[0].id);
  openNote(id, false);
}

/* 讲义里的静态公式：app.js 普通 script 比 defer 的 KaTeX 先执行，
 * 切篇后新插入的公式也要重新渲染，所以用 data-rendered 标记。 */
function renderNotesMath() {
  const nodes = document.querySelectorAll("#viewNotes .tex, #viewNotes .tex-display");
  if (!nodes.length) return true;
  if (!window.katex) return false;
  nodes.forEach((el) => {
    if (el.dataset.rendered) return;
    try {
      window.katex.render(el.textContent, el, {
        throwOnError: false,
        displayMode: el.classList.contains("tex-display"),
      });
      el.dataset.rendered = "1";
    } catch (e) {}
  });
  return true;
}

// 讲义默认选中第一篇，供切到 Notes 视图时展示。
if (NOTES && NOTES.articles.length) currentNote = NOTES.articles[0].id;

syncControls();
initEvents();
initExamEvents();
updateExamScreen();
// 上次的计算结果直接恢复，避免屏幕显示 0、Ans 却是上次数值的错位。
if (exam.result && exam.result !== "0") {
  const saved = $("calcResult");
  saved.textContent = exam.result;
  saved.className = /^Error|含变量/.test(exam.result) ? "result error" : "result";
}
// 带 #notes/<id> 直接打开，或上次停在讲义页时，恢复讲义视图。
if (noteIdFromHash() || exam.view === "notes") switchView("notes");
else if (exam.view === "exam") switchView("exam");

// 浏览器前进/后退时，若停留在讲义视图则跟着 hash 切篇。
window.addEventListener("popstate", () => {
  if ($("viewNotes").hidden) return;
  const id = noteIdFromHash();
  if (id && NOTES && NOTES.find(id)) { currentNote = id; renderNotesPage(); }
});

let notesMathTries = 0;
const notesMathTimer = setInterval(() => {
  if (renderNotesMath() || ++notesMathTries > 40) clearInterval(notesMathTimer);
}, 150);
