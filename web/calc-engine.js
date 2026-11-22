/* calc-engine.js — 考场模式用的纯前端数值引擎（无网络、无 Python）。
 * 支持隐式乘法、DEG/RAD、Ans、d/dx(f,a) 与 ∫(f,a,b) 数值计算，
 * 同时能把表达式转成 Desmos 可接受的 LaTeX。Node 下可 require 做测试。
 */
(function (global) {
  "use strict";

  const t = (s) => (global.BC_I18N ? global.BC_I18N.t(s) : s);

  const FUNCS = {
    sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1,
    sinh: 1, cosh: 1, tanh: 1, ln: 1, log: 1, sqrt: 1,
    abs: 1, exp: 1, floor: 1, ceil: 1, round: 1, sign: 1,
  };
  function isFunc(name) {
    return Object.prototype.hasOwnProperty.call(FUNCS, name);
  }

  function tokenize(src) {
    const s = String(src == null ? "" : src);
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }

      if (/[0-9.]/.test(c)) {
        let j = i, dots = 0;
        while (j < s.length && (/[0-9]/.test(s[j]) || (s[j] === "." && dots++ === 0))) j++;
        if (j === i) { i++; continue; }
        if (s[j] === ".") throw new Error(t("小数点重复：") + s.slice(i, j + 1));
        if (j < s.length && (s[j] === "e" || s[j] === "E")) {
          let k = j + 1;
          if (s[k] === "+" || s[k] === "-") k++;
          if (k < s.length && /[0-9]/.test(s[k])) {
            while (k < s.length && /[0-9]/.test(s[k])) k++;
            j = k;
          }
        }
        out.push({ type: "num", v: parseFloat(s.slice(i, j)) });
        i = j;
        continue;
      }

      if (s.slice(i, i + 4).toLowerCase() === "d/dx") {
        out.push({ type: "op", v: "d/dx" }); i += 4; continue;
      }
      if (s.slice(i, i + 3).toLowerCase() === "int" && s[i + 3] === "(") {
        out.push({ type: "op", v: "∫" }); i += 3; continue;
      }
      if (/[A-Za-zπ]/.test(c)) {
        if (c === "π") { out.push({ type: "id", v: "pi" }); i++; continue; }
        let j = i;
        while (j < s.length && /[A-Za-z]/.test(s[j])) j++;
        out.push({ type: "id", v: s.slice(i, j).toLowerCase() });
        i = j;
        continue;
      }

      const ops = { "×": "*", "÷": "/", "−": "-", "^": "^", "+": "+", "-": "-", "*": "*", "/": "/", "(": "(", ")": ")", ",": ",", "!": "!", "∫": "∫" };
      if (s.slice(i, i + 2) === "**") { out.push({ type: "op", v: "^" }); i += 2; continue; }
      const ch = ops[c];
      if (ch) { out.push({ type: "op", v: ch }); i++; continue; }
      throw new Error(t("无法识别的符号：") + c);
    }

    // 隐式乘法：2x / 3(4+5) / (x+1)(x-1) / 2pi。函数名后面不插入。
    const withMul = [];
    const endsValue = (t) => t && (t.type === "num" || t.type === "id" || (t.type === "op" && (t.v === ")" || t.v === "!")));
    const startsValue = (t) => t && (t.type === "num" || t.type === "id" || (t.type === "op" && t.v === "("));
    for (const t of out) {
      const prev = withMul[withMul.length - 1];
      if (endsValue(prev) && startsValue(t) && !(prev.type === "id" && isFunc(prev.v))) {
        withMul.push({ type: "op", v: "*" });
      }
      withMul.push(t);
    }
    withMul.push({ type: "eof" });
    return withMul;
  }

  const BP = { "+": 10, "-": 10, "*": 20, "/": 20, "^": 40 };

  function parse(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const take = () => tokens[pos++];

    function argsUntilClose() {
      const args = [];
      if (peek() && peek().type === "op" && peek().v === ")") { take(); return args; }
      args.push(expr());
      while (peek() && peek().type === "op" && peek().v === ",") { take(); args.push(expr()); }
      if (!peek() || peek().v !== ")") throw new Error(t("缺少右括号 )"));
      take();
      return args;
    }

    function expr(minBp) {
      let left = nud();
      while (true) {
        const t = peek();
        if (!t || t.type === "eof") break;
        if (t.type === "op" && t.v === "!") { take(); left = { t: "un", op: "!", v: left }; continue; }
        if (t.type !== "op" || !Object.prototype.hasOwnProperty.call(BP, t.v)) break;
        const bp = BP[t.v];
        if (bp < minBp) break;
        take();
        const right = expr(t.v === "^" ? bp : bp + 1);
        left = { t: "bin", op: t.v, l: left, r: right };
      }
      return left;
    }

    function nud() {
      const t = take();
      if (!t || t.type === "eof") throw new Error(t("表达式不完整"));
      if (t.type === "num") return { t: "num", v: t.v };
      if (t.type === "id") {
        const name = t.v;
        if (isFunc(name)) {
          if (peek() && peek().type === "op" && peek().v === "(") { take(); return { t: "call", name, args: argsUntilClose() }; }
          return { t: "call", name, args: [expr(35)] }; // sin30 / sin x^2
        }
        return { t: "var", v: name };
      }
      if (t.type === "op") {
        if (t.v === "d/dx" || t.v === "∫") {
          if (!peek() || peek().v !== "(") {
            throw new Error(t.v === "d/dx" ? t("用法：d/dx(函数, x的值)") : t("用法：∫(函数, 下限, 上限)"));
          }
          take();
          const args = argsUntilClose();
          const need = t.v === "d/dx" ? 2 : 3;
          if (args.length !== need) {
            throw new Error(t.v === "d/dx" ? t("d/dx 需要 2 个参数：d/dx(f, a)") : t("∫ 需要 3 个参数：∫(f, a, b)"));
          }
          return t.v === "d/dx"
            ? { t: "deriv", fn: args[0], a: args[1] }
            : { t: "integ", fn: args[0], a: args[1], b: args[2] };
        }
        if (t.v === "(") {
          const inner = expr();
          if (!peek() || peek().v !== ")") throw new Error(t("缺少右括号 )"));
          take();
          return inner;
        }
        if (t.v === "-" || t.v === "+") {
          const v = expr(30);
          return t.v === "-" ? { t: "un", op: "-", v } : v;
        }
      }
      throw new Error(t("无法解析：") + (t.v || "?"));
    }

    const ast = expr();
    if (peek() && peek().type !== "eof") throw new Error(t("多余的符号：") + (peek().v || ""));
    return ast;
  }

  function numericDerivative(f, x) {
    const h = 1e-5 * Math.max(1, Math.abs(x));
    const v = (-f(x + 2 * h) + 8 * f(x + h) - 8 * f(x - h) + f(x - 2 * h)) / (12 * h);
    if (!isFinite(v)) throw new Error(t("该点导数不存在"));
    return v;
  }

  function integrate(f, a, b) {
    if (a === b) return 0;
    let guard = 0;
    const fa = f(a), fb = f(b), c = (a + b) / 2, fc = f(c);
    if (![fa, fb, fc].every(isFinite)) throw new Error(t("积分区间内函数无定义"));
    const whole = (b - a) / 6 * (fa + 4 * fc + fb);
    function rec(a, b, fa, fb, fc, prev, eps) {
      if (++guard > 20000) return prev;
      const c = (a + b) / 2, d = (a + c) / 2, e = (c + b) / 2;
      const fd = f(d), fe = f(e);
      if (!isFinite(fd) || !isFinite(fe)) throw new Error(t("积分区间内函数无定义"));
      const left = (c - a) / 6 * (fa + 4 * fd + fc);
      const right = (b - c) / 6 * (fc + 4 * fe + fb);
      if (Math.abs(left + right - prev) <= 15 * eps) return left + right + (left + right - prev) / 15;
      return rec(a, c, fa, fc, fd, left, eps / 2) + rec(c, b, fc, fb, fe, right, eps / 2);
    }
    const result = rec(a, b, fa, fb, fc, whole, 1e-9);
    if (!isFinite(result)) throw new Error(t("积分结果不是有限数"));
    return result;
  }

  function evalAst(n, env) {
    switch (n.t) {
      case "num": return n.v;
      case "var": {
        if (n.v === "x") {
          if (env.x === undefined || env.x === null) throw new Error(t("这里需要给 x 赋值"));
          return env.x;
        }
        if (n.v === "pi") return Math.PI;
        if (n.v === "e") return Math.E;
        if (n.v === "ans") {
          if (env.ans === undefined) throw new Error(t("还没有 Ans 值"));
          return env.ans;
        }
        throw new Error(t("未知变量：") + n.v);
      }
      case "un": {
        const v = evalAst(n.v, env);
        if (n.op === "-") return -v;
        const k = Math.round(v);
        if (k !== v || k < 0 || k > 170) throw new Error(t("阶乘只支持 0 到 170 的整数"));
        let out = 1;
        for (let i = 2; i <= k; i++) out *= i;
        return out;
      }
      case "bin": {
        const l = evalAst(n.l, env), r = evalAst(n.r, env);
        switch (n.op) {
          case "+": return l + r;
          case "-": return l - r;
          case "*": return l * r;
          case "/": if (r === 0) throw new Error(t("不能除以 0")); return l / r;
          case "^": {
            const v = Math.pow(l, r);
            if (!isFinite(v) && isFinite(l) && isFinite(r)) throw new Error(t("幂运算超出范围"));
            return v;
          }
        }
        throw new Error(t("未知运算：") + n.op);
      }
      case "call": {
        const v = evalAst(n.args[0], env);
        const rad = env.deg ? v * Math.PI / 180 : v;
        const back = (y) => env.deg ? y * 180 / Math.PI : y;
        switch (n.name) {
          case "sin": return Math.sin(rad);
          case "cos": return Math.cos(rad);
          case "tan": {
            // DEG 下 90+180k 是渐近线；RAD 下用 cos≈0 判断（此时输入本身就是弧度）
            const atPole = env.deg
              ? Math.abs((((v % 180) + 180) % 180) - 90) < 1e-10
              : Math.abs(Math.cos(rad)) < 1e-12;
            if (atPole) throw new Error("正切函数在该角度无定义");
            return Math.tan(rad);
          }
          case "asin":
            if (v < -1 || v > 1) throw new Error(t("反正弦的参数必须在 -1 到 1 之间"));
            return back(Math.asin(v));
          case "acos":
            if (v < -1 || v > 1) throw new Error(t("反余弦的参数必须在 -1 到 1 之间"));
            return back(Math.acos(v));
          case "atan": return back(Math.atan(v));
          case "sinh": return Math.sinh(v);
          case "cosh": return Math.cosh(v);
          case "tanh": return Math.tanh(v);
          case "ln":
            if (v <= 0) throw new Error(t("对数的参数必须为正数"));
            return Math.log(v);
          case "log":
            if (v <= 0) throw new Error(t("对数的参数必须为正数"));
            return Math.log10(v);
          case "sqrt": if (v < 0) throw new Error(t("平方根的参数不能为负")); return Math.sqrt(v);
          case "abs": return Math.abs(v);
          case "exp": return Math.exp(v);
          case "floor": return Math.floor(v);
          case "ceil": return Math.ceil(v);
          case "round": return Math.round(v);
          case "sign": return Math.sign(v);
        }
        throw new Error(t("未知函数：") + n.name);
      }
      case "deriv": {
        const x0 = evalAst(n.a, { deg: env.deg, ans: env.ans });
        return numericDerivative((x) => evalAst(n.fn, { x, deg: env.deg, ans: env.ans }), x0);
      }
      case "integ": {
        const a = evalAst(n.a, { deg: env.deg, ans: env.ans });
        const b = evalAst(n.b, { deg: env.deg, ans: env.ans });
        return integrate((x) => evalAst(n.fn, { x, deg: env.deg, ans: env.ans }), a, b);
      }
    }
    throw new Error(t("无法计算的表达式"));
  }

  function toFraction(x, maxDen) {
    maxDen = maxDen || 1000;
    const sign = x < 0 ? -1 : 1;
    const target = Math.abs(x);
    let h0 = 0, h1 = 1, k0 = 1, k1 = 0, b = target;
    for (let i = 0; i < 40; i++) {
      const a = Math.floor(b);
      const h = a * h1 + h0, k = a * k1 + k0;
      if (k > maxDen) break;
      if (Math.abs(target - h / k) < 1e-10) {
        const whole = Math.floor(h / k), rem = h % k;
        const prefix = sign < 0 ? "-" : "";
        if (rem === 0) return prefix + whole;
        return whole > 0 ? prefix + whole + " " + rem + "/" + k : prefix + rem + "/" + k;
      }
      h0 = h1; h1 = h; k0 = k1; k1 = k;
      const frac = b - a;
      if (frac < 1e-12) break;
      b = 1 / frac;
    }
    return null;
  }

  function format(value, frac) {
    if (typeof value !== "number" || !isFinite(value)) return String(value);
    if (frac) {
      const f = toFraction(value);
      if (f !== null) return f;
    }
    if (value !== 0 && (Math.abs(value) >= 1e10 || Math.abs(value) < 1e-6)) {
      return value.toExponential(6).replace(/\.?0+e/, "e");
    }
    return String(Number(value.toPrecision(11)));
  }

  function evaluate(src, opts) {
    opts = opts || {};
    try {
      const ast = parse(tokenize(src));
      const value = evalAst(ast, { x: opts.x, deg: !!opts.deg, ans: opts.ans });
      if (typeof value !== "number" || !isFinite(value)) throw new Error(t("结果不是有限数"));
      return { ok: true, value: value, text: format(value, !!opts.frac), ast: ast };
    } catch (err) {
      return { ok: false, error: err && err.message ? err.message : String(err) };
    }
  }

  function compile(src, deg, ans) {
    const ast = parse(tokenize(src));
    return function (x) { return evalAst(ast, { x: x, deg: !!deg, ans: ans }); };
  }

  function wrap(n) {
    const s = nodeLatex(n);
    if (n.t === "num" && n.v >= 0) return s;
    if (n.t === "var") return s;
    return "\\left(" + s + "\\right)";
  }

  function nodeLatex(n) {
    switch (n.t) {
      case "num": return String(n.v);
      case "var": return n.v === "pi" ? "\\pi" : n.v === "e" ? "e" : n.v === "ans" ? "\\mathrm{ans}" : n.v;
      case "un": return n.op === "-" ? "-" + wrap(n.v) : wrap(n.v) + "!";
      case "bin": {
        const l = nodeLatex(n.l), r = nodeLatex(n.r);
        if (n.op === "/") return "\\frac{" + l + "}{" + r + "}";
        if (n.op === "*") {
          // 数×变量/简单项写成 2x 更接近手写；其余用 \cdot 保证清晰
          if (n.l.t === "num") return l + nodeLatex(n.r);
          return wrap(n.l) + "\\cdot " + wrap(n.r);
        }
        if (n.op === "^") return wrap(n.l) + "^{" + r + "}";
        return l + (n.op === "-" ? "-" : "+") + (n.op === "-" ? nodeLatex(n.r) : r);
      }
      case "call": {
        const names = { sin: "\\sin", cos: "\\cos", tan: "\\tan", asin: "\\arcsin", acos: "\\arccos", atan: "\\arctan", ln: "\\ln", log: "\\log", sinh: "\\sinh", cosh: "\\cosh", tanh: "\\tanh" };
        const a = n.args[0];
        if (n.name === "sqrt") return "\\sqrt{" + nodeLatex(a) + "}";
        if (n.name === "abs") return "\\left|" + nodeLatex(a) + "\\right|";
        if (n.name === "exp") return "e^{" + nodeLatex(a) + "}";
        if (n.name === "floor") return "\\lfloor " + nodeLatex(a) + " \\rfloor";
        if (n.name === "ceil") return "\\lceil " + nodeLatex(a) + " \\rceil";
        if (n.name === "round") return "\\mathrm{round}\\left(" + nodeLatex(a) + "\\right)";
        if (n.name === "sign") return "\\mathrm{sgn}\\left(" + nodeLatex(a) + "\\right)";
        return (names[n.name] || n.name) + "\\left(" + n.args.map(nodeLatex).join(",") + "\\right)";
      }
      case "deriv": return "\\frac{d}{dx}" + wrap(n.fn);
      case "integ": return "\\int_{" + nodeLatex(n.a) + "}^{" + nodeLatex(n.b) + "}" + wrap(n.fn) + "dx";
    }
    return "";
  }

  // 从 d/dx(f,a) / ∫(f,a,b) 中取出可画曲线的内层函数 f（按括号深度切分，避免 f 内含逗号出错）。
  function graphSource(src) {
    const s = String(src == null ? "" : src).trim();
    const m = /^(?:d\/dx|∫|int)\s*\(/i.exec(s);
    if (!m) return s;
    let depth = 0;
    for (let i = m[0].length - 1; i < s.length; i++) {
      const c = s[i];
      if (c === "(") depth++;
      else if (c === ")") { depth--; if (depth === 0) return s.slice(m[0].length, i).split(",")[0].trim(); }
      else if (c === "," && depth === 1) return s.slice(m[0].length, i).trim();
    }
    return s;
  }

  function graphLatex(src) {
    const ast = parse(tokenize(src));
    const target = ast.t === "deriv" || ast.t === "integ" ? ast.fn : ast;
    return nodeLatex(target);
  }

  const api = {
    tokenize: tokenize, parse: parse, evaluate: evaluate, compile: compile,
    format: format, nodeLatex: nodeLatex, graphLatex: graphLatex, graphSource: graphSource,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else global.BCCalc = api;
})(typeof window !== "undefined" ? window : globalThis);
