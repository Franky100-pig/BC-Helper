"use strict";
/* 双语自检：语言切换、字典覆盖、界面/讲义英文化无残留中文。
 * 运行：node tools/test_i18n.js */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const WEB = path.join(__dirname, "..", "web");
const CJK = /[\u4e00-\u9fff]/;
const read = (name) => fs.readFileSync(path.join(WEB, name), "utf8");

// 在纯 Node 里加载 i18n.js（无 document，只测语言状态与字典）。
const sandbox = {
  window: { location: { search: "", hash: "", pathname: "/" } },
  location: { search: "", hash: "", pathname: "/" },
  history: { replaceState() {} },
  localStorage: { getItem: () => null, setItem() {} },
};
vm.createContext(sandbox);
vm.runInContext(read("i18n.js"), sandbox);
const I = sandbox.window.BC_I18N;
assert.ok(I, "i18n.js 未暴露 window.BC_I18N");
assert.equal(I.getLang(), "zh", "默认应为中文优先");
assert.equal(I.t("计算"), "计算");
I.setLang("en");
assert.equal(I.getLang(), "en");
assert.equal(I.t("计算"), "Calculate", "英文模式应翻译动态文案");
assert.equal(I.t("这个字典里没有"), "这个字典里没有", "缺项应回退原文");

let checks = 6;
for (const [zh, en] of Object.entries(I.dict)) {
  assert.ok(!CJK.test(en), "英文译文残留中文：" + zh + " → " + en);
  checks++;
}

// 脚本里所有 t("中文...") 都必须有对应译文，避免英文模式下漏翻译。
for (const name of ["app.js", "bridge.js", "calc-engine.js"]) {
  const src = read(name);
  const re = /\b(?:uiT|t)\("([^"\n]*[\u4e00-\u9fff][^"\n]*)"\)/g;
  let m;
  while ((m = re.exec(src))) {
    assert.ok(Object.prototype.hasOwnProperty.call(I.dict, m[1]),
      name + " 的文案未进字典：" + m[1]);
    checks++;
  }
}

// 静态 HTML 的 data-i18n 文案也要在字典里。
const html = read("index.html");
assert.ok(/<script src="i18n\.js"><\/script>/.test(html), "页面未加载 i18n.js");
assert.ok(/id="langToggle"/.test(html), "缺少语言切换按钮");
const staticRe = /<[^>]*\sdata-i18n(?:=)?(?:="[^"]*")?[^>]*>([^<]*[\u4e00-\u9fff][^<]*)</g;
let sm;
while ((sm = staticRe.exec(html))) {
  const key = sm[1].trim();
  assert.ok(Object.prototype.hasOwnProperty.call(I.dict, key),
    "index.html 的静态文案未进字典：" + key);
  checks++;
}
const placeholders = [...html.matchAll(/data-i18n-placeholder="([^"]+)"/g)].map((m) => m[1]);
for (const key of placeholders) {
  assert.ok(Object.prototype.hasOwnProperty.call(I.dict, key), "占位符未进字典：" + key);
  checks++;
}

// 极限 / 级数模式的控件必须存在，避免只加了引擎却进不了界面。
for (const id of ["limitControls", "seriesControls", "limitAt", "limitSide", "seriesStart", "exprLabel"]) {
  assert.ok(html.includes('id="' + id + '"'), "缺少模式控件：" + id);
  checks++;
}
for (const mode of ["derivative", "integral", "limit", "series"]) {
  assert.ok(html.includes('data-mode="' + mode + '"'), "缺少模式标签：" + mode);
  checks++;
}

// 讲义英文版：66 篇齐全、无中文残留，且公式仍可被 KaTeX 解析。
const notesWindow = { BC_I18N: { getLang: () => "en" } };
const katex = require(path.join(__dirname, "..", "web", "vendor", "katex", "katex.min.js"));
global.window = notesWindow;
require(path.join(__dirname, "..", "web", "notes.en.js"));
require(path.join(__dirname, "..", "web", "notes.js"));
const notes = notesWindow.BC_NOTES;
const enData = notesWindow.BC_NOTES_EN;
assert.equal(notes.articles.length, 66, "讲义篇数不足");
assert.equal(Object.keys(enData.articles).length, 66, "英文讲义应覆盖全部 66 篇");
assert.equal(enData.categories.length, 10, "英文 CED 单元数应为 10");
assert.equal(enData.categories.reduce((n, c) => n + c.topics.length, 0), 111, "英文主题数应为 111");
checks += 4;

let formulas = 0;
for (const a of notes.articles) {
  const en = notes.find(a.id);
  assert.ok(en, "英文版缺少讲义：" + a.id);
  assert.ok(!CJK.test(en.title + en.tag + en.lead), "英文元信息残留中文：" + a.id);
  assert.equal(en.blocks.length, a.blocks.length, "英文 block 数量不符：" + a.id);
  const htmlOut = notes.blocksHtml(en.blocks);
  assert.ok(!CJK.test(htmlOut), "英文正文残留中文：" + a.id);
  en.blocks.forEach((b) => {
    if (b && b.tex) {
      katex.renderToString(b.tex, { throwOnError: true, strict: "ignore" });
      formulas++;
    }
  });
  checks += 4;
}
const nav = notes.byCat();
assert.ok(!CJK.test(nav.map((c) => c.label).join(" ")), "目录仍有中文单元名");
const u1 = notes.blocksHtml(notes.find("u1-overview").blocks);
assert.ok(u1.includes("Official topic progress"), "英文进度头缺失");
assert.ok(u1.includes("Covered · Read →"), "英文跳转按钮缺失");
checks += 3;

console.log("i18n:", checks, "checks passed,", formulas, "English formulas OK");
