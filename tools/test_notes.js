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
const required = [
  "u-sub", "parts", "trig-int", "partial-frac", "var-bounds",
  "area-volume", "improper", "param-polar", "diffeq", "average-accum",
];
required.forEach((id) => assert.ok(notes.find(id), "缺少考点：" + id));

const decode = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const INLINE = /class="tex">([^<]*)</g;
const formulas = [];

articles.forEach((a) => {
  assert.ok(catIds.has(a.cat), a.id + " 分类未登记");
  assert.ok(a.title && a.tag && a.lead && a.blocks.length, a.id + " 元信息不完整");
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

formulas.forEach((tex) => {
  assert.doesNotThrow(
    () => katex.renderToString(tex, { throwOnError: true, strict: "ignore" }),
    "KaTeX 解析失败：" + tex.slice(0, 80),
  );
});

console.log("notes:", articles.length, "articles,", formulas.length, "formulas OK");
