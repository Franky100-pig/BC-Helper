"use strict";
/* 界面文案字典：中文是源语言，英文按「中文原句 → English」映射。
 * 用法：?lang=en 或 localStorage bc-lang 切换；默认中文。
 * 静态 HTML 加 data-i18n / data-i18n-placeholder / data-i18n-title，
 * 动态文案在各脚本里用 window.BC_I18N.t("中文原句") 包裹。 */
(function () {
  var STORE = "bc-lang";
  var DICT = {
    /* ---------- 顶部 / 视图 / 输入区 ---------- */
    "BC Helper · 微积分 BC 分步计算器": "BC Helper · AP Calculus BC step-by-step calculator",
    "微积分 BC 分步计算器 · 求导 (derivative) / 积分 (integral)": "AP Calculus BC step-by-step calculator · derivatives / integrals",
    "切换主题": "Theme",
    "切主题": "Theme",
    "分步计算": "Step-by-step",
    "考场模式": "Exam mode",
    "991 计算器 + Desmos": "991 calculator + Desmos",
    "小讲义": "Notes",
    "从左侧选一篇开始读。": "Pick an article from the left to start reading.",
    "推导引擎按需启动 · 点「计算」时才加载（首次约 20 秒，讲义和考场模式立即能用）": "Engine loads on demand · starts on first Calculate (about 20 seconds the first time; Notes and Exam mode work instantly)",
    "求导": "Derivative",
    "积分": "Integral",
    "输入": "Input",
    "标准排版预览 · Preview": "Typeset preview",
    "输入表达式后显示标准数学排版": "Typeset form appears here as you type",
    "阶数 (order)": "Order",
    "在 x = a 处求值（可留空）": "Evaluate at x = a (optional)",
    "例如 1 或 pi/2": "e.g. 1 or pi/2",
    "类型 (type)": "Type",
    "不定积分 (indefinite)": "Indefinite",
    "定积分 (definite)": "Definite",
    "方法偏好 (method)": "Method",
    "自动 (auto)": "Auto",
    "换元 (u-substitution)": "u-substitution",
    "分部 (integration by parts)": "Integration by parts",
    "下限 a": "Lower limit a",
    "上限 b": "Upper limit b",
    "显示分步推导 (show steps)": "Show worked steps",
    "支持 x、^、sin/cos/tan、e^x、ln(x)、sqrt(x)、pi；也接受 2x、sin x 这类省略写法。": "Supports x, ^, sin/cos/tan, e^x, ln(x), sqrt(x), pi; shorthand such as 2x and sin x also works.",
    "一键示例 (worked examples)": "Worked examples",
    "计算": "Calculate",
    "结果": "Result",
    "还没计算。填好左边，点「计算」。": "Nothing yet. Fill in the expression and press Calculate.",
    "导出 PDF": "Export PDF",
    "关键概念保留英文原名，方便对照课本。": "Key terms keep their English names to match your textbook.",
    "乘积法则 (product rule)": "Product rule",
    "链式法则 (chain rule)": "Chain rule",
    "指数链 (exponential chain)": "Exponential chain",
    "对数函数 (logarithmic)": "Logarithmic",
    "三阶导 (higher order)": "Third derivative",
    "三角 (trigonometric)": "Trigonometric",
    "定积分 (definite)": "Definite integral",
    "反正切 (arctangent)": "Arctangent",
    "极限": "Limit",
    "级数": "Series",
    "f(x) =": "f(x) =",
    "aₙ =": "a_n =",
    "趋近于 x → a": "Approach x → a",
    "例如 0、pi/2、oo、-oo": "e.g. 0, pi/2, oo, -oo",
    "方向 (side)": "Side",
    "双侧 (two-sided)": "Two-sided",
    "左侧 (left)": "Left",
    "右侧 (right)": "Right",
    "输入 oo 或 -oo 表示 ±∞；结果会给出收敛值、发散到 ±∞ 或极限不存在。": "Enter oo or -oo for ±∞; the result shows the limit, divergence to ±∞, or DNE.",
    "起始 n (start)": "Start index n",
    "通常填 1": "usually 1",
    "输入通项用 n，例如 1/n^2、(-1)^n/n、n/2^n；会按项判别、几何、p-级数、交错、比值、根值、积分判别依次尝试。": "Enter the general term using n, e.g. 1/n^2, (-1)^n/n, n/2^n; the engine tries nth-term, geometric, p-series, alternating, ratio, root and integral tests in order.",
    "可去间断 (removable)": "Removable discontinuity",
    "趋于无穷 (at infinity)": "At infinity",
    "洛必达 (L'Hôpital)": "L'Hôpital's rule",
    "发散到 ∞": "Diverges to ∞",
    "几何级数 (geometric)": "Geometric series",
    "p-级数 (p-series)": "p-series",
    "调和级数 (harmonic)": "Harmonic series",
    "交错级数 (alternating)": "Alternating series",
    "比值判别 (ratio test)": "Ratio test",
    "解题步骤 (worked steps)": "Worked steps",
    "原表达式 / 中间结果：": "Original / intermediate result: ",

    /* ---------- 计算过程提示 ---------- */
    "推导引擎脚本未加载，请刷新页面重试。": "Engine script failed to load; refresh and try again.",
    "首次计算：正在后台启动推导引擎，启动后会自动算出结果…": "First calculation: starting the engine in the background; your result will appear automatically…",
    "首次启动（": "First launch (",
    "%）：": "%): ",
    "计算中…": "Calculating…",
    "计算失败：": "Calculation failed: ",
    "x 赋值": "x assignment",
    "含变量 x · 试试 d/dx(函数, 点) 或 ∫(函数, 下限, 上限)": "Contains variable x · try d/dx(function, point) or ∫(function, lower, upper)",
    " · 当前表达式已按新单位重算": " · current expression recalculated in the new unit",
    " · 含 Ans 的表达式按 = 重新计算": " · press = to recalculate expressions containing Ans",
    " · 表达式未算完，按 = 重新计算": " · expression incomplete, press = to recalculate",
    "已切到 ": "Switched to ",
    "含 Ans 的表达式按 = 刷新结果": "Press = to refresh expressions containing Ans",
    "显示格式已切换 · 按 = 刷新结果": "Display format switched · press = to refresh the result",
    "请先输入表达式再画图": "Enter an expression before plotting",
    "已绘制 ": "Plotted ",
    "这个表达式暂时画不了：": "This expression cannot be plotted: ",
    "已清空图像": "Graph cleared",
    "{n} 人用 BC Helper 学微积分": "{n} people learning calculus with BC Helper",

    /* ---------- 考场模式 ---------- */
    "卡西欧风格计算器": "Casio-style calculator",
    "fx-991CN 风格": "fx-991CN style",
    "分数/小数": "Fraction / decimal",
    "点按键或直接敲键盘输入。": "Tap keys or type on your keyboard.",
    "d/dx(函数, x的值)": "d/dx(function, x-value)",
    "∫(函数, 下限, 上限)": "∫(function, lower, upper)",
    "切角度/弧度，": " switches degrees/radians, ",
    "切分数/小数。切换时会自动按新模式重算当前表达式（Ans 同步更新），图像右上角的角度徽标也会一起变，避免计算器和 Desmos 单位不一致。": " switches fraction/decimal. Switching recalculates the current expression in the new mode (Ans stays in sync), and the angle badge above the graph updates too, so the calculator and Desmos never disagree.",
    "函数图像 (Desmos)": "Graph (Desmos)",
    "画当前表达式": "Plot expression",
    "清空": "Clear",
    "进入考场模式后自动连接…": "Connects automatically when you open Exam mode…",
    "缩小": "Zoom out",
    "放大": "Zoom in",
    "复位": "Reset",
    "目录 · Contents": "Contents",
    "BC Helper · 本地计算，不上传任何表达式 · 引擎由 SymPy 驱动 · 首次访问后引擎缓存到浏览器，可离线使用": "BC Helper · Everything runs locally, no expressions are uploaded · Powered by SymPy · Cached in your browser after the first visit for offline use",

    /* ---------- 引擎 / worker 状态 ---------- */
    "✓ 引擎已装到浏览器 · ": "✓ Engine installed in your browser · ",
    " 个文件在本地，断网也能算": " files stored locally; works offline",
    "引擎已就绪，正在后台写入离线缓存…": "Engine ready; writing offline cache in the background…",
    "首次启动：正在把引擎装进浏览器（约 19 MB）…": "First launch: installing the engine in your browser (about 19 MB)…",
    " 超时": " timed out",
    "重试引擎": "Retry engine",
    "正在重新加载计算引擎…": "Reloading the calculation engine…",
    "推导引擎还在后台加载": "The engine is still loading in the background",
    "引擎加载失败：": "Engine failed to load: ",
    "引擎已就绪 · SymPy 在后台运行，页面不卡顿": "Engine ready · SymPy runs in the background, UI stays responsive",
    "未知错误": "Unknown error",
    "计算失败": "Calculation failed",
    "正在加载引擎脚本：": "Loading engine script: ",
    "本站": "this site",
    "无法加载 ": "Could not load ",
    "正在编译 Python 运行时（首次较慢）…": "Compiling the Python runtime (slow the first time)…",
    "正在加载 SymPy…": "Loading SymPy…",
    "引擎已就绪 · SymPy 在本地运行": "Engine ready · SymPy runs locally",
    "引擎初始化失败：": "Engine initialization failed: ",
    "后台引擎启动失败": "Background engine failed to start",
    "后台引擎不可用，正在退回主线程…": "Background engine unavailable; falling back to the main thread…",
    "正在后台启动计算引擎（页面可继续使用）…": "Starting the calculation engine in the background (page remains usable)…",
    "正在后台启动 Python 引擎（页面仍可正常使用）…": "Starting Python engine in the background (page remains usable)…",
    "正在加载引擎脚本…": "Loading engine script…",
    "正在后台编译 Python 运行时（首次较慢）…": "Compiling Python runtime in the background (slow the first time)…",
    "正在后台加载 SymPy…": "Loading SymPy in the background…",
    "正在初始化推导规则…": "Initializing differentiation/integration rules…",
    "推导规则就绪，正在连接…": "Rules ready; connecting…",
    "引擎尚未就绪": "Engine is not ready yet",

    /* ---------- 考场数值引擎错误 ---------- */
    "小数点重复：": "Repeated decimal point: ",
    "无法识别的符号：": "Unrecognized symbol: ",
    "缺少右括号 )": "Missing closing parenthesis )",
    "表达式不完整": "Incomplete expression",
    "用法：d/dx(函数, x的值)": "Usage: d/dx(function, x-value)",
    "用法：∫(函数, 下限, 上限)": "Usage: ∫(function, lower, upper)",
    "d/dx 需要 2 个参数：d/dx(f, a)": "d/dx needs 2 arguments: d/dx(f, a)",
    "∫ 需要 3 个参数：∫(f, a, b)": "∫ needs 3 arguments: ∫(f, a, b)",
    "无法解析：": "Cannot parse: ",
    "多余的符号：": "Unexpected symbol: ",
    "该点导数不存在": "Derivative does not exist at this point",
    "积分区间内函数无定义": "Function undefined over the integration interval",
    "积分结果不是有限数": "Integral is not finite",
    "这里需要给 x 赋值": "x must be assigned a value here",
    "还没有 Ans 值": "No Ans value yet",
    "未知变量：": "Unknown variable: ",
    "阶乘只支持 0 到 170 的整数": "Factorial only supports integers from 0 to 170",
    "不能除以 0": "Cannot divide by zero",
    "幂运算超出范围": "Exponentiation out of range",
    "未知运算：": "Unknown operation: ",
    "反正弦的参数必须在 -1 到 1 之间": "asin argument must be between -1 and 1",
    "反余弦的参数必须在 -1 到 1 之间": "acos argument must be between -1 and 1",
    "对数的参数必须为正数": "Logarithm argument must be positive",
    "平方根的参数不能为负": "Square root argument cannot be negative",
    "未知函数：": "Unknown function: ",
    "无法计算的表达式": "Expression cannot be evaluated",
    "结果不是有限数": "Result is not finite",
  };

  function fromQuery() {
    try {
      var m = /(?:^|[?&])lang=(zh|en)(?:&|$)/.exec(window.location.search || "");
      return m ? m[1] : null;
    } catch (e) { return null; }
  }
  function stored() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }
  var lang = fromQuery() || stored() || "zh";
  if (fromQuery()) {
    try { localStorage.setItem(STORE, lang); } catch (e) {}
  }

  var listeners = [];
  function getLang() { return lang; }
  function t(text) {
    if (lang !== "en" || typeof text !== "string") return text;
    return Object.prototype.hasOwnProperty.call(DICT, text) ? DICT[text] : text;
  }
  function apply(root) {
    var doc = root || (typeof document !== "undefined" ? document : null);
    if (!doc) return;
    if (doc.documentElement) {
      doc.documentElement.setAttribute("lang", lang === "en" ? "en" : "zh-CN");
    }
    if (lang === "en" && doc.title === "BC Helper · 微积分 BC 分步计算器") {
      doc.title = t(doc.title);
    }
    [["[data-i18n]", "textContent"], ["[data-i18n-placeholder]", "placeholder"],
     ["[data-i18n-title]", "title"]].forEach(function (pair) {
      Array.prototype.forEach.call(doc.querySelectorAll(pair[0]), function (el) {
        var key = el.getAttribute(pair[0].slice(1, -1));
        if (!key) {
          key = el.getAttribute("data-i18n") || el.getAttribute("data-i18n-placeholder") ||
                el.getAttribute("data-i18n-title") || el[pair[1]];
        }
        if (!key) return;
        if (lang === "en" || !Object.prototype.hasOwnProperty.call(el.dataset, "bcZh")) {
          el.dataset.bcZh = key;
        }
        el[pair[1]] = t(el.dataset.bcZh);
      });
    });
    var btn = doc.getElementById("langToggle");
    if (btn) btn.textContent = lang === "en" ? "中文" : "EN";
  }
  function setLang(next) {
    lang = next === "en" ? "en" : "zh";
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    try {
      var url = location.pathname + (lang === "en" ? "?lang=en" : "") + location.hash;
      history.replaceState(null, "", url);
    } catch (e) {}
    apply();
    listeners.slice().forEach(function (fn) { try { fn(lang); } catch (e) {} });
  }
  function onChange(fn) { if (typeof fn === "function") listeners.push(fn); }

  /* 说明文字里的 $...$ 片段用 KaTeX 排版。
   * 引擎只负责标记数学片段，中文/英文句子本身仍走普通文本，避免整段被当公式。 */
  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  var TEX_WORDS = {
    sqrt: "\\sqrt", ln: "\\ln", log: "\\log", sin: "\\sin",
    cos: "\\cos", tan: "\\tan", exp: "\\exp",
    oo: "\\infty", pi: "\\pi",
  };
  function normalizeTex(tex) {
    return String(tex).replace(/\b(sqrt|ln|log|sin|cos|tan|exp|oo|pi)\b/g,
      function (word) { return TEX_WORDS[word]; });
  }
  function mathText(text) {
    var parts = String(text == null ? "" : text).split("$");
    return parts.map(function (part, i) {
      if (i % 2 === 0) return escapeHtml(part);
      if (!part) return "";
      var tex = normalizeTex(part);
      if (window.katex) {
        try {
          return window.katex.renderToString(tex, { throwOnError: false, displayMode: false });
        } catch (e) {}
      }
      return escapeHtml(part);
    }).join("");
  }

  window.BC_I18N = {
    getLang: getLang, setLang: setLang, t: t, apply: apply, onChange: onChange,
    mathText: mathText, dict: DICT,
  };

  if (typeof document !== "undefined") {
    var init = function () {
      apply();
      var btn = document.getElementById("langToggle");
      if (btn && !btn.dataset.bound) {
        btn.dataset.bound = "1";
        btn.addEventListener("click", function () { setLang(lang === "en" ? "zh" : "en"); });
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})();
