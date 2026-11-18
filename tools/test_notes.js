"use strict";
/* 讲义数据自检：id 唯一、分类合法、公式可被 KaTeX 解析。 */
const assert = require("node:assert/strict");
const path = require("node:path");

global.window = {};
require(path.join(__dirname, "..", "web", "notes.js"));
const notes = global.window.BC_NOTES;
const katex = require(path.join(__dirname, "..", "web", "vendor", "katex", "katex.min.js"));

const articles = notes.articles;
assert.ok(articles.length >= 15, "讲义篇数不足");

const ids = articles.map((a) => a.id);
assert.equal(new Set(ids).size, ids.length, "讲义 id 重复");
const catIds = new Set(notes.categories.map((c) => c.id));
assert.equal(notes.categories.length, 10, "应按 AP Calculus BC CED 的 10 个 Unit 组织");
for (let i = 1; i <= 10; i++) {
  assert.ok(notes.categories.some((c) => c.id === "u" + i), "缺少官方 Unit " + i);
}
const required = [
  "limit-instant", "limit-def", "limit-manip", "limit-procedure", "squeeze",
  "chain-layers", "implicit-rates", "related-rates", "log-diff", "inverse-deriv", "param-polar-deriv",
  "u-sub", "parts", "trig-int", "partial-frac", "var-bounds", "bounds-direct",
  "area-volume", "improper", "param-polar", "diffeq", "average-accum",
];
required.forEach((id) => assert.ok(notes.find(id), "缺少考点：" + id));

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const INLINE = /class="tex">([^<]*)</g;
const formulas = [];

articles.forEach((a) => {
  assert.ok(catIds.has(a.cat), a.id + " 分类未登记");
  assert.ok(a.title && a.tag && a.lead && a.blocks.length, a.id + " 元信息不完整");
  const cat = notes.categories.find((c) => c.id === a.cat);
  (a.topics || []).forEach((no) => {
    assert.ok(cat.topics.some((t) => t.n === no), a.id + " 标注了不存在的官方主题 " + no);
  });
  a.blocks.forEach((b) => {
    if (b && b.roadmap) assert.ok(catIds.has(b.roadmap), a.id + " 总览指向未知 Unit");
  });
  const html = notes.blocksHtml(a.blocks);
  assert.ok(html.length > 100, a.id + " 正文过短");
  a.blocks.forEach((b) => {
    const chunks = [];
    if (typeof b === "string") chunks.push(b);
    else {
      if (b.tex) formulas.push(b.tex);
      ["h", "tip"].forEach((k) => { if (b[k]) chunks.push(b[k]); });
      if (b.ul) chunks.push(...b.ul);
      if (b.steps) chunks.push(...b.steps);
    }
    chunks.forEach((s) => {
      let m;
      INLINE.lastIndex = 0;
      while ((m = INLINE.exec(s))) formulas.push(decode(m[1]));
    });
  });
});

// 总览按官方主题顺序显示覆盖状态：Unit 1 已覆盖 5/16，Unit 6 已覆盖 10/14
const u1Roadmap = notes.blocksHtml(notes.find("u1-overview").blocks);
assert.equal((u1Roadmap.match(/roadmap-item done/g) || []).length, 5, "Unit 1 覆盖数量不符");
assert.equal((u1Roadmap.match(/roadmap-item todo/g) || []).length, 11, "Unit 1 待补数量不符");
assert.ok(u1Roadmap.includes('data-jump="squeeze"'), "Unit 1 总览缺少跳转到夹逼定理的按钮");
const u6Roadmap = notes.blocksHtml(notes.find("u6-overview").blocks);
assert.equal((u6Roadmap.match(/roadmap-item done/g) || []).length, 10, "Unit 6 覆盖数量不符");
assert.ok(u6Roadmap.includes('data-jump="u-sub"'), "总览缺少跳转到已覆盖讲义的按钮");

formulas.forEach((tex) => {
  assert.doesNotThrow(
    () => katex.renderToString(tex, { throwOnError: true, strict: "ignore" }),
    "KaTeX 解析失败：" + tex.slice(0, 80),
  );
});

console.log("notes:", articles.length, "articles,", formulas.length, "formulas OK");
