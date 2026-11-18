"use strict";
/* 微积分 BC 小讲义数据，结构仿 LA-Helper 的 notes.js。
 *
 * 每篇：{ id, cat, title, tag, lead, blocks }
 *   id    唯一锚点，用于 hash 路由（#notes/<id>）
 *   cat   所属分类 id（对应 categories）
 *   tag   分类下显示的短标签
 *   lead  开篇导语
 *   blocks 分点内容，逐项：
 *     字符串        -> 段落（可含 <b> 等内联 HTML）
 *     { h: "..." }  -> 小标题
 *     { tex: "..."}-> 独立公式块（KaTeX 渲染）
 *     { ul: [...] } -> 要点列表
 *     { steps: [...] } -> 例题的逐步解析（编号列表）
 *     { tip: "..."}-> 提示 / 常见坑
 *
 * 中文优先，关键概念保留英文原名；公式符号按英文教材写法。
 * 内容是静态文案，直接当 HTML 用，所以 < 写成 &lt;、> 写成 &gt;。
 * 新增一篇只需往 articles 里加一项，目录页会自动出现。
 */
window.BC_NOTES = (function () {
  var categories = [
    { id: "derivative", label: "导数 · Derivatives" },
    { id: "integral", label: "积分 · Integrals" },
  ];

  var articles = [
    {
      id: "deriv-def",
      cat: "derivative",
      tag: "定义",
      title: "导数的定义",
      lead: "导数 (derivative) 衡量函数在某一点的瞬时变化率。它不是一个新运算，而是割线斜率在两点无限靠近时的极限。",
      blocks: [
        { h: "1 · 从差商到导数" },
        "在 <b>x</b> 处给一个微小增量 <b>h</b>，两点 <span class=\"tex\">(x,f(x))</span> 与 <span class=\"tex\">(x+h,f(x+h))</span> 的割线斜率是 <span class=\"tex\">\\dfrac{f(x+h)-f(x)}{h}</span>，叫差商 (difference quotient)。令 <b>h → 0</b> 取极限就是导数：",
        { tex: "f'(x)=\\lim_{h\\to 0}\\frac{f(x+h)-f(x)}{h}" },
        { ul: [
          "<b>h</b>：自变量的微小增量，趋于 0 但不等于 0",
          "<b>差商</b>：区间上的平均变化率；取极限后变成一点的瞬时变化率",
          "极限存在就说函数在 <span class=\"tex\">x</span> 处<b>可导 (differentiable)</b>，记作 <span class=\"tex\">f'(x)</span> 或 <span class=\"tex\">\\dfrac{dy}{dx}</span>",
        ] },
        { h: "2 · 等价写法" },
        "把 <span class=\"tex\">x+h</span> 换成 <span class=\"tex\">t</span>，令 <span class=\"tex\">t\\to x</span>，得到同一个极限：",
        { tex: "f'(a)=\\lim_{t\\to a}\\frac{f(t)-f(a)}{t-a}" },
        { h: "3 · 几何与物理意义" },
        "<b>几何：</b><span class=\"tex\">f'(a)</span> 是曲线 <span class=\"tex\">y=f(x)</span> 在点 <span class=\"tex\">(a,f(a))</span> 处<b>切线斜率 (slope of tangent line)</b>。<b>物理：</b>若 <span class=\"tex\">s(t)</span> 是位移，则 <span class=\"tex\">s'(t)</span> 是瞬时速度 (instantaneous velocity)。",
        { tip: "可导一定连续，但连续不一定可导 —— 尖点 (corner)、竖直切线、跳跃处都可能连续却不可导。经典反例：<span class=\"tex\">f(x)=|x|</span> 在 <span class=\"tex\">x=0</span> 连续但不可导。" },
      ],
    },
    {
      id: "deriv-rules",
      cat: "derivative",
      tag: "法则",
      title: "求导法则与常见导数",
      lead: "考试里几乎不必回到极限定义。把基本函数的导数和几条组合法则记住，任何初等函数都能拆开逐层求。分步计算视图会把用到的法则标在每一步上。",
      blocks: [
        { h: "1 · 基本初等函数的导数" },
        { tex: "\\frac{d}{dx}x^{n}=n\\,x^{n-1}\\qquad\\frac{d}{dx}e^{x}=e^{x}\\qquad\\frac{d}{dx}\\ln x=\\frac{1}{x}" },
        { tex: "(\\sin x)'=\\cos x\\quad (\\cos x)'=-\\sin x\\quad (\\tan x)'=\\sec^{2}x" },
        { ul: [
          "<b>幂法则 (power rule)</b> 对任意实数 <span class=\"tex\">n</span> 成立，包括负指数与分数指数",
          "<b>\\ln x</b> 的导数是 <span class=\"tex\">1/x</span>，注意定义域 <span class=\"tex\">x&gt;0</span>",
          "反三角函数：<span class=\"tex\">(\\arcsin x)'=\\dfrac{1}{\\sqrt{1-x^{2}}}</span>，<span class=\"tex\">(\\arctan x)'=\\dfrac{1}{1+x^{2}}</span>",
        ] },
        { h: "2 · 四则运算法则" },
        { tex: "(f\\pm g)'=f'\\pm g'\\qquad (fg)'=f'g+fg'\\qquad\\left(\\frac{f}{g}\\right)'=\\frac{f'g-fg'}{g^{2}}" },
        { tip: "乘积法则 (product rule) 是 <b>f'g + fg'</b>，商法则 (quotient rule) 分子是 <b>f'g − fg'</b> —— 顺序容易记反，用口诀『下导上减上导下，再除以下平方』。" },
        { h: "3 · 链式法则" },
        "复合函数 <span class=\"tex\">f(g(x))</span> 的导数要『由外向内，逐层相乘』：",
        { tex: "\\frac{d}{dx}f(g(x))=f'(g(x))\\,g'(x)" },
        { ul: [
          "例：<span class=\"tex\">\\sin(x^{2})</span> 外层是 sin、内层是 <span class=\"tex\">x^{2}</span>，得 <span class=\"tex\">\\cos(x^{2})\\cdot 2x</span>",
          "链式法则 (chain rule) 是 BC 最高频的考点，隐函数求导、相关变化率都靠它",
        ] },
      ],
    },
    {
      id: "int-def",
      cat: "integral",
      tag: "定义",
      title: "积分的定义",
      lead: "积分有两种看似无关、实则紧密相连的含义：不定积分是求导的逆操作，定积分是把无穷多细条累加起来的极限。",
      blocks: [
        { h: "1 · 不定积分：求导的逆" },
        "已知导数 <span class=\"tex\">f</span>，找回原函数 (antiderivative) <span class=\"tex\">F</span>，使 <span class=\"tex\">F'=f</span>。因为常数求导会消失，结果必须带一个积分常数 (constant of integration) <span class=\"tex\">C</span>：",
        { tex: "F'(x)=f(x)\\quad\\Longrightarrow\\quad\\int f(x)\\,dx=F(x)+C" },
        { ul: [
          "<b>\\int</b>：积分号；<b>dx</b> 指明对哪个变量积分",
          "<b>+C</b> 不能漏：一族原函数彼此只差一个常数",
        ] },
        { h: "2 · 定积分：黎曼和的极限" },
        "把 <span class=\"tex\">[a,b]</span> 切成 <b>n</b> 个宽 <span class=\"tex\">\\Delta x</span> 的细条，取每条高 <span class=\"tex\">f(x_i)</span>，累加后令 <b>n → ∞</b>：",
        { tex: "\\int_{a}^{b}f(x)\\,dx=\\lim_{n\\to\\infty}\\sum_{i=1}^{n}f(x_i)\\,\\Delta x" },
        { ul: [
          "<b>\\Delta x=(b-a)/n</b>：每个细条的宽度",
          "这是<b>黎曼和 (Riemann sum)</b> 的极限，定义本身就保证定积分是一个确定的数",
        ] },
        { h: "3 · 几何意义：有向面积" },
        "当 <span class=\"tex\">f\\ge 0</span> 时，定积分等于曲线下的面积；更一般地它是<b>有向面积 (signed area)</b> —— x 轴上方的部分算正，下方的算负。",
        { tip: "定积分的结果是<b>一个数</b>，不定积分的结果是<b>一族函数</b>。看到上下限 <span class=\"tex\">\\int_a^b</span> 就是定积分，没有上下限就是不定积分。" },
      ],
    },
    {
      id: "ftc",
      cat: "integral",
      tag: "定理",
      title: "微积分基本定理",
      lead: "微积分基本定理 (Fundamental Theorem of Calculus, FTC) 把导数和积分真正接了起来：求定积分不必真的去算无穷和，找到原函数代值相减即可。这是 BC 的核心主线。",
      blocks: [
        { h: "1 · FTC 第一部分：用原函数算定积分" },
        "若 <span class=\"tex\">F'=f</span>，则：",
        { tex: "\\int_{a}^{b}f(x)\\,dx=F(b)-F(a)" },
        { ul: [
          "把上限代进去减去下限代进去，中间项全部抵消",
          "这就是为什么求面积可以不用数格子 —— 找到反导数就够了",
        ] },
        { h: "2 · FTC 第二部分：积分上限函数求导" },
        "若 <span class=\"tex\">g(x)=\\int_{a}^{x}f(t)\\,dt</span>，则 <span class=\"tex\">g'(x)=f(x)</span>。积分与求导互为逆过程。",
        { tex: "\\frac{d}{dx}\\int_{a}^{x}f(t)\\,dt=f(x)" },
        { tip: "主线一句话：<b>微分</b>是把整体切成碎片看变化，<b>积分</b>是把碎片拼回整体看累积，FTC 说这两件事互为逆过程。上下限含 <span class=\"tex\">x</span> 的求导要用链式法则乘以上限的导数。" },
      ],
    },
    {
      id: "int-formulas",
      cat: "integral",
      tag: "公式",
      title: "常见积分公式",
      lead: "把最常用的反导数记牢，配合换元 (u-substitution) 与分部 (integration by parts) 就能拿下 BC 的大部分积分题。",
      blocks: [
        { h: "1 · 基本积分公式" },
        { tex: "\\int x^{n}dx=\\frac{x^{n+1}}{n+1}+C\\ (n\\neq-1)\\qquad\\int\\frac{1}{x}dx=\\ln|x|+C" },
        { tex: "\\int e^{x}dx=e^{x}+C\\qquad\\int\\sin x\\,dx=-\\cos x+C\\qquad\\int\\cos x\\,dx=\\sin x+C" },
        { ul: [
          "<b>\\int x^{n}dx</b> 唯一例外是 <span class=\"tex\">n=-1</span>，此时是 <span class=\"tex\">\\ln|x|</span> 而不是幂函数",
          "<b>\\ln|x|</b> 的绝对值不能省，它把 <span class=\"tex\">x&lt;0</span> 的情况也包含进来",
        ] },
        { h: "2 · 两个高频方法" },
        "<b>换元 (u-substitution)</b>：当被积函数里同时出现 <span class=\"tex\">g(x)</span> 和 <span class=\"tex\">g'(x)</span>，令 <span class=\"tex\">u=g(x)</span> 把积分化简。",
        "<b>分部 (integration by parts)</b>：乘积的积分用 <span class=\"tex\">\\int u\\,dv=uv-\\int v\\,du</span>，典型对象是『多项式 × 对数/三角/指数』。",
        { tex: "\\int u\\,dv=uv-\\int v\\,du" },
        { tip: "方法选择经验：看到复合函数内层导数 → 换元；看到两种不同函数相乘 → 分部；分式有理函数 → 先尝试部分分式 (partial fractions)。" },
      ],
    },
    {
      id: "u-sub",
      cat: "integral",
      tag: "方法",
      title: "换元法 u-substitution",
      lead: "换元就是『反过来用链式法则』。当被积函数里同时出现一个内层函数 g(x) 和它的导数 g'(x)，令 u=g(x) 就能把复合结构拆平。",
      blocks: [
        { h: "1 · 原理：反向链式法则" },
        "若 <span class=\"tex\">u=g(x)</span>，则 <span class=\"tex\">du=g'(x)\\,dx</span>，于是：",
        { tex: "\\int f'(g(x))\\,g'(x)\\,dx=\\int f'(u)\\,du=f(u)+C" },
        { ul: [
          "识别信号：内层函数 <span class=\"tex\">g(x)</span> 与导数 <span class=\"tex\">g'(x)</span> 同时出现，导数差一个常数倍也行",
          "先写 <b>du</b>，看清少了哪个常数倍，再补 <span class=\"tex\">\\frac{1}{k}</span>",
          "不定积分最后要回代成 <b>x</b>；定积分可以直接换上下限，不必回代",
        ] },
        { h: "2 · 例题：根号里的复合函数" },
        { steps: [
          "求 <span class=\"tex\">\\int x\\sqrt{x^{2}+1}\\,dx</span>。内层是 <span class=\"tex\">x^{2}+1</span>，它的导数 <span class=\"tex\">2x</span> 正好在外面。",
          "令 <span class=\"tex\">u=x^{2}+1</span>，则 <span class=\"tex\">du=2x\\,dx</span>，即 <span class=\"tex\">x\\,dx=\\frac{du}{2}</span>。",
          "原式 <span class=\"tex\">=\\frac12\\int u^{1/2}\\,du=\\frac12\\cdot\\frac23 u^{3/2}+C</span>。",
          "回代得 <span class=\"tex\">\\frac{(x^{2}+1)^{3/2}}{3}+C</span>；求导可验证正好是 <span class=\"tex\">x\\sqrt{x^{2}+1}</span>。",
        ] },
        { h: "3 · 定积分：上下限一起换" },
        { steps: [
          "求 <span class=\"tex\">\\int_{0}^{1}2x e^{x^{2}}\\,dx</span>。仍令 <span class=\"tex\">u=x^{2}</span>，<span class=\"tex\">du=2x\\,dx</span>。",
          "换限：<span class=\"tex\">x=0\\Rightarrow u=0</span>，<span class=\"tex\">x=1\\Rightarrow u=1</span>。",
          "原式 <span class=\"tex\">=\\int_{0}^{1}e^{u}\\,du=e-1</span>，全程不用写回 <b>x</b>。",
        ] },
        { tip: "两个高频错误：① 漏掉 du 的常数倍（如 du=2x dx 却直接把 x dx 写成 du）；② 定积分换了变量却沿用旧的上下限。换元后要么全用 u 并换限，要么回代后保留原限，不能混着来。" },
      ],
    },
    {
      id: "parts",
      cat: "integral",
      tag: "方法",
      title: "分部积分 integration by parts",
      lead: "分部积分处理『两类不同函数相乘』，本质是乘积求导公式的积分形式。目标是把难积的因子换到 d 的右边，变成容易积的 dv。",
      blocks: [
        { h: "1 · 公式与选 u 的顺序" },
        { tex: "\\int u\\,dv=uv-\\int v\\,du" },
        "选 <b>u</b> 的经验口诀 <b>LIATE</b>（从前往后优先做 u）：Log 对数 → Inverse trig 反三角 → Algebraic 代数（多项式） → Trig 三角 → Exponential 指数。",
        { ul: [
          "典型：<span class=\"tex\">x\\ln x</span>、<span class=\"tex\">x e^{x}</span>、<span class=\"tex\">x\\sin x</span>、<span class=\"tex\">\\arctan x</span>",
          "选好的 u 求导后应该变简单；dv 必须能积出 v",
          "多项式 × 指数/三角，且多项式次数高时可用表格法 (tabular integration) 连续分部",
        ] },
        { h: "2 · 例题：对数 × 多项式" },
        { steps: [
          "求 <span class=\"tex\">\\int x\\ln x\\,dx</span>。按 LIATE，对数优先做 u：令 <span class=\"tex\">u=\\ln x</span>，<span class=\"tex\">dv=x\\,dx</span>。",
          "于是 <span class=\"tex\">du=\\frac{1}{x}dx</span>，<span class=\"tex\">v=\\frac{x^{2}}{2}</span>。",
          "代入公式：<span class=\"tex\">\\frac{x^{2}}{2}\\ln x-\\int\\frac{x^{2}}{2}\\cdot\\frac{1}{x}\\,dx</span>。",
          "化简得 <span class=\"tex\">\\frac{x^{2}}{2}\\ln x-\\frac{x^{2}}{4}+C</span>。",
        ] },
        { h: "3 · 循环型：两次分部后移项" },
        "像 <span class=\"tex\">\\int e^{x}\\sin x\\,dx</span> 分部两次会回到原积分。把右边出现的原积分<b>移到左边合并</b>，再除以系数即可，别误以为算出 0。",
        { tip: "定积分的分部公式同样成立：<span class=\"tex\">\\int_a^b u\\,dv=[uv]_a^b-\\int_a^b v\\,du</span>。边界项 <span class=\"tex\">[uv]_a^b</span> 别忘了代值相减。" },
      ],
    },
    {
      id: "trig-int",
      cat: "integral",
      tag: "三角",
      title: "三角函数积分",
      lead: "三角积分不靠硬背一堆公式，靠『先恒等变形，再换元』。核心是奇偶次幂的拆法与几个基本恒等式。",
      blocks: [
        { h: "1 · 必备恒等式" },
        { tex: "\\sin^{2}x+\\cos^{2}x=1\\qquad 1+\\tan^{2}x=\\sec^{2}x" },
        { tex: "\\cos 2x=\\cos^{2}x-\\sin^{2}x=2\\cos^{2}x-1=1-2\\sin^{2}x" },
        { h: "2 · sin / cos 的幂" },
        { ul: [
          "<b>sin 次为奇</b>：留一个 <span class=\"tex\">\\sin x\\,dx</span> 做 du，其余用 <span class=\"tex\">\\sin^{2}=1-\\cos^{2}</span> 改写，令 <span class=\"tex\">u=\\cos x</span>",
          "<b>cos 次为奇</b>：留一个 <span class=\"tex\">\\cos x\\,dx</span>，令 <span class=\"tex\">u=\\sin x</span>",
          "<b>两者皆偶</b>：用半角公式降次，如 <span class=\"tex\">\\sin^{2}x=\\frac{1-\\cos 2x}{2}</span>",
        ] },
        { steps: [
          "求 <span class=\"tex\">\\int\\sin^{3}x\\cos^{2}x\\,dx</span>。sin 次为奇，留 <span class=\"tex\">\\sin x\\,dx</span>，把 <span class=\"tex\">\\sin^{2}x</span> 写成 <span class=\"tex\">1-\\cos^{2}x</span>。",
          "令 <span class=\"tex\">u=\\cos x</span>，<span class=\"tex\">du=-\\sin x\\,dx</span>。",
          "原式 <span class=\"tex\">=-\\int(1-u^{2})u^{2}\\,du=-\\frac{u^{3}}{3}+\\frac{u^{5}}{5}+C</span>。",
          "回代：<span class=\"tex\">-\\frac{\\cos^{3}x}{3}+\\frac{\\cos^{5}x}{5}+C</span>。",
        ] },
        { h: "3 · tan / sec 的幂" },
        { ul: [
          "<b>sec 次为偶</b>：留 <span class=\"tex\">\\sec^{2}x\\,dx</span>，令 <span class=\"tex\">u=\\tan x</span>",
          "<b>tan 次为奇</b>：留 <span class=\"tex\">\\sec x\\tan x\\,dx</span>，令 <span class=\"tex\">u=\\sec x</span>",
          "记住 <span class=\"tex\">\\int\\sec x\\,dx=\\ln|\\sec x+\\tan x|+C</span>",
        ] },
        { tip: "偶次幂别急着换元，先用半角/倍角公式降次；混合 tan 与 sec 时先写成 sin/cos 往往更清楚。" },
      ],
    },
    {
      id: "partial-frac",
      cat: "integral",
      tag: "有理式",
      title: "部分分式 partial fractions",
      lead: "有理函数积分的固定套路：先因式分解分母，再拆成若干简单分式，逐项积分。BC 常考一次因式、重复因式和不可约二次因式。",
      blocks: [
        { h: "1 · 先判断是否真分式" },
        "若分子次数 ≥ 分母次数，先用<b>多项式长除法</b>分离出多项式部分，再对余下的真分式拆解。",
        { h: "2 · 三种分母的拆法" },
        { ul: [
          "不同一次因式：<span class=\"tex\">\\frac{P(x)}{(x-a)(x-b)}=\\frac{A}{x-a}+\\frac{B}{x-b}</span>",
          "重复一次因式：<span class=\"tex\">\\frac{P(x)}{(x-a)^{2}}=\\frac{A}{x-a}+\\frac{B}{(x-a)^{2}}</span>，重复 k 次就写到 k 次幂",
          "不可约二次因式：<span class=\"tex\">\\frac{P(x)}{x^{2}+1}\\Rightarrow\\frac{Ax+B}{x^{2}+1}</span>，分子要一次式，再用凑 <span class=\"tex\">\\arctan</span> 与 <span class=\"tex\">\\ln</span> 积分",
        ] },
        { h: "3 · 例题：不同一次因式" },
        { steps: [
          "求 <span class=\"tex\">\\int\\frac{1}{x^{2}-1}\\,dx</span>。分母分解为 <span class=\"tex\">(x-1)(x+1)</span>。",
          "设 <span class=\"tex\">\\frac{1}{x^{2}-1}=\\frac{A}{x-1}+\\frac{B}{x+1}</span>，通分得 <span class=\"tex\">1=A(x+1)+B(x-1)</span>。",
          "令 <span class=\"tex\">x=1</span> 得 <span class=\"tex\">A=\\frac12</span>；令 <span class=\"tex\">x=-1</span> 得 <span class=\"tex\">B=-\\frac12</span>。",
          "积分得 <span class=\"tex\">\\frac12\\ln|x-1|-\\frac12\\ln|x+1|+C=\\frac12\\ln\\left|\\frac{x-1}{x+1}\\right|+C</span>。",
        ] },
        { tip: "求出 A、B 后最好通分验算一次；<span class=\"tex\">\\int\\frac{dx}{x^{2}+a^{2}}=\\frac1a\\arctan\\frac{x}{a}+C</span> 是二次不可约项的常用落点。" },
      ],
    },
    {
      id: "var-bounds",
      cat: "integral",
      tag: "变限",
      title: "函数上下限的积分求导",
      lead: "这是 BC 的高频题：不求积分，直接对变上限（甚至上下限都是函数）的定积分求导。像上限是 <span class=\"tex\">(\\sin x)^{2}</span> 这种复合函数，关键是 FTC + 链式法则逐层求导，完全不需要先算出原函数。",
      blocks: [
        { h: "1 · 公式" },
        "若上限是函数 <span class=\"tex\">u(x)</span>：",
        { tex: "\\frac{d}{dx}\\int_{a}^{u(x)}f(t)\\,dt=f\\big(u(x)\\big)\\,u'(x)" },
        "上下限都是函数时，两项相减：",
        { tex: "\\frac{d}{dx}\\int_{v(x)}^{u(x)}f(t)\\,dt=f\\big(u(x)\\big)u'(x)-f\\big(v(x)\\big)v'(x)" },
        { ul: [
          "把上限代入被积函数，再<b>乘以上限的导数</b>；下限同理但前面带负号",
          "被积函数里只能有积分变量 <b>t</b>，不能直接夹带 <b>x</b>",
          "遇到 <span class=\"tex\">\\int_a^{x^{2}}f(t)\\,dt</span> 这类题，<b>不要试图先积出来</b>，直接套公式",
        ] },
        { h: "2 · 例题：只有上限是函数" },
        { steps: [
          "求 <span class=\"tex\">\\frac{d}{dx}\\int_{0}^{x^{2}}\\sin(t^{2})\\,dt</span>。<span class=\"tex\">\\sin(t^{2})</span> 没有初等原函数，但 FTC 不需要它。",
          "套公式：把 <span class=\"tex\">t</span> 换成上限 <span class=\"tex\">x^{2}</span>，得 <span class=\"tex\">\\sin\\big((x^{2})^{2}\\big)=\\sin(x^{4})</span>。",
          "再乘上限导数 <span class=\"tex\">(x^{2})'=2x</span>。",
          "答案 <span class=\"tex\">2x\\sin(x^{4})</span>。",
        ] },
        { h: "3 · 例题：上下限都是函数" },
        { steps: [
          "求 <span class=\"tex\">\\frac{d}{dx}\\int_{\\sin x}^{x^{2}}\\sqrt{1+t^{2}}\\,dt</span>。",
          "上限项：<span class=\"tex\">\\sqrt{1+(x^{2})^{2}}\\cdot(x^{2})'=2x\\sqrt{1+x^{4}}</span>。",
          "下限项：<span class=\"tex\">\\sqrt{1+\\sin^{2}x}\\cdot(\\sin x)'=\\sqrt{1+\\sin^{2}x}\\,\\cos x</span>。",
          "相减得 <span class=\"tex\">2x\\sqrt{1+x^{4}}-\\cos x\\sqrt{1+\\sin^{2}x}</span>。",
        ] },
        { h: "4 · 最容易错：上限本身是复合函数" },
        "像 <span class=\"tex\">\\int_{2}^{(\\sin x)^{2}}f(t)\\,dt</span> 这种题，FTC 公式没变，难在把上限的导数<b>求完整</b>。上限是两层函数：外层平方，内层 <span class=\"tex\">\\sin x</span>。",
        { tex: "\\frac{d}{dx}\\int_{2}^{(\\sin x)^{2}}f(t)\\,dt=f\\big(\\sin^{2}x\\big)\\cdot\\frac{d}{dx}\\big[(\\sin x)^{2}\\big]" },
        { steps: [
          "先对外层平方求导：<span class=\"tex\">\\frac{d}{dx}\\big[(\\sin x)^{2}\\big]=2\\sin x\\cdot(\\sin x)'</span>。",
          "再对内层求导：<span class=\"tex\">(\\sin x)'=\\cos x</span>，所以上限导数 <span class=\"tex\">=2\\sin x\\cos x=\\sin(2x)</span>。",
          "把 <span class=\"tex\">t</span> 换成上限，得 <span class=\"tex\">f(\\sin^{2}x)</span>；再乘上限导数。",
          "答案 <span class=\"tex\">2\\sin x\\cos x\\,f(\\sin^{2}x)=\\sin(2x)\\,f(\\sin^{2}x)</span>。",
        ] },
        "若 <span class=\"tex\">f(t)=\\sqrt{t^{3}+1}</span>，照样只代入、不求积分：",
        { tex: "\\frac{d}{dx}\\int_{2}^{\\sin^{2}x}\\sqrt{t^{3}+1}\\,dt=2\\sin x\\cos x\\sqrt{\\sin^{6}x+1}" },
        { h: "5 · 上下限都是复合函数" },
        { steps: [
          "求 <span class=\"tex\">\\frac{d}{dx}\\int_{\\cos^{2}x}^{\\sin^{2}x}\\sqrt{t^{3}+1}\\,dt</span>。",
          "上限项：<span class=\"tex\">(\\sin^{2}x)'=2\\sin x\\cos x=\\sin(2x)</span>，得 <span class=\"tex\">\\sin(2x)\\sqrt{\\sin^{6}x+1}</span>。",
          "下限项：<span class=\"tex\">(\\cos^{2}x)'=2\\cos x(-\\sin x)=-\\sin(2x)</span>，前面要减，所以变成 <span class=\"tex\">+\\sin(2x)\\sqrt{\\cos^{6}x+1}</span>。",
          "合并：<span class=\"tex\">\\sin(2x)\\big[\\sqrt{\\sin^{6}x+1}+\\sqrt{\\cos^{6}x+1}\\big]</span>。",
        ] },
        { ul: [
          "口诀：<b>一代上限，二乘上限导数，三不做积分</b>；下限同法求导后整体减去",
          "上限是 <span class=\"tex\">\\sin(x^{2})</span> 就乘 <span class=\"tex\">\\cos(x^{2})\\cdot2x</span>；是 <span class=\"tex\">e^{\\cos x}</span> 就乘 <span class=\"tex\">-\\sin x\\,e^{\\cos x}</span>",
          "被积函数里只出现 <b>t</b> 时，永远不需要先找原函数，哪怕 <span class=\"tex\">\\sqrt{t^{3}+1}</span> 根本积不出来",
        ] },
        { tip: "最常见的错是把 <span class=\"tex\">(\\sin x)^{2}</span> 的导数写成 <span class=\"tex\">2\\sin x</span>，漏掉内层的 <span class=\"tex\">\\cos x</span>。只要看到括号外面还挂着平方、根号或指数，就提醒自己：链式法则还没走完。若题目前面<b>没有</b> <span class=\"tex\">d/dx</span>、是真要算值，请看下一篇《上下限含函数的定积分：直接计算》。若被积函数同时出现 x 和 t（如 <span class=\"tex\">\\int_0^{x}f(xt)\\,dt</span>），先换元把 x 移出积分号，不能直接套公式。" },
      ],
    },
    {
      id: "bounds-direct",
      cat: "integral",
      tag: "定积分",
      title: "上下限含函数的定积分：直接计算",
      lead: "题目若写成 <span class=\"tex\">\\int_{2}^{\\sin^{2}x}f(t)\\,dt</span>，前面没有 <span class=\"tex\">d/dx</span>，那就是真要算出一个关于 x 的函数。做法不是换元，而是先求 f 的原函数 F(t)，再把上、下限代进去相减。",
      blocks: [
        { h: "1 · 先分清：求值 vs 求导" },
        { ul: [
          "前面有 <span class=\"tex\">\\frac{d}{dx}</span> → 用 FTC：不求原函数，代入上限后<b>乘上限导数</b>",
          "前面只有 <span class=\"tex\">\\int</span> → 直接积分：先找原函数 <span class=\"tex\">F(t)</span>，再算 <span class=\"tex\">F(u(x))-F(v(x))</span>",
          "两种题长得像，但一个考链式法则，一个考反导数 + 化简，千万别混",
        ] },
        { h: "2 · 怎么做：x 只是上限的参数" },
        "积分变量是 <b>t</b>，积分过程中把 <b>x</b> 当固定数；算出原函数后再代上限。",
        { steps: [
          "求 <span class=\"tex\">\\int_{2}^{\\sin^{2}x}t\\,dt</span>。先把 <b>t</b> 积分，原函数是 <span class=\"tex\">F(t)=\\frac{t^{2}}{2}</span>。",
          "代上限 <span class=\"tex\">t=\\sin^{2}x</span>：<span class=\"tex\">F(\\sin^{2}x)=\\frac{(\\sin^{2}x)^{2}}{2}=\\frac{\\sin^{4}x}{2}</span>。",
          "代下限 <span class=\"tex\">t=2</span>：<span class=\"tex\">F(2)=\\frac{2^{2}}{2}=2</span>。",
          "相减得 <span class=\"tex\">\\frac{\\sin^{4}x}{2}-2</span>。全程<b>不需要</b>对 <span class=\"tex\">\\sin^{2}x</span> 求导。",
        ] },
        { h: "3 · 上下限都含 x" },
        { tex: "\\int_{v(x)}^{u(x)}f(t)\\,dt=F(u(x))-F(v(x))" },
        { steps: [
          "求 <span class=\"tex\">\\int_{\\cos x}^{\\sin x}2t\\,dt</span>。原函数 <span class=\"tex\">F(t)=t^{2}</span>。",
          "代入得 <span class=\"tex\">F(\\sin x)-F(\\cos x)=\\sin^{2}x-\\cos^{2}x</span>。",
          "用倍角公式化简：<span class=\"tex\">\\sin^{2}x-\\cos^{2}x=-\\cos(2x)</span>。",
        ] },
        { h: "4 · 几个容易踩的坑" },
        { ul: [
          "<b>上限小于下限也正常</b>：<span class=\"tex\">\\sin^{2}x\\le1&lt;2</span>，所以第一题结果是负数；定积分是有向面积，别自作主张交换上下限",
          "<span class=\"tex\">(\\sin x)^{2}</span> 是 <span class=\"tex\">\\sin^{2}x</span>，不是 <span class=\"tex\">\\sin(x^{2})</span>；平方后是 <span class=\"tex\">\\sin^{4}x</span>，别写成 <span class=\"tex\">\\sin^{2}(x^{2})</span>",
          "若 <span class=\"tex\">f(t)</span> 没有初等原函数（如 <span class=\"tex\">\\sqrt{t^{3}+1}</span>），直接积分写不出闭式；考试遇到这种被积函数，通常前面会带 <span class=\"tex\">d/dx</span>，让你用 FTC 绕过积分",
        ] },
        { tip: "判断口诀：<b>有 d/dx 不积分，没 d/dx 才积分</b>。前者只代上限再乘导数；后者先找原函数，再把上下限代进去相减。" },
      ],
    },
    {
      id: "area-volume",
      cat: "integral",
      tag: "应用",
      title: "面积与体积的应用",
      lead: "定积分把无限多细条累加起来：面积是『高 × 宽』的累加，体积是『截面积 × 厚』的累加。做应用题第一步永远是画草图。",
      blocks: [
        { h: "1 · 两曲线之间的面积" },
        { tex: "A=\\int_{a}^{b}\\big(\\text{上}-\\text{下}\\big)\\,dx" },
        { ul: [
          "先求交点定 <span class=\"tex\">a,b</span>，再判断谁在上；上下交换会得负数",
          "若上下关系在区间内变化，必须<b>分段积分</b>再取绝对值相加",
          "改成对 <b>y</b> 积分时，用 <span class=\"tex\">\\int(右-左)\\,dy</span>，有时能少分几段",
        ] },
        { steps: [
          "求 <span class=\"tex\">y=x</span> 与 <span class=\"tex\">y=x^{2}</span> 围成的面积。交点由 <span class=\"tex\">x=x^{2}</span> 得 <span class=\"tex\">x=0,1</span>。",
          "在 <span class=\"tex\">(0,1)</span> 内 <span class=\"tex\">x>x^{2}</span>，所以上减下是 <span class=\"tex\">x-x^{2}</span>。",
          "<span class=\"tex\">A=\\int_0^1(x-x^{2})\\,dx=[\\frac{x^{2}}{2}-\\frac{x^{3}}{3}]_0^1=\\frac16</span>。",
        ] },
        { h: "2 · 旋转体体积" },
        { ul: [
          "圆盘法：<span class=\"tex\">V=\\pi\\int_a^b R(x)^{2}\\,dx</span>，绕 x 轴旋转且内半径为 0",
          "垫圈法 (washer)：<span class=\"tex\">V=\\pi\\int_a^b\\big(R^{2}-r^{2}\\big)\\,dx</span>，中间有洞",
          "圆柱壳法 (shell)：<span class=\"tex\">V=2\\pi\\int_a^b x\\,h(x)\\,dx</span>，绕 y 轴旋转更方便",
          "一般横截面积已知：<span class=\"tex\">V=\\int_a^b A(x)\\,dx</span>",
        ] },
        { steps: [
          "把 <span class=\"tex\">y=\\sqrt{x}</span> 在 <span class=\"tex\">[0,4]</span> 上绕 x 轴旋转。圆盘半径就是 <span class=\"tex\">R=\\sqrt{x}</span>。",
          "<span class=\"tex\">V=\\pi\\int_0^{4}(\\sqrt{x})^{2}\\,dx=\\pi\\int_0^{4}x\\,dx</span>。",
          "<span class=\"tex\">=\\pi[\\frac{x^{2}}{2}]_0^{4}=8\\pi</span>。",
        ] },
        { tip: "写真公式前先标出 R 与 r（或壳的半径与高）：外半径永远减内半径；壳法是 <span class=\"tex\">2\\pi\\times\\text{半径}\\times\\text{高}</span>，别漏 <span class=\"tex\">2\\pi</span>。" },
      ],
    },
    {
      id: "improper",
      cat: "integral",
      tag: "广义积分",
      title: "广义积分 improper integrals",
      lead: "积分区间无限，或被积函数在区间内有瑕点（趋于无穷），都不能直接套 FTC，必须用极限定义判断是否收敛。",
      blocks: [
        { h: "1 · 两类广义积分" },
        { tex: "\\int_a^{\\infty}f(x)\\,dx=\\lim_{t\\to\\infty}\\int_a^{t}f(x)\\,dx" },
        { tex: "\\int_a^{b}f(x)\\,dx=\\lim_{t\\to b^{-}}\\int_a^{t}f(x)\\,dx\\quad (f\\text{ 在 }b\\text{ 处发散})" },
        { ul: [
          "极限存在且为有限数 → <b>收敛 (convergent)</b>；极限不存在或无穷 → <b>发散 (divergent)</b>",
          "<b>p 积分</b>：<span class=\"tex\">\\int_1^\\infty\\frac{dx}{x^{p}}</span> 仅当 <span class=\"tex\">p&gt;1</span> 收敛",
          "瑕点在区间内部时，要在瑕点处<b>拆成两段</b>分别取极限，两段都收敛才收敛",
        ] },
        { h: "2 · 例题" },
        { steps: [
          "<span class=\"tex\">\\int_1^\\infty\\frac{dx}{x^{2}}=\\lim_{t\\to\\infty}[-\\frac1x]_1^{t}=\\lim_{t\\to\\infty}(1-\\frac1t)=1</span>，收敛。",
          "<span class=\"tex\">\\int_1^\\infty\\frac{dx}{x}=\\lim_{t\\to\\infty}\\ln t=\\infty</span>，发散 —— 这是 <span class=\"tex\">p=1</span> 的分界线。",
          "<span class=\"tex\">\\int_0^{1}\\frac{dx}{\\sqrt{x}}=\\lim_{t\\to0^{+}}[2\\sqrt{x}]_t^{1}=2</span>，瑕点在 0 但积分收敛。",
        ] },
        { tip: "别看到积分值『看起来有限』就下结论；一定要写出极限。比较判别法 (comparison test)：若 <span class=\"tex\">0\\le f\\le g</span> 且 <span class=\"tex\">\\int g</span> 收敛，则 <span class=\"tex\">\\int f</span> 收敛。" },
      ],
    },
    {
      id: "param-polar",
      cat: "integral",
      tag: "参数/极坐标",
      title: "参数方程与极坐标中的积分",
      lead: "BC 把积分搬到了参数曲线和极坐标上：本质仍是把曲线切成小段累加，只是面积、弧长的微元换了写法。",
      blocks: [
        { h: "1 · 参数方程" },
        "若 <span class=\"tex\">x=x(t),\\ y=y(t)</span>：",
        { tex: "A=\\int y\\,dx=\\int_{\\alpha}^{\\beta}y(t)\\,x'(t)\\,dt" },
        { tex: "L=\\int_{\\alpha}^{\\beta}\\sqrt{[x'(t)]^{2}+[y'(t)]^{2}}\\,dt" },
        { h: "2 · 极坐标" },
        "若 <span class=\"tex\">r=r(\\theta)</span>，小扇形面积是 <span class=\"tex\">\\frac12 r^{2}d\\theta</span>：",
        { tex: "A=\\frac12\\int_{\\alpha}^{\\beta}r^{2}\\,d\\theta" },
        { tex: "L=\\int_{\\alpha}^{\\beta}\\sqrt{r^{2}+\\left(\\frac{dr}{d\\theta}\\right)^{2}}\\,d\\theta" },
        { steps: [
          "求 <span class=\"tex\">r=2\\cos\\theta</span> 围成的面积。这是圆心在 <span class=\"tex\">(1,0)</span>、半径 1 的圆，取 <span class=\"tex\">\\theta\\in[-\\frac{\\pi}{2},\\frac{\\pi}{2}]</span> 恰好扫过一圈。",
          "<span class=\"tex\">A=\\frac12\\int_{-\\pi/2}^{\\pi/2}4\\cos^{2}\\theta\\,d\\theta=2\\int_{-\\pi/2}^{\\pi/2}\\frac{1+\\cos2\\theta}{2}\\,d\\theta</span>。",
          "正弦项在对称区间积分为 0，得 <span class=\"tex\">A=\\pi</span>，与圆面积 <span class=\"tex\">\\pi\\cdot1^{2}</span> 一致。",
        ] },
        { tip: "极坐标先画草图定 <span class=\"tex\">\\theta</span> 的起止角，并检查该区间内 <span class=\"tex\">r\\ge0</span>；重复扫过的区域会被重复计面积。参数曲线还要注意 <span class=\"tex\">x'(t)</span> 的符号，面积取绝对值。" },
      ],
    },
    {
      id: "diffeq",
      cat: "integral",
      tag: "微分方程",
      title: "可分离变量与逻辑斯蒂方程",
      lead: "微分方程把导数当作未知函数来解。可分离变量 (separable) 靠两边积分；逻辑斯蒂方程 (logistic) 是 BC 指定的建模重点。",
      blocks: [
        { h: "1 · 可分离变量" },
        "若 <span class=\"tex\">\\frac{dy}{dx}=f(x)g(y)</span>，把含 <b>y</b> 的移到左边、含 <b>x</b> 的移到右边：",
        { tex: "\\int\\frac{dy}{g(y)}=\\int f(x)\\,dx+C" },
        { steps: [
          "解 <span class=\"tex\">\\frac{dy}{dx}=xy</span>。分离：<span class=\"tex\">\\frac{dy}{y}=x\\,dx</span>。",
          "两边积分：<span class=\"tex\">\\ln|y|=\\frac{x^{2}}{2}+C</span>。",
          "指数化：<span class=\"tex\">|y|=e^{C}e^{x^{2}/2}</span>，把 <span class=\"tex\">\\pm e^{C}</span> 记成新常数 <span class=\"tex\">A</span>。",
          "通解 <span class=\"tex\">y=Ae^{x^{2}/2}</span>；若有初值，最后代回求 <span class=\"tex\">A</span>。",
        ] },
        { h: "2 · 逻辑斯蒂方程" },
        { tex: "\\frac{dP}{dt}=kP\\left(1-\\frac{P}{M}\\right)" },
        { ul: [
          "<span class=\"tex\">M</span> 是<b>环境容纳量 (carrying capacity)</b>，<span class=\"tex\">P=M</span> 是稳定平衡解",
          "解为 <span class=\"tex\">P(t)=\\frac{M}{1+Ae^{-kt}}</span>，图形是 S 形",
          "增长最快发生在 <span class=\"tex\">P=\\frac{M}{2}</span> 处，这是常考结论",
        ] },
        { tip: "分离时除以 <span class=\"tex\">g(y)</span> 可能丢掉 <span class=\"tex\">g(y)=0</span> 的常数解，记得单独检查；<span class=\"tex\">\\int\\frac{dy}{y}=\\ln|y|</span> 的绝对值不能省。" },
      ],
    },
    {
      id: "average-accum",
      cat: "integral",
      tag: "累积",
      title: "平均值与累积函数",
      lead: "积分不仅算面积，还把『变化率』累积成『总量』。平均值、位移与路程、累积函数都是同一个观点的不同外衣。",
      blocks: [
        { h: "1 · 平均值 average value" },
        { tex: "f_{\\text{avg}}=\\frac{1}{b-a}\\int_a^b f(x)\\,dx" },
        { steps: [
          "求 <span class=\"tex\">f(x)=\\sin x</span> 在 <span class=\"tex\">[0,\\pi]</span> 上的平均值。",
          "<span class=\"tex\">\\int_0^{\\pi}\\sin x\\,dx=[-\\cos x]_0^{\\pi}=2</span>。",
          "除以区间长度 <span class=\"tex\">\\pi</span>，得 <span class=\"tex\">f_{\\text{avg}}=\\frac{2}{\\pi}</span>。",
          "积分中值定理保证存在某个 <span class=\"tex\">c</span> 使 <span class=\"tex\">f(c)=f_{\\text{avg}}</span>。",
        ] },
        { h: "2 · 累积函数 accumulation" },
        "若 <span class=\"tex\">F(x)=\\int_a^x f(t)\\,dt</span>，则 <span class=\"tex\">F'=f</span>，<span class=\"tex\">F''=f'</span>。看 <span class=\"tex\">F</span> 的增减看 <span class=\"tex\">f</span> 的正负，看凹凸看 <span class=\"tex\">f</span> 的增减。",
        { ul: [
          "<b>速度 v</b> 积分得位移 <span class=\"tex\">\\int v\\,dt</span>；<b>速率 |v|</b> 积分得路程",
          "总量 = 变化率的积分：流量积分得总量，边际成本积分得总成本",
          "<span class=\"tex\">F(b)-F(a)=\\int_a^b f</span>，净变化永远是带符号的",
        ] },
        { tip: "题目问『总路程』先找速度变号点分段取绝对值；问『位移』直接积分速度即可。" },
      ],
    },
  ];

  function byCat() {
    var map = {};
    var order = [];
    for (var i = 0; i < articles.length; i++) {
      var a = articles[i];
      if (!map[a.cat]) { map[a.cat] = []; order.push(a.cat); }
      map[a.cat].push(a);
    }
    var known = categories.filter(function (c) { return map[c.id]; }).map(function (c) {
      return { id: c.id, label: c.label, items: map[c.id] };
    });
    var extra = order.filter(function (id) {
      return !categories.some(function (c) { return c.id === id; });
    }).map(function (id) { return { id: id, label: id, items: map[id] }; });
    return known.concat(extra);
  }

  function find(id) {
    for (var i = 0; i < articles.length; i++) {
      if (articles[i].id === id) return articles[i];
    }
    return null;
  }

  function esc(s) {
    return String(s == null ? "" : s); // 文案由本项目维护，直接当 HTML 用
  }

  function blocksHtml(blocks) {
    if (!blocks || !blocks.length) return "";
    return blocks.map(function (b) {
      if (typeof b === "string") return "<p>" + esc(b) + "</p>";
      if (b.h) return "<h4 class=\"note-h\">" + esc(b.h) + "</h4>";
      if (b.tex) return "<div class=\"formula-block tex-display\">" + esc(b.tex) + "</div>";
      if (b.ul) return "<ul class=\"note-ul\">" + b.ul.map(function (x) {
        return "<li>" + esc(x) + "</li>";
      }).join("") + "</ul>";
      if (b.steps) return "<ol class=\"note-steps\">" + b.steps.map(function (x) {
        return "<li>" + esc(x) + "</li>";
      }).join("") + "</ol>";
      if (b.tip) return "<div class=\"note-callout\"><b>提示 · Tip</b><br>" + esc(b.tip) + "</div>";
      return "";
    }).join("");
  }

  return {
    categories: categories,
    articles: articles,
    byCat: byCat,
    find: find,
    blocksHtml: blocksHtml,
  };
})();
