"use strict";

/* 数值引擎测试：node tools/test_calc_engine.js（CI 与本地都能跑）。 */
const assert = require("assert");
const calc = require("../web/calc-engine.js");

let passed = 0;
function close(actual, expected, label, tol) {
  tol = tol || 1e-6;
  assert.ok(
    Math.abs(actual - expected) <= tol,
    label + ": 期望 " + expected + "，得到 " + actual
  );
  passed++;
}
function ok(res, label) {
  assert.ok(res.ok, label + ": " + (res.error || ""));
  passed++;
}
function bad(src, label, opts) {
  const res = calc.evaluate(src, opts);
  assert.ok(!res.ok, label + ": 本应失败却成功 → " + res.text);
  passed++;
}

// 基础运算与隐式乘法
close(calc.evaluate("2+3*4").value, 14, "优先级");
close(calc.evaluate("2(3+4)").value, 14, "隐式乘法-括号");
close(calc.evaluate("2x", { x: 5 }).value, 10, "隐式乘法-变量");
close(calc.evaluate("3pi").value, 3 * Math.PI, "隐式乘法-常量");
close(calc.evaluate("-2^2").value, -4, "一元负号与幂优先级");
close(calc.evaluate("2^3^2").value, 512, "幂右结合");
close(calc.evaluate("5!").value, 120, "阶乘");

// 函数与角度制
close(calc.evaluate("sin(30)", { deg: true }).value, 0.5, "DEG 正弦");
close(calc.evaluate("sin(pi/6)", { deg: false }).value, 0.5, "RAD 正弦");
close(calc.evaluate("sqrt(2)^2").value, 2, "平方根");
close(calc.evaluate("log(100)").value, 2, "常用对数");
close(calc.evaluate("ln(e)").value, 1, "自然对数");
close(calc.evaluate("asin(0.5)", { deg: true }).value, 30, "DEG 反正弦");

// Ans
close(calc.evaluate("ans+1", { ans: 41 }).value, 42, "Ans 记忆");

// d/dx
ok(calc.evaluate("d/dx(x^2,3)"), "导数-幂函数");
close(calc.evaluate("d/dx(x^2,3)").value, 6, "导数-幂函数值");
close(calc.evaluate("d/dx(sin(x),0)").value, 1, "导数-正弦");
close(calc.evaluate("d/dx(x^3+2x,1)").value, 5, "导数-多项式");

// ∫
ok(calc.evaluate("∫(x^2,0,1)"), "积分-幂函数");
close(calc.evaluate("∫(x^2,0,1)").value, 1 / 3, "积分-幂函数值");
close(calc.evaluate("∫(x,0,2)").value, 2, "积分-线性");
close(calc.evaluate("∫(sin(x),0,pi)").value, 2, "积分-正弦");
close(calc.evaluate("∫(1/x,1,e)").value, 1, "积分-对数");

// 分数 / 小数显示
assert.strictEqual(calc.evaluate("1/3").text, "0.33333333333", "小数显示");
assert.strictEqual(calc.evaluate("1/3", { frac: true }).text, "1/3", "分数显示");
assert.strictEqual(calc.evaluate("22/7", { frac: true }).text, "3 1/7", "分数显示-带分数");
assert.strictEqual(calc.evaluate("1.5", { frac: true }).text, "1 1/2", "分数显示-带分数2");
assert.strictEqual(calc.evaluate("sqrt(2)", { frac: true }).text, calc.evaluate("sqrt(2)").text, "无理数不硬凑分数");
passed += 5;

// 错误处理
bad("1/0", "除零");
bad("sqrt(-1)", "负数开方");
bad("d/dx(x^2)", "导数参数不足");
bad("sin(", "括号未闭合");

// Desmos LaTeX
assert.strictEqual(calc.graphLatex("x^2+2x"), "x^{2}+2x", "LaTeX-多项式");
assert.strictEqual(calc.graphLatex("sin(x)"), "\\sin\\left(x\\right)", "LaTeX-三角");
assert.strictEqual(calc.graphLatex("sqrt(x)"), "\\sqrt{x}", "LaTeX-根号");
assert.strictEqual(calc.graphLatex("d/dx(x^2,3)"), "x^{2}", "LaTeX-导数取内层函数");
passed += 4;

console.log("calc-engine: " + passed + " checks passed");
