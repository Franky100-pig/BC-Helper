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
 *     { fig: "key", cap: "..." } -> 内联 SVG 图示（key 见 figures）
 *
 * 中文优先，关键概念保留英文原名；公式符号按英文教材写法。
 * 内容是静态文案，直接当 HTML 用，所以 < 写成 &lt;、> 写成 &gt;。
 * 新增一篇只需往 articles 里加一项，目录页会自动出现。
 */
window.BC_NOTES = (function () {
  /* 按 College Board AP Calculus BC CED（2026–27 澄清版，章节内容未变）的
   * 10 个官方 Unit 组织。weight 为官方选择题占比；topics 是官方主题顺序，
   * 单元的「总览」文章据此显示哪些主题已覆盖、哪些还待补。 */
  var categories = [
    { id: "u1", weight: "5–10%", label: "Unit 1 · 极限与连续 (Limits and Continuity) · 5–10%", topics: [
      { n: "1.1", t: "瞬时的变化：变化率导论 (Can Change Occur at an Instant?)" },
      { n: "1.2", t: "极限的定义与记号 (Defining Limits and Limit Notation)" },
      { n: "1.3", t: "从图像估计极限 (Estimating Limits from Graphs)" },
      { n: "1.4", t: "从表格估计极限 (Estimating Limits from Tables)" },
      { n: "1.5", t: "用极限的代数性质求极限 (Algebraic Properties)" },
      { n: "1.6", t: "用代数变形求极限 (Algebraic Manipulation)" },
      { n: "1.7", t: "选择求极限的方法 (Selecting Procedures)" },
      { n: "1.8", t: "夹逼定理 (Squeeze Theorem)" },
      { n: "1.9", t: "极限的多种表示法 (Multiple Representations)" },
      { n: "1.10", t: "间断点的类型 (Types of Discontinuities)" },
      { n: "1.11", t: "一点连续的定义 (Continuity at a Point)" },
      { n: "1.12", t: "区间上连续 (Continuity over an Interval)" },
      { n: "1.13", t: "可去间断点 (Removing Discontinuities)" },
      { n: "1.14", t: "无穷极限与竖直渐近线 (Infinite Limits)" },
      { n: "1.15", t: "无穷远极限与水平渐近线 (Limits at Infinity)" },
      { n: "1.16", t: "介值定理 IVT (Intermediate Value Theorem)" },
    ] },
    { id: "u2", weight: "5–10%", label: "Unit 2 · 导数的定义与基本性质 (Definition and Fundamental Properties) · 5–10%", topics: [
      { n: "2.1", t: "一点的平均与瞬时变化率 (Average and Instantaneous Rates)" },
      { n: "2.2", t: "导数的定义与记号 (Defining the Derivative)" },
      { n: "2.3", t: "从数值估计导数 (Estimating Derivatives)" },
      { n: "2.4", t: "可导与连续的关系 (Differentiability and Continuity)" },
      { n: "2.5", t: "幂法则 (Power Rule)" },
      { n: "2.6", t: "常数、和差、常数倍法则 (Basic Derivative Rules)" },
      { n: "2.7", t: "cos x、sin x、e^x、ln x 的导数" },
      { n: "2.8", t: "乘积法则 (Product Rule)" },
      { n: "2.9", t: "商法则 (Quotient Rule)" },
      { n: "2.10", t: "正切/余切/正割/余割的导数" },
    ] },
    { id: "u3", weight: "5–10%", label: "Unit 3 · 复合、隐函数与反函数求导 (Composite, Implicit, and Inverse) · 5–10%", topics: [
      { n: "3.1", t: "链式法则 (The Chain Rule)" },
      { n: "3.2", t: "隐函数求导 (Implicit Differentiation)" },
      { n: "3.3", t: "反函数求导 (Differentiating Inverse Functions)" },
      { n: "3.4", t: "反三角函数求导 (Inverse Trigonometric Functions)" },
      { n: "3.5", t: "选择求导方法 (Selecting Procedures)" },
      { n: "3.6", t: "高阶导数 (Higher-Order Derivatives)" },
    ] },
    { id: "u4", weight: "5–10%", label: "Unit 4 · 导数的情境应用 (Contextual Applications) · 5–10%", topics: [
      { n: "4.1", t: "导数在情境中的含义 (Derivative in Context)" },
      { n: "4.2", t: "直线运动：位置、速度、加速度 (Straight-Line Motion)" },
      { n: "4.3", t: "非运动情境中的变化率 (Rates in Applied Contexts)" },
      { n: "4.4", t: "相关变化率入门 (Introduction to Related Rates)" },
      { n: "4.5", t: "求解相关变化率 (Solving Related Rates)" },
      { n: "4.6", t: "局部线性与线性近似 (Linearization)" },
      { n: "4.7", t: "洛必达法则求未定式 (L’Hospital’s Rule)" },
    ] },
    { id: "u5", weight: "10–15%", label: "Unit 5 · 导数的分析应用 (Analytical Applications) · 10–15%", topics: [
      { n: "5.1", t: "中值定理 (Mean Value Theorem)" },
      { n: "5.2", t: "极值定理、全局/局部极值与临界点 (EVT & Critical Points)" },
      { n: "5.3", t: "函数的增减区间 (Increasing / Decreasing)" },
      { n: "5.4", t: "一阶导数判定法 (First Derivative Test)" },
      { n: "5.5", t: "候选点法求全局极值 (Candidates Test)" },
      { n: "5.6", t: "凹凸性 (Concavity)" },
      { n: "5.7", t: "二阶导数判定法 (Second Derivative Test)" },
      { n: "5.8", t: "函数及其导数的图像 (Sketching Graphs)" },
      { n: "5.9", t: "函数、一阶导、二阶导的联系 (Connecting f, f', f'')" },
      { n: "5.10", t: "最优化问题入门 (Introduction to Optimization)" },
      { n: "5.11", t: "求解最优化问题 (Solving Optimization)" },
      { n: "5.12", t: "隐函数关系的行为 (Implicit Relations)" },
    ] },
    { id: "u6", weight: "15–20%", label: "Unit 6 · 积分与累积的变化 (Integration and Accumulation) · 15–20%", topics: [
      { n: "6.1", t: "探索累积变化 (Accumulations of Change)" },
      { n: "6.2", t: "用黎曼和近似面积 (Riemann Sums)" },
      { n: "6.3", t: "黎曼和、求和记号与定积分记号 (Definite Integral Notation)" },
      { n: "6.4", t: "微积分基本定理与累积函数 (FTC and Accumulation)" },
      { n: "6.5", t: "含面积的累积函数行为 (Behavior of Accumulation Functions)" },
      { n: "6.6", t: "定积分的性质 (Properties of Definite Integrals)" },
      { n: "6.7", t: "微积分基本定理与定积分 (FTC and Definite Integrals)" },
      { n: "6.8", t: "原函数与不定积分：基本规则 (Antiderivatives)" },
      { n: "6.9", t: "换元积分 (Integration by Substitution)" },
      { n: "6.10", t: "长除法与配方法积分 (Long Division / Completing Square)" },
      { n: "6.11", t: "分部积分 (Integration by Parts) · BC only" },
      { n: "6.12", t: "线性部分分式 (Linear Partial Fractions) · BC only" },
      { n: "6.13", t: "广义积分 (Improper Integrals) · BC only" },
      { n: "6.14", t: "选择反求导方法 (Selecting Antidifferentiation Techniques)" },
    ] },
    { id: "u7", weight: "5–10%", label: "Unit 7 · 微分方程 (Differential Equations) · 5–10%", topics: [
      { n: "7.1", t: "用微分方程建模 (Modeling with Differential Equations)" },
      { n: "7.2", t: "验证微分方程的解 (Verifying Solutions)" },
      { n: "7.3", t: "画斜率场 (Sketching Slope Fields)" },
      { n: "7.4", t: "用斜率场推理 (Reasoning with Slope Fields)" },
      { n: "7.5", t: "欧拉方法近似解 (Euler’s Method) · BC only" },
      { n: "7.6", t: "分离变量求通解 (Separation of Variables)" },
      { n: "7.7", t: "初值条件与特解 (Initial Conditions)" },
      { n: "7.8", t: "指数模型 (Exponential Models)" },
      { n: "7.9", t: "逻辑斯蒂模型 (Logistic Models) · BC only" },
    ] },
    { id: "u8", weight: "5–10%", label: "Unit 8 · 积分的应用 (Applications of Integration) · 5–10%", topics: [
      { n: "8.1", t: "区间上函数的平均值 (Average Value)" },
      { n: "8.2", t: "用积分联系位置、速度、加速度 (Motion with Integrals)" },
      { n: "8.3", t: "累积函数与定积分的情境应用 (Applied Accumulation)" },
      { n: "8.4", t: "x 为自变量的曲线间面积 (Area Between Curves in x)" },
      { n: "8.5", t: "y 为自变量的曲线间面积 (Area Between Curves in y)" },
      { n: "8.6", t: "交点超过两个的曲线面积 (More Than Two Intersections)" },
      { n: "8.7", t: "正方形/长方形截面体积 (Cross Sections: Squares/Rectangles)" },
      { n: "8.8", t: "三角形/半圆截面体积 (Cross Sections: Triangles/Semicircles)" },
      { n: "8.9", t: "圆盘法：绕 x 或 y 轴 (Disc Method)" },
      { n: "8.10", t: "圆盘法：绕其他轴 (Disc Method, Other Axes)" },
      { n: "8.11", t: "圆环法：绕 x 或 y 轴 (Washer Method)" },
      { n: "8.12", t: "圆环法：绕其他轴 (Washer Method, Other Axes)" },
      { n: "8.13", t: "弧长与路程 (Arc Length) · BC only" },
    ] },
    { id: "u9", weight: "10–15%", label: "Unit 9 · 参数方程、极坐标与向量函数 (BC only) · 10–15%", topics: [
      { n: "9.1", t: "参数方程的定义与求导 (Parametric Equations)" },
      { n: "9.2", t: "参数方程的二阶导 (Second Derivatives)" },
      { n: "9.3", t: "参数曲线的弧长 (Parametric Arc Length)" },
      { n: "9.4", t: "向量值函数的定义与求导 (Vector-Valued Functions)" },
      { n: "9.5", t: "向量值函数的积分 (Integrating Vector-Valued Functions)" },
      { n: "9.6", t: "参数/向量函数解决运动问题 (Motion Problems)" },
      { n: "9.7", t: "极坐标与极坐标求导 (Polar Coordinates)" },
      { n: "9.8", t: "单条极坐标曲线的面积 (Area of a Polar Region)" },
      { n: "9.9", t: "两条极坐标曲线之间的面积 (Area Between Polar Curves)" },
    ] },
    { id: "u10", weight: "15–20%", label: "Unit 10 · 无穷序列与级数 (BC only) · 15–20%", topics: [
      { n: "10.1", t: "收敛与发散级数的定义 (Convergent / Divergent Series)" },
      { n: "10.2", t: "几何级数 (Geometric Series)" },
      { n: "10.3", t: "第 n 项发散检验 (nth Term Test)" },
      { n: "10.4", t: "积分判别法 (Integral Test)" },
      { n: "10.5", t: "调和级数与 p 级数 (Harmonic / p-Series)" },
      { n: "10.6", t: "比较判别法 (Comparison Tests)" },
      { n: "10.7", t: "交错级数判别法 (Alternating Series Test)" },
      { n: "10.8", t: "比值判别法 (Ratio Test)" },
      { n: "10.9", t: "绝对收敛与条件收敛 (Absolute / Conditional)" },
      { n: "10.10", t: "交错级数误差界 (Alternating Series Error Bound)" },
      { n: "10.11", t: "泰勒多项式近似 (Taylor Polynomials)" },
      { n: "10.12", t: "拉格朗日误差界 (Lagrange Error Bound)" },
      { n: "10.13", t: "幂级数的收敛半径与区间 (Radius / Interval)" },
      { n: "10.14", t: "泰勒/麦克劳林级数 (Taylor / Maclaurin Series)" },
      { n: "10.15", t: "用幂级数表示函数 (Representing Functions)" },
    ] },
  ];

  /* 内联 SVG 图示注册表。每篇讲义按需往这里加自己的图：
   * 视图框统一 0 0 640 300 左右，颜色全部走 CSS 变量，随深浅主题自动切换，
   * 不依赖网络 / canvas，离线可用。键名即 blocks 里 { fig: "键名" } 的引用。 */
  var figures = {};
  figures["mvt"] = `<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mean Value Theorem secant and parallel tangent"><line class="fig-axis" x1="60.0" y1="250.0" x2="600.0" y2="250.0"/><line class="fig-axis" x1="60.0" y1="28.0" x2="60.0" y2="250.0"/><line class="fig-axis" x1="127.5" y1="246.0" x2="127.5" y2="254.0"/><text class="fig-small" x="127.5" y="268.0" text-anchor="middle">a</text><line class="fig-axis" x1="271.3" y1="246.0" x2="271.3" y2="254.0"/><text class="fig-small" x="271.3" y="268.0" text-anchor="middle">c</text><line class="fig-axis" x1="532.5" y1="246.0" x2="532.5" y2="254.0"/><text class="fig-small" x="532.5" y="268.0" text-anchor="middle">b</text><text class="fig-label" x="594.0" y="240.0" text-anchor="end">x</text><text class="fig-label" x="70.0" y="42.0">y</text><path class="fig-curve" d="M100.5 151.1 L103.5 152.5 L106.4 153.9 L109.4 155.2 L112.3 156.4 L115.3 157.6 L118.2 158.8 L121.2 159.9 L124.1 161.0 L127.1 162.0 L130.0 163.0 L133.0 163.9 L135.9 164.8 L138.9 165.6 L141.8 166.4 L144.8 167.1 L147.8 167.8 L150.7 168.5 L153.7 169.1 L156.6 169.7 L159.6 170.2 L162.5 170.7 L165.5 171.1 L168.4 171.6 L171.4 171.9 L174.3 172.3 L177.3 172.6 L180.2 172.8 L183.2 173.0 L186.1 173.2 L189.1 173.4 L192.0 173.5 L195.0 173.5 L198.0 173.6 L200.9 173.6 L203.9 173.5 L206.8 173.5 L209.8 173.4 L212.7 173.2 L215.7 173.1 L218.6 172.9 L221.6 172.6 L224.5 172.4 L227.5 172.1 L230.4 171.8 L233.4 171.4 L236.3 171.0 L239.3 170.6 L242.2 170.2 L245.2 169.7 L248.2 169.2 L251.1 168.7 L254.1 168.2 L257.0 167.6 L260.0 167.0 L262.9 166.4 L265.9 165.7 L268.8 165.0 L271.8 164.3 L274.7 163.6 L277.7 162.9 L280.6 162.1 L283.6 161.3 L286.5 160.5 L289.5 159.7 L292.5 158.8 L295.4 157.9 L298.4 157.1 L301.3 156.1 L304.3 155.2 L307.2 154.3 L310.2 153.3 L313.1 152.3 L316.1 151.3 L319.0 150.3 L322.0 149.3 L324.9 148.2 L327.9 147.2 L330.8 146.1 L333.8 145.0 L336.8 143.9 L339.7 142.8 L342.7 141.7 L345.6 140.5 L348.6 139.4 L351.5 138.2 L354.5 137.0 L357.4 135.8 L360.4 134.6 L363.3 133.4 L366.3 132.2 L369.2 131.0 L372.2 129.8 L375.1 128.5 L378.1 127.3 L381.0 126.0 L384.0 124.8 L387.0 123.5 L389.9 122.2 L392.9 121.0 L395.8 119.7 L398.8 118.4 L401.7 117.1 L404.7 115.8 L407.6 114.5 L410.6 113.3 L413.5 112.0 L416.5 110.7 L419.4 109.4 L422.4 108.1 L425.3 106.8 L428.3 105.5 L431.2 104.2 L434.2 102.9 L437.2 101.6 L440.1 100.3 L443.1 99.0 L446.0 97.8 L449.0 96.5 L451.9 95.2 L454.9 94.0 L457.8 92.7 L460.8 91.4 L463.7 90.2 L466.7 89.0 L469.6 87.7 L472.6 86.5 L475.5 85.3 L478.5 84.1 L481.5 82.9 L484.4 81.7 L487.4 80.5 L490.3 79.3 L493.3 78.2 L496.2 77.0 L499.2 75.9 L502.1 74.8 L505.1 73.7 L508.0 72.6 L511.0 71.5 L513.9 70.4 L516.9 69.4 L519.8 68.3 L522.8 67.3 L525.8 66.3 L528.7 65.3 L531.7 64.3 L534.6 63.4 L537.6 62.5 L540.5 61.5 L543.5 60.6 L546.4 59.8 L549.4 58.9 L552.3 58.1 L555.3 57.2 L558.2 56.5 L561.2 55.7 L564.1 54.9 L567.1 54.2 L570.0 53.5 L573.0 52.8"/><line class="fig-dash fig-curve2" x1="127.5" y1="162.1" x2="532.5" y2="64.1"/><line class="fig-curve2" x1="156.5" y1="192.2" x2="386.0" y2="136.7"/><circle class="fig-pt" cx="271.3" cy="164.5" r="4.5"/><text class="fig-label" x="279.3" y="156.5">P(c, f(c))</text><text class="fig-small" x="411.0" y="42.8" fill="var(--accent2)">割线斜率 = 切线斜率 = f prime(c)</text></svg>`;

  var articles = [
    {
      id: "u1-overview",
      cat: "u1",
      topics: [],
      tag: "总览",
      title: "Unit 1 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u1" },
      ],
    },
    {
      id: "limit-instant",
      cat: "u1",
      topics: ["1.1"],
      tag: "概念",
      title: "瞬时变化率导论：变化能发生在一瞬间吗？",
      lead: "从平均变化率出发，让时间间隔越来越小，就逼近了瞬时变化率。这是极限思想的第一次登场——导数还没正式定义，但你已经知道它要算什么。",
      blocks: [
        { h: "1 · 平均变化率：一段时间里的变化" },
        "车在两小时里走了 120 英里，平均速度是 60 英里/时。它描述的是一整段的整体变化，图像上就是割线（secant line）的斜率：",
        { tex: "\\frac{\\Delta y}{\\Delta x}=\\frac{f(a+h)-f(a)}{h}" },
        { ul: [
          "<span class=\"tex\">h</span> 是时间间隔，不能为 0",
          "<span class=\"tex\">\\Delta y</span> 是对应的函数值变化",
          "它只告诉你这段的平均，不告诉你某一刻的快慢",
        ] },
        { h: "2 · 让间隔缩到 0：瞬时变化率" },
        "把 <span class=\"tex\">h</span> 取越来越小（0.1、0.01、0.001…），平均变化率会趋向一个固定的数。这个过程就是取极限，得到的就是 <span class=\"tex\">x=a</span> 处的瞬时变化率（instantaneous rate of change），也就是后面正式定义的导数：",
        { tex: "\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}" },
        "图像上看，割线绕着点 <span class=\"tex\">P</span> 转动，越来越贴近切线（tangent line）的斜率。",
        { h: "3 · 例题：自由落体在某一秒的速度" },
        "物体下落距离 <span class=\"tex\">s(t)=16t^{2}</span>（英尺），求 <span class=\"tex\">t=2</span> 秒时的瞬时速度：",
        { steps: [
          "① 先算区间 <span class=\"tex\">[2,\,2+h]</span> 上的平均速度 <span class=\"tex\">\\dfrac{s(2+h)-s(2)}{h}</span>。",
          "② 展开：<span class=\"tex\">s(2+h)=16(2+h)^{2}=64+64h+16h^{2}</span>，而 <span class=\"tex\">s(2)=64</span>。",
          "③ 差商 <span class=\"tex\">=\\dfrac{64h+16h^{2}}{h}=64+16h</span>（<span class=\"tex\">h\\neq0</span>）。",
          "④ 令 <span class=\"tex\">h\\to0</span>：<span class=\"tex\">v(2)=64</span> 英尺/秒。注意全程没有把 <span class=\"tex\">h=0</span> 代进去。",
        ] },
        { h: "4 · 「一瞬间」在数学上是什么意思" },
        "瞬时速度不是把 <span class=\"tex\">\\Delta t=0</span> 代入（那会得到 <span class=\"tex\">0/0</span>），而是看 <span class=\"tex\">\\Delta t\\to0</span> 时比值的趋势。AP 不考哲学，但这个逻辑要能说清楚。",
        { tip: "最常见的坑：把 <span class=\"tex\">h=0</span> 直接代进差商得到 <span class=\"tex\">0/0</span> 就下结论「无定义」。<span class=\"tex\">0/0</span> 是未定式（indeterminate form），意思是信息不够、要先化简再取极限。另一个坑：把平均变化率当成瞬时变化率——题目问 at <span class=\"tex\">t=a</span> 时，一定要取极限。" },
      ],
    },
    {
      id: "limit-def",
      cat: "u1",
      topics: ["1.2"],
      tag: "基础",
      title: "极限的定义与记号",
      lead: "<span class=\"tex\">\\lim</span> 读做「当 <span class=\"tex\">x</span> 趋近 <span class=\"tex\">a</span> 时 <span class=\"tex\">f(x)</span> 的极限」。它只关心 <span class=\"tex\">x</span> 靠近 <span class=\"tex\">a</span> 时函数在干什么，完全不管 <span class=\"tex\">f(a)</span> 本身有没有定义、等不等于极限值。",
      blocks: [
        { h: "1 · 记号怎么读" },
        { tex: "\\lim_{x\\to a}f(x)=L" },
        { ul: [
          "<span class=\"tex\">x\\to a</span>：<span class=\"tex\">x</span> 从左右两侧无限靠近 <span class=\"tex\">a</span>，但不等于 <span class=\"tex\">a</span>",
          "<span class=\"tex\">L</span> 是一个确定的有限数",
          "「极限存在」= 左右极限都存在而且相等",
        ] },
        { h: "2 · 单侧极限 one-sided limits" },
        { tex: "\\lim_{x\\to a^-}f(x)=L^{-}\\qquad\\lim_{x\\to a^+}f(x)=L^{+}" },
        "双侧极限存在的充要条件：",
        { tex: "\\lim_{x\\to a}f(x)=L\\iff\\lim_{x\\to a^-}f(x)=\\lim_{x\\to a^+}f(x)=L" },
        { h: "3 · 极限值不等于函数值" },
        "经典的分段函数：当 <span class=\"tex\">x\\neq2</span> 时 <span class=\"tex\">f(x)=x^{2}</span>，而 <span class=\"tex\">f(2)=10</span>。此时极限看的是「接近」而不是「到达」：",
        { tex: "\\lim_{x\\to2}f(x)=4\\neq f(2)=10" },
        "所以 <span class=\"tex\">a</span> 根本不必在定义域里，例如 <span class=\"tex\">\\lim_{x\\to0}\\dfrac{\\sin x}{x}=1</span>，尽管 <span class=\"tex\">x=0</span> 处没有定义。",
        { h: "4 · 什么时候极限不存在 DNE" },
        { ul: [
          "左右极限不相等（跳跃，jump）",
          "函数值无限增大或减小（无穷极限，写 <span class=\"tex\">\\infty</span> 或 <span class=\"tex\">-\\infty</span>；严格说不是有限极限）",
          "在附近无限振荡，例如 <span class=\"tex\">x\\to0</span> 时的 <span class=\"tex\">\\sin(1/x)</span>",
        ] },
        { tip: "写 DNE 要先说理由：是左右不等，还是趋于无穷，还是振荡——AP 阅卷常要求一句话说明。另一个常见错误是看到空心点就以为极限不存在：空心点只影响 <span class=\"tex\">f(a)</span>，不影响 <span class=\"tex\">\\lim_{x\\to a}f(x)</span>。" },
      ],
    },
    {
      id: "limit-manip",
      cat: "u1",
      topics: ["1.6"],
      tag: "方法",
      title: "代数变形求极限：0/0 与 ∞/∞ 怎么处理",
      lead: "直接代入得到 <span class=\"tex\">0/0</span> 或 <span class=\"tex\">\\infty/\\infty</span> 不代表极限不存在，只是代表信息不够。先做代数变形，把造成未定式的因子消掉，再代入。",
      blocks: [
        { h: "1 · 三步流程" },
        { ul: [
          "先直接代入：算出有限数就结束（多项式、在定义域内的有理式都能直接代）",
          "得到 <span class=\"tex\">0/0</span>：想办法消去造成它的因子——因式分解、有理化、通分、化简复合式",
          "化简后重新代入求值",
        ] },
        { h: "2 · 因式分解 factoring" },
        "例：<span class=\"tex\">\\lim_{x\\to2}\\dfrac{x^{2}-4}{x-2}</span>，代入是 <span class=\"tex\">0/0</span>，先分解分子：",
        { steps: [
          "① <span class=\"tex\">x^{2}-4=(x-2)(x+2)</span>。",
          "② 当 <span class=\"tex\">x\\neq2</span> 时，<span class=\"tex\">\\dfrac{x^{2}-4}{x-2}=x+2</span>。",
          "③ 极限只看 <span class=\"tex\">x</span> 靠近 2、不等于 2 时的值，所以结果是 <span class=\"tex\">2+2=4</span>。",
        ] },
        { tex: "\\lim_{x\\to2}\\frac{x^{2}-4}{x-2}=\\lim_{x\\to2}(x+2)=4" },
        { h: "3 · 有理化 rationalizing" },
        "例：<span class=\"tex\">\\lim_{x\\to0}\\dfrac{\\sqrt{x+1}-1}{x}</span>，也是 <span class=\"tex\">0/0</span>。分子分母同乘共轭式 <span class=\"tex\">\\sqrt{x+1}+1</span>：",
        { steps: [
          "① 分子乘共轭：<span class=\"tex\">(\\sqrt{x+1}-1)(\\sqrt{x+1}+1)=(x+1)-1=x</span>。",
          "② 原式 <span class=\"tex\">=\\dfrac{x}{x(\\sqrt{x+1}+1)}=\\dfrac{1}{\\sqrt{x+1}+1}</span>（<span class=\"tex\">x\\neq0</span>）。",
          "③ 代入 <span class=\"tex\">x=0</span>：<span class=\"tex\">\\dfrac{1}{1+1}=\\dfrac{1}{2}</span>。",
        ] },
        { tex: "\\lim_{x\\to0}\\frac{\\sqrt{x+1}-1}{x}=\\lim_{x\\to0}\\frac{1}{\\sqrt{x+1}+1}=\\frac{1}{2}" },
        { h: "4 · ∞/∞：分子分母同除最高次" },
        "例：<span class=\"tex\">\\lim_{x\\to\\infty}\\dfrac{3x^{2}+1}{2x^{2}-x}</span>，分子分母同除以 <span class=\"tex\">x^{2}</span>：",
        { tex: "\\lim_{x\\to\\infty}\\frac{3+\\frac{1}{x^{2}}}{2-\\frac{1}{x}}=\\frac{3}{2}" },
        { ul: [
          "同次 → 最高次系数之比",
          "分子次数更高 → 结果是 <span class=\"tex\">\\infty</span> 或 <span class=\"tex\">-\\infty</span>",
          "分母次数更高 → 结果是 0",
        ] },
        { tip: "<span class=\"tex\">0/0</span> 不等于 0，<span class=\"tex\">\\infty/\\infty</span> 也不等于 1——看到这两种就必须继续变形。约分只在 <span class=\"tex\">x\\neq a</span> 的前提下合法，而极限本来就不看 <span class=\"tex\">x=a</span> 那一点，所以这样做是对的；但别把化简后的函数当成处处等于原函数。" },
      ],
    },
    {
      id: "limit-procedure",
      cat: "u1",
      topics: ["1.7"],
      tag: "策略",
      title: "选择求极限的方法：考场决策流程",
      lead: "BC 考求极限很少考硬算，更多是考你会不会先判断该用哪一招。按下面的顺序筛查，基本不会卡住。",
      blocks: [
        { h: "1 · 第一步：先代入" },
        "把 <span class=\"tex\">a</span> 代进 <span class=\"tex\">f(x)</span>，看得到什么：",
        { ul: [
          "有限数 → 完成（多项式、定义域内的有理式可直接代）",
          "<span class=\"tex\">c/0</span>（<span class=\"tex\">c\\neq0</span>）→ 竖直渐近线，答案是 <span class=\"tex\">\\pm\\infty</span>，左右异号时写 DNE",
          "<span class=\"tex\">0/0</span> 或 <span class=\"tex\">\\infty/\\infty</span> → 未定式，转下一步",
        ] },
        { h: "2 · 0/0 的处理顺序" },
        { steps: [
          "① 能因式分解就先分解（有理式、多项式）。",
          "② 有根号就乘共轭有理化。",
          "③ 有繁分数就通分，化成一个分式。",
          "④ 有三角函数就用恒等式，或引用 <span class=\"tex\">\\lim_{x\\to0}\\dfrac{\\sin x}{x}=1</span>。",
          "⑤ BC 后面还有洛必达法则（Unit 4.7），但 Unit 1 阶段先用代数方法。",
        ] },
        { h: "3 · 看不出来时换表示" },
        { ul: [
          "给图像：直接读左右极限，注意空心点与实心点的区别",
          "给表格：看 <span class=\"tex\">x</span> 从两侧靠近时 <span class=\"tex\">f(x)</span> 的趋势，别只盯着某一格",
          "要分左右：分段函数、绝对值、<span class=\"tex\">\\sqrt{x^{2}}=|x|</span> 尤其要小心",
        ] },
        { h: "4 · 例题：绝对值要分左右" },
        "求 <span class=\"tex\">\\lim_{x\\to1}\\dfrac{|x-1|}{x-1}</span>：",
        { steps: [
          "① <span class=\"tex\">x>1</span> 时 <span class=\"tex\">|x-1|=x-1</span>，<span class=\"tex\">f(x)=1</span>，右极限 = 1。",
          "② <span class=\"tex\">x&lt;1</span> 时 <span class=\"tex\">|x-1|=-(x-1)</span>，<span class=\"tex\">f(x)=-1</span>，左极限 = -1。",
          "③ 左右不相等，所以双侧极限 DNE。",
        ] },
        { tex: "\\lim_{x\\to1^+}\\frac{|x-1|}{x-1}=1,\\quad\\lim_{x\\to1^-}\\frac{|x-1|}{x-1}=-1\\ \\implies\\ \\mathrm{DNE}" },
        { tip: "「先代入、再分类、最后才计算」是考场上最省时间的顺序。表格只能用来估计极限，不能证明它存在；题目给表格时，答案是趋势而不是某一行的数值。" },
      ],
    },
    {
      id: "squeeze",
      cat: "u1",
      topics: ["1.8"],
      tag: "定理",
      title: "夹逼定理 Squeeze Theorem",
      lead: "函数本身不好算，但能找到两个更好算的函数从上下夹住它——两端的极限相同，中间那个就被逼到同一个值。",
      blocks: [
        { h: "1 · 定理怎么说" },
        "如果在 <span class=\"tex\">a</span> 附近（除 <span class=\"tex\">a</span> 本身外）恒有 <span class=\"tex\">g(x)\\le f(x)\\le h(x)</span>，且 <span class=\"tex\">g</span> 和 <span class=\"tex\">h</span> 都趋于 <span class=\"tex\">L</span>：",
        { tex: "g(x)\\le f(x)\\le h(x),\\quad \\lim_{x\\to a}g(x)=\\lim_{x\\to a}h(x)=L\\ \\implies\\ \\lim_{x\\to a}f(x)=L" },
        { ul: [
          "只要求在 <span class=\"tex\">a</span> 附近成立，不要求在 <span class=\"tex\">a</span> 点成立",
          "两边极限必须相等，否则夹不住",
          "图像上：上下两条曲线在 <span class=\"tex\">a</span> 处汇合，中间那条只能跟着汇合",
        ] },
        { h: "2 · 经典例题：x² sin(1/x)" },
        "求 <span class=\"tex\">\\lim_{x\\to0}x^{2}\\sin\\!\\left(\\dfrac{1}{x}\\right)</span>。<span class=\"tex\">\\sin(1/x)</span> 在 0 附近无限振荡、本身没有极限，但它是有界的：",
        { steps: [
          "① 对所有 <span class=\"tex\">x\\neq0</span>：<span class=\"tex\">-1\\le\\sin(1/x)\\le1</span>。",
          "② 同乘非负的 <span class=\"tex\">x^{2}</span>：<span class=\"tex\">-x^{2}\\le x^{2}\\sin(1/x)\\le x^{2}</span>。",
          "③ 两端在 <span class=\"tex\">x\\to0</span> 时都趋于 0。",
          "④ 由夹逼定理，中间那项的极限也是 0。",
        ] },
        { tex: "-x^{2}\\le x^{2}\\sin\\!\\left(\\frac{1}{x}\\right)\\le x^{2}\\ \\xrightarrow{x\\to0}\\ 0" },
        { h: "3 · 关键前提：有界因子" },
        "夹逼最常用在「有界量 × 趋于 0 的量」：",
        { tex: "|\\sin(\\cdot)|\\le1,\\quad|\\cos(\\cdot)|\\le1,\\quad\\left|x\\sin\\frac{1}{x}\\right|\\le|x|" },
        { ul: [
          "看到 <span class=\"tex\">\\sin(1/x)</span>、<span class=\"tex\">\\cos(1/x)</span> 这种无限振荡的因子，先想到它有界",
          "乘上一个趋于 0 的因子，乘积就趋于 0",
          "注意夹 <span class=\"tex\">x\\sin(1/x)</span> 要用 <span class=\"tex\">\\pm|x|</span>，不能写 <span class=\"tex\">\\pm x</span>（<span class=\"tex\">x</span> 可能为负）",
        ] },
        { h: "4 · 必背结果：sin(x)/x" },
        "<span class=\"tex\">\\lim_{x\\to0}\\dfrac{\\sin x}{x}=1</span> 的严格证明正是几何夹逼：在单位圆上比较面积可得 <span class=\"tex\">\\cos x\\le\\dfrac{\\sin x}{x}\\le1</span>（<span class=\"tex\">|x|&lt;\\pi/2</span>），两端都趋于 1。这个结果在求三角极限时可以直接引用。",
        { tex: "\\lim_{x\\to0}\\frac{\\sin x}{x}=1\\qquad\\left(\\cos x\\le\\frac{\\sin x}{x}\\le1\\right)" },
        { tip: "别和 <span class=\"tex\">x\\to\\infty</span> 混淆：<span class=\"tex\">x^{2}\\sin(1/x)</span> 在 <span class=\"tex\">x\\to\\infty</span> 时约等于 <span class=\"tex\">x</span>，并不趋于 0。夹逼的要点是找到合适的上下界，而不是硬算中间那个函数。" },
      ],
    },
    {
      id: "u2-overview",
      cat: "u2",
      topics: [],
      tag: "总览",
      title: "Unit 2 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u2" },
      ],
    },
    {
      id: "u3-overview",
      cat: "u3",
      topics: [],
      tag: "总览",
      title: "Unit 3 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u3" },
      ],
    },
    {
      id: "u4-overview",
      cat: "u4",
      topics: [],
      tag: "总览",
      title: "Unit 4 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u4" },
      ],
    },
    {
      id: "u5-overview",
      cat: "u5",
      topics: [],
      tag: "总览",
      title: "Unit 5 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u5" },
      ],
    },
    {
      id: "u6-overview",
      cat: "u6",
      topics: [],
      tag: "总览",
      title: "Unit 6 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u6" },
      ],
    },
    {
      id: "u7-overview",
      cat: "u7",
      topics: [],
      tag: "总览",
      title: "Unit 7 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u7" },
      ],
    },
    {
      id: "u8-overview",
      cat: "u8",
      topics: [],
      tag: "总览",
      title: "Unit 8 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u8" },
      ],
    },
    {
      id: "u9-overview",
      cat: "u9",
      topics: [],
      tag: "总览",
      title: "Unit 9 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u9" },
      ],
    },
    {
      id: "u10-overview",
      cat: "u10",
      topics: [],
      tag: "总览",
      title: "Unit 10 总览 · 官方主题与进度",
      lead: "按 College Board AP Calculus BC CED（2026–27）的官方主题顺序排列。已覆盖的可点标题跳转，标注「待补」的就是后续要按序补的内容。",
      blocks: [
        { roadmap: "u10" },
      ],
    },
    {
      id: "deriv-def",
      cat: "u2",
      topics: ["2.1", "2.2", "2.4"],
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
      cat: "u2",
      topics: ["2.5", "2.6", "2.7", "2.8", "2.9", "2.10"],
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
      id: "chain-layers",
      cat: "u3",
      topics: ["3.1"],
      tag: "技巧",
      title: "链式法则：多层复合怎么拆",
      lead: "复合函数求导不用猜：先给函数分层，再把每层的导数乘起来。BC 里漏一层，比算错乘法更常见。",
      blocks: [
        { h: "1 · 先给函数分层" },
        "看到 <span class=\"tex\">f(g(h(x)))</span> 这种套娃结构，从外向内依次求导，最后相乘：",
        { tex: "\\frac{d}{dx}f(g(h(x)))=f'(g(h(x)))\\,g'(h(x))\\,h'(x)" },
        { ul: [
          "每求导一层就问一句：括号里还剩什么没求导？",
          "直到只剩 <span class=\"tex\">x</span> 才停，这一步能挡住绝大多数漏层错误",
        ] },
        { h: "2 · 例题：三角 + 平方 + 多项式" },
        "求 <span class=\"tex\">y=\\sin^{2}(x^{2}+1)</span> 的导数：",
        { steps: [
          "① 分层：最外层是平方 <span class=\"tex\">u^{2}</span>，中层 <span class=\"tex\">u=\\sin v</span>，内层 <span class=\"tex\">v=x^{2}+1</span>。",
          "② 外层求导：<span class=\"tex\">2u=2\\sin(x^{2}+1)</span>。",
          "③ 中层求导：<span class=\"tex\">\\cos(x^{2}+1)</span>；内层求导：<span class=\"tex\">2x</span>。",
          "④ 三层相乘：<span class=\"tex\">y'=4x\\sin(x^{2}+1)\\cos(x^{2}+1)</span>。",
        ] },
        { h: "3 · 指数与对数也要拆" },
        { tex: "\\frac{d}{dx}e^{u(x)}=e^{u(x)}u'(x)\\qquad\\frac{d}{dx}\\ln u(x)=\\frac{u'(x)}{u(x)}" },
        "求 <span class=\"tex\">y=e^{\\tan(\\sqrt{x})}</span> 的导数：",
        { steps: [
          "① 最外层指数函数不变形：<span class=\"tex\">e^{\\tan(\\sqrt{x})}</span>。",
          "② 中层 <span class=\"tex\">\\tan(\\sqrt{x})</span> 的导数是 <span class=\"tex\">\\sec^{2}(\\sqrt{x})</span>。",
          "③ 内层 <span class=\"tex\">\\sqrt{x}</span> 的导数是 <span class=\"tex\">\\dfrac{1}{2\\sqrt{x}}</span>。",
          "④ 相乘：<span class=\"tex\">y'=\\dfrac{e^{\\tan(\\sqrt{x})}\\sec^{2}(\\sqrt{x})}{2\\sqrt{x}}</span>。",
        ] },
        { tip: "别把幂函数和指数函数搞混：<span class=\"tex\">x^{n}</span> 用幂法则 <span class=\"tex\">nx^{n-1}</span>；<span class=\"tex\">e^{u}</span> 要乘 <span class=\"tex\">u'</span>。看到括号外面挂着平方、根号或指数，就提醒自己：链式法则还没走完。" },
      ],
    },
    {
      id: "implicit-rates",
      cat: "u3",
      topics: ["3.2"],
      tag: "隐函数",
      title: "隐函数求导 implicit differentiation",
      lead: "当 y 解不出来（或没必要解）时，不必显式解出 y：把 y 当作 x 的函数，两边同时对 x 求导，遇到 y 就乘上 y'。",
      blocks: [
        { h: "1 · 隐函数求导的四步" },
        { ul: [
          "两边同时对 <span class=\"tex\">x</span> 求导",
          "遇到 <span class=\"tex\">y</span> 就当它是 <span class=\"tex\">x</span> 的函数：每求一次导都要乘 <span class=\"tex\">y'</span>",
          "把含 <span class=\"tex\">y'</span> 的项合并，解出 <span class=\"tex\">y'</span>",
          "要数值就代入给定的点 <span class=\"tex\">(x,y)</span>",
        ] },
        "例如 <span class=\"tex\">\\dfrac{d}{dx}y^{2}=2yy'</span>，<span class=\"tex\">\\dfrac{d}{dx}\\sin y=\\cos y\\cdot y'</span>。",
        { h: "2 · 例题：圆的切线斜率" },
        "已知 <span class=\"tex\">x^{2}+y^{2}=25</span>，求 <span class=\"tex\">(3,4)</span> 处的斜率：",
        { steps: [
          "① 两边求导：<span class=\"tex\">2x+2yy'=0</span>。",
          "② 解出：<span class=\"tex\">y'=-\\dfrac{x}{y}</span>。",
          "③ 代入 <span class=\"tex\">(3,4)</span>：<span class=\"tex\">y'=-\\dfrac{3}{4}</span>。",
        ] },
        { tip: "隐函数求导属于 CED Unit 3。相关变化率 (related rates) 属于 Unit 4，已单独成篇，方便按官方顺序复习。" },
      ],
    },
    {
      id: "related-rates",
      cat: "u4",
      topics: ["4.1", "4.3", "4.4", "4.5"],
      tag: "情境应用",
      title: "相关变化率 related rates",
      lead: "两个量都随时间 t 变化时：先写出它们的关系式，再对 t 求导，最后代入瞬时值。顺序错了，导数就会变成 0。",
      blocks: [
        { h: "1 · 标准流程" },
        { ul: [
          "用变量表示随时间变化的量，先写下关系式（如 <span class=\"tex\">A=\\pi r^{2}</span>）",
          "两边对 <span class=\"tex\">t</span> 求导，链式法则会自动带出变化率（如 <span class=\"tex\">dr/dt</span>）",
          "代入给定的瞬时值和变化率，写清单位",
        ] },
        { h: "2 · 例题：圆的面积变化率" },
        "圆的半径以 <span class=\"tex\">2\\,\\text{cm/s}</span> 增大，求 <span class=\"tex\">r=5</span> 时面积的变化率：",
        { steps: [
          "① 关系式：<span class=\"tex\">A=\\pi r^{2}</span>。",
          "② 对 <span class=\"tex\">t</span> 求导：<span class=\"tex\">\\dfrac{dA}{dt}=2\\pi r\\dfrac{dr}{dt}</span>。",
          "③ 代入 <span class=\"tex\">r=5,\\ dr/dt=2</span>：<span class=\"tex\">\\dfrac{dA}{dt}=20\\pi\\ \\text{cm}^{2}/\\text{s}</span>。",
        ] },
        { tip: "最大的坑是「先代数值再求导」：一旦把 <span class=\"tex\">r=5</span> 提前代进去，<span class=\"tex\">r</span> 就变成常数，导数直接为 0。顺序永远是：先写关系式 → 求导 → 最后代值，别忘了乘上变化率本身。" },
      ],
    },
    {
      id: "log-diff",
      cat: "u3",
      topics: ["3.5"],
      tag: "技巧",
      title: "对数求导法 logarithmic differentiation",
      lead: "一堆因子乘除、或底数和指数里都有 x（如 x^x），先取对数把乘积变成和、指数拉下来，求导会轻松很多。",
      blocks: [
        { h: "1 · 什么时候用" },
        { ul: [
          "多个因子相乘、相除、开方，直接乘积法则会很啰嗦",
          "<span class=\"tex\">x^{x}</span>、<span class=\"tex\">(x^{2}+1)^{\\sin x}</span> 这类幂指函数",
          "取对数时写 <span class=\"tex\">\\ln|y|</span>，避开负数无定义的麻烦",
        ] },
        { h: "2 · 通用套路" },
        { tex: "\\ln y=\\ln|f_1|+\\ln|f_2|-\\ln|f_3|\\quad\\Longrightarrow\\quad\\frac{y'}{y}=\\frac{f_1'}{f_1}+\\frac{f_2'}{f_2}-\\frac{f_3'}{f_3}" },
        "求 <span class=\"tex\">y=\\dfrac{(x+1)^{2}\\sqrt{x-1}}{x^{2}+2}</span> 的导数：",
        { steps: [
          "① 取对数：<span class=\"tex\">\\ln y=2\\ln(x+1)+\\dfrac{1}{2}\\ln(x-1)-\\ln(x^{2}+2)</span>。",
          "② 两边求导：<span class=\"tex\">\\dfrac{y'}{y}=\\dfrac{2}{x+1}+\\dfrac{1}{2(x-1)}-\\dfrac{2x}{x^{2}+2}</span>。",
          "③ 乘回 <span class=\"tex\">y</span>：<span class=\"tex\">y'=y\\left(\\dfrac{2}{x+1}+\\dfrac{1}{2(x-1)}-\\dfrac{2x}{x^{2}+2}\\right)</span>，最后把原式代回即可。",
        ] },
        { h: "3 · 幂指函数：x^x" },
        { steps: [
          "① 设 <span class=\"tex\">y=x^{x}</span>，取对数：<span class=\"tex\">\\ln y=x\\ln x</span>。",
          "② 右边用乘积法则：<span class=\"tex\">\\dfrac{y'}{y}=\\ln x+1</span>。",
          "③ 乘回 <span class=\"tex\">y</span>：<span class=\"tex\">y'=x^{x}(\\ln x+1)</span>。",
        ] },
        { tip: "千万别把 <span class=\"tex\">x^{x}</span> 当幂函数写成 <span class=\"tex\">x\\cdot x^{x-1}</span> —— 那是把指数当常数才成立。判断标准：指数里有 <span class=\"tex\">x</span> 就用对数求导。" },
      ],
    },
    {
      id: "inverse-deriv",
      cat: "u3",
      topics: ["3.3", "3.4"],
      tag: "反函数",
      title: "反函数与反三角函数求导",
      lead: "反函数的导数是原函数导数的倒数；反三角函数的几个分母，正是从这个倒数关系里来的。",
      blocks: [
        { h: "1 · 反函数的通用公式" },
        { tex: "(f^{-1})'(a)=\\frac{1}{f'\\!\\left(f^{-1}(a)\\right)}\\qquad (f'\\ne 0)" },
        "例：<span class=\"tex\">f(x)=x^{3}+x</span>，求 <span class=\"tex\">(f^{-1})'(2)</span>：",
        { steps: [
          "① 先找原像：试出 <span class=\"tex\">f(1)=2</span>，所以 <span class=\"tex\">f^{-1}(2)=1</span>。",
          "② 求原函数导数：<span class=\"tex\">f'(x)=3x^{2}+1</span>，于是 <span class=\"tex\">f'(1)=4</span>。",
          "③ 取倒数：<span class=\"tex\">(f^{-1})'(2)=\\dfrac{1}{4}</span>。",
        ] },
        { h: "2 · 三个必背的反三角导数" },
        { tex: "(\\arcsin x)'=\\frac{1}{\\sqrt{1-x^{2}}}\\quad(\\arccos x)'=-\\frac{1}{\\sqrt{1-x^{2}}}\\quad(\\arctan x)'=\\frac{1}{1+x^{2}}" },
        "例：<span class=\"tex\">y=\\arctan(3x)</span>：",
        { steps: [
          "① 外层 <span class=\"tex\">\\arctan</span> 求导：<span class=\"tex\">\\dfrac{1}{1+(3x)^{2}}</span>。",
          "② 内层 <span class=\"tex\">3x</span> 的导数是 <span class=\"tex\">3</span>。",
          "③ 相乘：<span class=\"tex\">y'=\\dfrac{3}{1+9x^{2}}</span>。",
        ] },
        { tip: "<span class=\"tex\">\\arccos</span> 前面有负号，<span class=\"tex\">\\arcsin</span> 和 <span class=\"tex\">\\arccos</span> 只在 <span class=\"tex\">|x|&lt;1</span> 可导。复合函数别忘了再乘内层导数 —— 这里也是链式法则的高频失分点。" },
      ],
    },
    {
      id: "param-polar-deriv",
      cat: "u9",
      topics: ["9.1", "9.2", "9.7"],
      tag: "参数/极坐标",
      title: "参数方程与极坐标求导",
      lead: "参数方程不必先消掉 t；极坐标只要先写成 x=r(θ)cosθ、y=r(θ)sinθ，就回到同一套参数求导。",
      blocks: [
        { h: "1 · 参数方程" },
        { tex: "\\frac{dy}{dx}=\\frac{dy/dt}{dx/dt}\\qquad\\left(\\frac{dx}{dt}\\ne 0\\right)" },
        "例：<span class=\"tex\">x=t^{2}+1,\\ y=t^{3}-t</span>，求 <span class=\"tex\">t=1</span> 处的斜率：",
        { steps: [
          "① 分别求导：<span class=\"tex\">\\dfrac{dx}{dt}=2t</span>，<span class=\"tex\">\\dfrac{dy}{dt}=3t^{2}-1</span>。",
          "② 相除：<span class=\"tex\">\\dfrac{dy}{dx}=\\dfrac{3t^{2}-1}{2t}</span>。",
          "③ 代入 <span class=\"tex\">t=1</span>：斜率为 <span class=\"tex\">1</span>。",
        ] },
        { h: "2 · 极坐标" },
        "先把 <span class=\"tex\">r=r(\\theta)</span> 转成参数式 <span class=\"tex\">x=r\\cos\\theta,\\ y=r\\sin\\theta</span>，再用乘积法则：",
        { tex: "\\frac{dy}{dx}=\\frac{r'(\\theta)\\sin\\theta+r(\\theta)\\cos\\theta}{r'(\\theta)\\cos\\theta-r(\\theta)\\sin\\theta}" },
        "例：<span class=\"tex\">r=1+\\cos\\theta</span>，求 <span class=\"tex\">\\theta=\\dfrac{\\pi}{2}</span> 处的斜率：",
        { steps: [
          "① 求导：<span class=\"tex\">r'(\\theta)=-\\sin\\theta</span>。",
          "② 代入公式得到 <span class=\"tex\">\\dfrac{-\\sin^{2}\\theta+(1+\\cos\\theta)\\cos\\theta}{-\\sin\\theta\\cos\\theta-(1+\\cos\\theta)\\sin\\theta}</span>。",
          "③ 在 <span class=\"tex\">\\theta=\\pi/2</span> 处 <span class=\"tex\">\\cos\\theta=0,\\ \\sin\\theta=1</span>，斜率 <span class=\"tex\">=1</span>。",
        ] },
        { h: "3 · 参数方程的二阶导" },
        { tex: "\\frac{d^{2}y}{dx^{2}}=\\frac{\\dfrac{d}{dt}\\left(\\dfrac{dy}{dx}\\right)}{\\dfrac{dx}{dt}}" },
        { tip: "两个常见坑：把 <span class=\"tex\">r</span> 直接当成 <span class=\"tex\">y</span> 求导；分母 <span class=\"tex\">dx/dt=0</span> 时硬算斜率。分母为 0 而分子不为 0，正是竖直切线 (vertical tangent)。" },
      ],
    },
    {
      id: "int-def",
      cat: "u6",
      topics: ["6.3"],
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
      cat: "u6",
      topics: ["6.4", "6.7"],
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
      cat: "u6",
      topics: ["6.8"],
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
      cat: "u6",
      topics: ["6.9"],
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
      cat: "u6",
      topics: ["6.11"],
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
      cat: "u6",
      topics: ["6.14"],
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
      cat: "u6",
      topics: ["6.12"],
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
      cat: "u6",
      topics: ["6.4", "6.5"],
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
      cat: "u6",
      topics: ["6.7"],
      tag: "定积分",
      title: "上下限含函数的定积分：直接计算",
      lead: "题目若写成 <span class=\"tex\">\\int_{2}^{\\sin^{2}x}f(t)\\,dt</span>，前面没有 <span class=\"tex\">d/dx</span>，那就是真要算出一个关于 x 的函数。关键不是对上下限求导，而是先求 f 的原函数 F(t)（内层复杂时先换元），再把上、下限代进去相减。",
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
        { h: "4 · 内层也是函数：先换元求出 F(t)" },
        "如果积分号里还套了一层函数，比如 <span class=\"tex\">\\cos(t^{2})</span>，做法仍然一样：先把被积函数当成 <b>t</b> 的函数，用换元找到 <span class=\"tex\">F(t)</span>，最后才把函数上下限代进去。",
        { steps: [
          "求 <span class=\"tex\">\\int_{0}^{\\sin x}2t\\cos(t^{2})\\,dt</span>。先不管上限，内层是 <span class=\"tex\">t^{2}</span>，令 <span class=\"tex\">u=t^{2}</span>，<span class=\"tex\">du=2t\\,dt</span>。",
          "原函数是 <span class=\"tex\">F(t)=\\sin(t^{2})</span>，因为 <span class=\"tex\">F'(t)=2t\\cos(t^{2})</span>。",
          "现在才代上下限：<span class=\"tex\">F(\\sin x)-F(0)=\\sin\\big((\\sin x)^{2}\\big)-\\sin0=\\sin(\\sin^{2}x)</span>。",
          "若上下限也都是函数，如 <span class=\"tex\">\\int_{\\cos x}^{\\sin x}2t\\cos(t^{2})\\,dt</span>，答案就是 <span class=\"tex\">\\sin(\\sin^{2}x)-\\sin(\\cos^{2}x)</span>。",
        ] },
        { h: "5 · 内层同时含 x 和 t" },
        "若被积函数是 <span class=\"tex\">f(x,t)</span>，积分时把 <b>x 当常数</b>，只对 <b>t</b> 积分，结果自然还是 x 的函数：",
        { tex: "\\int_{0}^{\\sin x}\\cos(xt)\\,dt=\\left[\\frac{\\sin(xt)}{x}\\right]_{0}^{\\sin x}=\\frac{\\sin(x\\sin x)}{x}\\quad(x\\neq0)" },
        { ul: [
          "这时 x 不再只是上限参数，它同时出现在被积函数里；但『先对 t 积分、再代上下限』的顺序不变",
          "若连原函数都找不到，直接求值的题通常不会这么出；若前面再加 <span class=\"tex\">d/dx</span>，就要用更一般的 Leibniz 公式（BC 一般不要求）",
        ] },
        { h: "6 · 几个容易踩的坑" },
        { ul: [
          "<b>上限小于下限也正常</b>：<span class=\"tex\">\\sin^{2}x\\le1&lt;2</span>，所以第一题结果是负数；定积分是有向面积，别自作主张交换上下限",
          "<span class=\"tex\">(\\sin x)^{2}</span> 是 <span class=\"tex\">\\sin^{2}x</span>，不是 <span class=\"tex\">\\sin(x^{2})</span>；平方后是 <span class=\"tex\">\\sin^{4}x</span>，别写成 <span class=\"tex\">\\sin^{2}(x^{2})</span>",
          "若 <span class=\"tex\">f(t)</span> 没有初等原函数（如 <span class=\"tex\">\\sqrt{t^{3}+1}</span>），直接积分写不出闭式；考试遇到这种被积函数，通常前面会带 <span class=\"tex\">d/dx</span>，让你用 FTC 绕过积分",
        ] },
        { tip: "判断口诀：<b>有 d/dx 不积分，没 d/dx 才积分</b>。前者只代上限再乘导数；后者先找原函数（内层复杂就先换元），再把上下限代进去相减。内层也含 x 时，把 x 当常数照积，最后结果仍是 x 的函数。" },
      ],
    },
    {
      id: "area-volume",
      cat: "u8",
      topics: ["8.4", "8.5", "8.7", "8.9", "8.11"],
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
      cat: "u6",
      topics: ["6.13"],
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
      cat: "u9",
      topics: ["9.3", "9.8"],
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
      cat: "u7",
      topics: ["7.6", "7.7", "7.9"],
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
      cat: "u8",
      topics: ["8.1", "8.3"],
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
    {
      id: "mvt",
      cat: "u5",
      topics: ["5.1"],
      tag: "定理",
      title: "中值定理 Mean Value Theorem",
      lead: "闭区间上连续、开区间上可导，就一定能找到一个点，那里的瞬时变化率等于整段的平均变化率——这是连接「平均」与「瞬时」的桥梁，也是证明题的常客。",
      blocks: [
        { h: "1 · 定理陈述" },
        "若 <span class=\"tex\">f</span> 在 <span class=\"tex\">[a,b]</span> 上连续、在 <span class=\"tex\">(a,b)</span> 上可导，则存在 <span class=\"tex\">c\\in(a,b)</span> 使：",
        { tex: "f'(c)=\\frac{f(b)-f(a)}{b-a}" },
        { ul: [
          "右边是端点连线的<b>割线斜率</b>，左边是 <span class=\"tex\">c</span> 处的<b>切线斜率</b>",
          "几何上：曲线上至少有一点的切线与端点割线平行",
          "物理上：一段时间的平均速度，等于某一瞬间的瞬时速度（速度表读数）",
          "两个条件缺一不可：端点连续、内部可导",
        ] },
        { fig: "mvt", cap: "中值定理的几何意义：c 处切线（实线）与端点割线（虚线）平行，斜率同为 f prime(c)。" },
        { h: "2 · Rolle 定理：MVT 的特殊情形" },
        "若还有 <span class=\"tex\">f(a)=f(b)</span>，则割线斜率为 0，于是存在 <span class=\"tex\">c</span> 使 <span class=\"tex\">f'(c)=0</span>。这就是 Rolle 定理，常用来证明方程有根：",
        { steps: [
          "想证 <span class=\"tex\">f'(x)=0</span> 在 <span class=\"tex\">(a,b)</span> 有解，先构造一个端点等值 <span class=\"tex\">f(a)=f(b)</span> 的函数",
          "验证闭区间连续、开区间可导（多项式、指数、三角处处满足）",
          "由 Rolle 得存在 <span class=\"tex\">c</span> 使 <span class=\"tex\">f'(c)=0</span>",
        ] },
        { h: "3 · 典型例题：找出那个 c" },
        "<span class=\"tex\">f(x)=\\sqrt{x}</span> 在 <span class=\"tex\">[1,4]</span> 上：连续且内部可导，",
        { steps: [
          "割线斜率 <span class=\"tex\">\\dfrac{f(4)-f(1)}{4-1}=\\dfrac{2-1}{3}=\\dfrac{1}{3}</span>。",
          "<span class=\"tex\">f'(x)=\\dfrac{1}{2\\sqrt{x}}</span>，令它等于 <span class=\"tex\">\\dfrac13</span>：",
          "<span class=\"tex\">\\dfrac{1}{2\\sqrt{c}}=\\dfrac13\\ \\Rightarrow\\ \\sqrt{c}=\\dfrac32\\ \\Rightarrow\\ c=\\dfrac94</span>，确实在 <span class=\"tex\">(1,4)</span> 内。",
        ] },
        { h: "4 · 考场常见问法" },
        { ul: [
          "<b>存在性证明</b>：题目给 <span class=\"tex\">f</span> 连续可导、端点条件，问是否存在 <span class=\"tex\">f'(c)=k</span> → 凑割线斜率",
          "<b>不等式</b>：由 <span class=\"tex\">f'(c)=\\frac{f(b)-f(a)}{b-a}</span> 和 <span class=\"tex\">f'</span> 的界，放缩 <span class=\"tex\">|f(b)-f(a)|\\le M|b-a|</span>",
          "<b>根的数目</b>：Rolle + 反证，若导数恒不为 0 则函数单调，至多一个根",
        ] },
        { tip: "MVT 只保证 c 存在，不告诉你 c 在哪。AP 里几乎不会让你精确解出 c，更多是「说明存在」或「估计范围」。别忘了写条件：闭连续、开可导，少写一个就扣分。" },
      ],
    },
    {
      id: "evt-critical",
      cat: "u5",
      topics: ["5.2", "5.5"],
      tag: "定理",
      title: "极值定理、临界点与候选点法",
      lead: "闭区间上连续的函数一定取到最大最小；找它们只需检查两类点——导数为零或不存在的临界点，以及区间端点。",
      blocks: [
        { h: "1 · 极值定理 EVT" },
        "若 <span class=\"tex\">f</span> 在<b>闭区间</b> <span class=\"tex\">[a,b]</span> 上连续，则 <span class=\"tex\">f</span> 必在 <span class=\"tex\">[a,b]</span> 上取到全局最大值和全局最小值。",
        { ul: [
          "两个关键词：闭区间、连续，缺一不可",
          "开区间 <span class=\"tex\">(a,b)</span> 或有间断点时可能取不到（如 <span class=\"tex\">f(x)=1/x</span> 在 <span class=\"tex\">(0,1)</span>）",
          "极值可能出现在区间内部，也可能出现在端点",
        ] },
        { h: "2 · 临界点 critical point" },
        "<span class=\"tex\">c</span> 是 <span class=\"tex\">f</span> 的临界点，若 <span class=\"tex\">c</span> 在定义域内且 <span class=\"tex\">f'(c)=0</span> 或 <span class=\"tex\">f'(c)</span> 不存在。",
        { ul: [
          "<span class=\"tex\">f'(c)=0</span>：水平切线（峰顶、谷底、或水平拐点）",
          "<span class=\"tex\">f'(c)</span> 不存在：尖角、竖直切线、不连续点",
          "临界点<b>不一定</b>是极值点（例：<span class=\"tex\">x^{3}</span> 在 0 处导数为 0 但不是极值）",
          "反过来，内部极值点<b>一定</b>是临界点（Fermat 定理）",
        ] },
        { h: "3 · 候选点法找全局极值" },
        "闭区间上求全局最大/最小，把有限个候选点的函数值列出来比大小即可：",
        { steps: [
          "求 <span class=\"tex\">f'</span>，解 <span class=\"tex\">f'(x)=0</span>，并找出 <span class=\"tex\">f'</span> 不存在的点 → 得到区间内所有临界点",
          "候选点 = 这些临界点，再加上两个端点 <span class=\"tex\">a,b</span>",
          "逐个代入 <span class=\"tex\">f</span> 算函数值，最大即全局最大，最小即全局最小",
        ] },
        { h: "4 · 局部极值 vs 全局极值" },
        { ul: [
          "局部极大：附近邻域里最大；全局最大：整个定义域里最大",
          "全局极值一定是局部极值（端点除外），局部极值未必全局",
          "若区间无限（如 <span class=\"tex\">[0,\\infty)</span>），还要检查 <span class=\"tex\">x\\to\\infty</span> 的极限",
        ] },
        { tip: "最常丢分的两处：① 忘记比较端点，只报了内部临界点；② 把「临界点」直接当「极值点」。候选点法不判断极值类型，只比大小，所以对闭区间最稳。" },
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

  function categoryById(id) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === id) return categories[i];
    }
    return null;
  }

  function coverageFor(catId, topicNo) {
    for (var i = 0; i < articles.length; i++) {
      var a = articles[i];
      if (a.cat === catId && a.topics && a.topics.indexOf(topicNo) !== -1) return a;
    }
    return null;
  }

  function roadmapHtml(catId) {
    var cat = categoryById(catId);
    if (!cat) return "";
    var done = 0;
    var items = cat.topics.map(function (tp) {
      var a = coverageFor(catId, tp.n);
      if (a) done++;
      return '<div class="roadmap-item ' + (a ? "done" : "todo") + '">' +
        '<span class="roadmap-n">' + esc(tp.n) + '</span>' +
        '<span class="roadmap-txt">' + esc(tp.t) + '</span>' +
        (a ? '<button type="button" class="roadmap-jump" data-jump="' + esc(a.id) + '">已覆盖 · 阅读 →</button>'
           : '<span class="roadmap-todo">待补</span>') +
        '</div>';
    }).join("");
    return '<div class="note-roadmap">' +
      '<div class="roadmap-head">官方主题进度 · ' + done + ' / ' + cat.topics.length + ' 已覆盖</div>' +
      items + '</div>';
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
      if (b.roadmap) return roadmapHtml(b.roadmap);
      if (b.fig) {
        var svg = figures[b.fig];
        if (!svg) return "";
        return '<figure class="note-figure">' + svg +
          (b.cap ? '<figcaption>' + esc(b.cap) + '</figcaption>' : '') + '</figure>';
      }
      return "";
    }).join("");
  }

  return {
    categories: categories,
    articles: articles,
    byCat: byCat,
    find: find,
    blocksHtml: blocksHtml,
    figures: figures,
  };
})();
