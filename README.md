# BC Helper

仿照 [LA Helper](https://github.com/Franky100-pig/LA-Helper) 做的微积分 BC 学习计算器。**中文优先，可一键切英文**：右上角 `EN / 中文` 按钮或 `?lang=en` 切换（记在 localStorage），界面、报错、引擎讲解与全部 66 篇讲义同步换语言；关键概念始终保留英文原名。四种分步计算：

- 求导 (derivative)：1–5 阶导数（覆盖 BC 考试需要），可选在 `x = a` 处求值
- 积分 (integral)：不定积分、定积分，方法偏好可选换元 (u-substitution) / 分部 (integration by parts)
- 极限 (limit)：有限点 / 左右极限 / `oo`、`-oo`，给出直接代入或洛必达步骤，并明确判定**收敛到有限值 / 发散到 ±∞ / 极限不存在**
- 级数 (series)：通项用 `n` 输入，依次尝试项判别、几何级数、p-级数、交错级数、比值、根值、积分判别与直接求和，给出**绝对收敛 / 条件收敛 / 发散 / 未能判定**及对应步骤

另外提供**考场模式 (exam mode)**：卡西欧 fx-991CN 风格键盘 + Desmos 绘图，还原「考场内建 Desmos + 实体计算器」的手感。

**在线预览：<https://franky100-pig.github.io/BC-Helper/>**

## 三种视图

- **分步计算 (Step-by-step)**：输入函数，输入框下实时显示标准数学排版预览（`d/dx`、`∫`、`lim`、`Σ`、上下限、次方、根号都按 KaTeX 排版），看带法则标签的逐步推导，适合平时学习
- **考场模式 (Exam)**：左手一个 991 风格计算器，右手一张 Desmos 图
  - 保留数字键、四则运算、`sin/cos/tan/ln/log/e^x/x²/√/π` 等常用键
  - `d/dx`、`∫` 独立按键：`d/dx(函数, 点)`、`∫(函数, 下限, 上限)` 走数值计算（五点差分 / 自适应 Simpson）
  - `DRG` 切**角度/弧度 (DEG/RAD)**，`d/c` 切**分数/小数**：切换时自动按新模式重算当前表达式并更新 Ans，Desmos 和图像区的角度徽标同步变化，不会出现一边 DEG 一边 RAD 的错配
  - `Ans` 记忆上一次结果；支持隐式乘法（`2x`、`3sin(x)`）
  - Desmos 连不上时（大陆网络常见）自动降级到内置 canvas 绘图，离线也有图看
- **小讲义 (Notes)**：按 College Board **AP Calculus BC CED（2026–27 澄清版，章节内容不变）的 10 个官方 Unit** 排序，共 **66 篇**（每 Unit 首篇是「总览 · 官方主题与进度」），含 **1072 条 KaTeX 公式**与 **29 张按真实函数坐标生成的内联 SVG 图示**（曲线、切线、符号表、黎曼和矩形、累积函数、斜率场、级数判别流程图等，深浅主题自适应、离线可用）。**中文 + 英文两版完全对齐**：66 篇正文、111 个官方主题名、图示内文字与进度标签都有译文；切到英文时公式与 `fig` / `roadmap` 键保持原样。总览按官方主题号列出覆盖状态，已覆盖可点按钮跳转，未覆盖标「待补」（英文为 To do）；侧边栏每个 Unit 点箭头即可折叠 / 展开。每篇带逐步解析与常见坑，`#notes/<id>` 可分享。

  当前各 Unit 覆盖：

  | Unit | 主题 | Unit | 主题 |
  |---|---|---|---|
  | 1 · 极限与连续 | 16 / 16 | 6 · 积分与累积 | 14 / 14 |
  | 2 · 求导 | 9 / 10 | 7 · 微分方程 | 6 / 9 |
  | 3 · 复合 / 隐函数 / 反函数 | 5 / 6 | 8 · 积分应用 | 7 / 13 |
  | 4 · 导数应用 | 6 / 7 | 9 · 参数 / 极坐标 / 向量 | 5 / 9 |
  | 5 · 导数分析应用 | 11 / 12 | 10 · 无穷级数 | 15 / 15 |

  已覆盖的重点包括：Unit 1 极限与连续、Unit 6 积分与累积、Unit 10 无穷级数三个单元已全覆盖；导数定义与各类求导法则、相关变化率、中值定理 / 极值 / 凹凸与拐点、换元 / 分部 / 部分分式 / 广义积分 / 函数上下限（区分「前面有 d/dx 的 FTC 求导」与「直接算 ∫₂^{sin²x} 的值」）、黎曼和与累积函数、斜率场与欧拉法、面积体积与平均值、参数 / 极坐标，以及级数的各类判别法、幂级数收敛区间与泰勒误差。其余单元的剩余主题仍标「待补」。

## 设计原则

- **看过程，不只看答案**：每一步都带法则标签和公式，像 LA Helper 的矩阵步骤一样可对照课本；极限与级数还会单独给出「收敛 / 发散」结论
- **收敛判定有据可查**：级数按判定法优先级逐条尝试，步骤里写明用的是哪一项判别、ρ 或 p 的值；含 `(-1)^n` 时 SymPy 符号极限易失败，另有大 n 幅值兜底，避免把交错级数误判成收敛
- **本地计算**：表达式不上传，SymPy 跑在浏览器里（Pyodide/WASM）；引擎按需编译——页面打开不占主线程跑数学内核，第一次点「计算」才在 Web Worker 里编译，这次计算会自动排队等它就绪并显示分阶段进度，讲义和考场模式全程秒开；引擎文件会在页面空闲时后台预下载，所以等点计算时多半已缓存好，首算通常 10 秒左右，文案按保守的「约 20 秒」显示；考场模式的数值引擎是纯 JS，零网络
- **中文优先，英文无缝切换**：默认全中文；点 `EN` 或加 `?lang=en` 切成全英文。`core/i18n.py` 的法则名 / 说明 / 报错、`web/i18n.js` 的界面文案、`notes.en.js` 的讲义译文三处一起切；缺省 `lang=zh`，旧接口与测试行为不变
- **使用人数（仅网页版页脚）**：页脚显示「N 人用 BC Helper 学微积分」（英文模式为 "N people learning calculus with BC Helper"），由免费第三方计数器（[Abacus](https://github.com/jasoncodes/abacus)）提供。打开网页只发一次匿名 +1（同一浏览器 localStorage 去重，之后只读），不含表达式、题目或任何个人信息，无 cookie；拿不到 localStorage 或接口失败时整行隐藏，绝不显示 0 或报错。桌面版无此计数
- **装一次，离线可用**：Service Worker 会在页面空闲时把页面、KaTeX 和整个 Python 引擎（约 19 MB）后台写进浏览器缓存——不用等到点「计算」，看首页 / 讲义的几秒里就下好了。第一次打开后，同一个浏览器再打开是秒开，断网也能求导积分；状态栏会显示「✓ 引擎已装到浏览器 · N 个文件在本地」。
- **考场手感**：991 深色机身 + 液晶屏 + 独立 d/dx / ∫ 键，Desmos 画函数图像

## 运行

```bash
pip install -r requirements-dev.txt
pytest
node tools/test_calc_engine.js        # 考场模式数值引擎测试
node tools/test_counter.js            # 匿名计数器逻辑
node tools/test_i18n.js               # 双语字典 / 66 篇英文讲义 / 英文公式自检
python tools/fetch_katex.py           # 讲义公式自检需要本地 KaTeX
node tools/test_notes.js              # 讲义篇目 + 1072 条公式 + 29 张图示自检

# 本地开发服务器（走 Python 核心，不走 Pyodide）
python web/app.py

# 构建静态预览（浏览器内 SymPy）
python tools/build_preview.py
# 产物默认在 ../bc-preview/

# 想要同源 Pyodide 运行时（约 20 MB，可缓存）
python tools/fetch_pyodide.py ../bc-preview
```

GitHub Pages 由 `.github/workflows/pages.yml` 在每次 push 到 `main` 时自动构建并部署。

## 项目结构

```
core/    共享 SymPy 引擎：解析、求导步骤、积分步骤、极限/级数敛散性判定、分发入口（i18n.py 含中英文案）
web/     单页工作台：分步计算 + 考场模式（991 键盘 / Desmos）+ 分篇讲义
         engine-worker.js 把 Pyodide/SymPy 放进后台线程
         i18n.js 界面文案与语言状态，notes.js（中文）/ notes.en.js（英文）存讲义数据
tools/   静态预览构建、Pyodide 自托管下载、数值引擎与讲义自检
tests/   核心引擎单元测试
```

## 关于 Desmos 的 API key

考场模式用的是自己的 Desmos API key（`web/desmos.js` 里的 `DESMOS_API_KEY`）。目前仍有 "Desmos Trial Key · Choose a plan for production use" 横幅——这是 Desmos 对非付费 key 的统一提示，功能不受影响。要彻底去掉，需要在 [Desmos API Keys](https://www.desmos.com/api/v1.10/docs/index.html#document-api-keys) 申请 production key 再替换该常量。Desmos 是第三方 CDN、跨域，无法被离线缓存；断网时会自动切到内置 canvas 绘图。

MIT License.
