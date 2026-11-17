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
    if (window.BC && window.BC.ready) {
      res = window.BC.dispatch(payload);
    } else {
      const resp = await fetch("/api/compute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      res = await resp.json();
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
  $("themeToggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("bc-theme", next); } catch (e) {}
  });
  $("expr").addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); compute(); }
  });
}

syncControls();
initEvents();
