# BC Helper

仿照 [LA Helper](https://github.com/Franky100-pig/LA-Helper) 做的微积分 BC 学习计算器。界面中文优先，关键概念保留英文原名（如「链式法则 (chain rule)」），第一步只做两种计算：

- 求导 (derivative)：1–8 阶导数，可选在 `x = a` 处求值
- 积分 (integral)：不定积分、定积分，方法偏好可选换元 (u-substitution) / 分部 (integration by parts)

另外提供**考场模式 (exam mode)**：卡西欧 fx-991CN 风格键盘 + Desmos 绘图，还原「考场内建 Desmos + 实体计算器」的手感。

**在线预览：<https://franky100-pig.github.io/BC-Helper/>**

## 三种视图

- **分步计算 (Step-by-step)**：输入函数，看带法则标签的逐步推导，适合平时学习
- **考场模式 (Exam)**：左手一个 991 风格计算器，右手一张 Desmos 图
  - 保留数字键、四则运算、`sin/cos/tan/ln/log/e^x/x²/√/π` 等常用键
  - `d/dx`、`∫` 独立按键：`d/dx(函数, 点)`、`∫(函数, 下限, 上限)` 走数值计算（五点差分 / 自适应 Simpson）
  - `DRG` 切**角度/弧度 (DEG/RAD)**，`d/c` 切**分数/小数**，两者都与 Desmos 的 DEG 模式同步
  - `Ans` 记忆上一次结果；支持隐式乘法（`2x`、`3sin(x)`）
  - Desmos 连不上时（大陆网络常见）自动降级到内置 canvas 绘图，离线也有图看
- **小讲义 (Notes)**：讲义内容的占位页，目前只有一段介绍，后续往这里放求导 / 积分的 short notes

## 设计原则

- **看过程，不只看答案**：每一步都带法则标签和公式，像 LA Helper 的矩阵步骤一样可对照课本
- **本地计算**：表达式不上传，SymPy 跑在浏览器里（Pyodide/WASM）；考场模式的数值引擎是纯 JS，零网络
- **中文优先**：步骤说明全中文，关键概念附英文，方便从英文教材切换过来
- **装一次，离线可用**：Service Worker 会把页面、KaTeX 和整个 Python 引擎（约 19 MB）写进浏览器缓存。第一次打开后，同一个浏览器再打开是秒开，断网也能求导积分；状态栏会显示「✓ 引擎已装到浏览器 · N 个文件在本地」。
- **考场手感**：991 深色机身 + 液晶屏 + 独立 d/dx / ∫ 键，Desmos 画函数图像

## 运行

```bash
pip install -r requirements-dev.txt
pytest
node tools/test_calc_engine.js        # 考场模式数值引擎测试

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
core/    共享 SymPy 引擎：解析、求导步骤、积分步骤、分发入口
web/     单页工作台：分步计算 + 考场模式（991 键盘 / Desmos）
tools/   静态预览构建、Pyodide 自托管下载、数值引擎测试
tests/   核心引擎单元测试
```

## 关于 Desmos 的 API key

考场模式用的是自己的 Desmos API key（`web/desmos.js` 里的 `DESMOS_API_KEY`）。目前仍有 "Desmos Trial Key · Choose a plan for production use" 横幅——这是 Desmos 对非付费 key 的统一提示，功能不受影响。要彻底去掉，需要在 [Desmos API Keys](https://www.desmos.com/api/v1.10/docs/index.html#document-api-keys) 申请 production key 再替换该常量。Desmos 是第三方 CDN、跨域，无法被离线缓存；断网时会自动切到内置 canvas 绘图。

MIT License.
