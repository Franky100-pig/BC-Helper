# BC Helper

仿照 [LA Helper](https://github.com/Franky100-pig/LA-Helper) 做的微积分 BC 学习计算器。界面中文优先，关键概念保留英文原名（如「链式法则 (chain rule)」），第一步只做两种计算：

- 求导 (derivative)：1–8 阶导数，可选在 `x = a` 处求值
- 积分 (integral)：不定积分、定积分，方法偏好可选换元 (u-substitution) / 分部 (integration by parts)

**在线预览：<https://franky100-pig.github.io/BC-Helper/>**

## 设计原则

- **看过程，不只看答案**：每一步都带法则标签和公式，像 LA Helper 的矩阵步骤一样可对照课本
- **本地计算**：表达式不上传，SymPy 跑在浏览器里（Pyodide/WASM）
- **中文优先**：步骤说明全中文，关键概念附英文，方便从英文教材切换过来
- **先不做图**：图像功能后续再考虑 TI-Nspire 风格绘图或嵌入 Desmos + 卡西欧 991CNCW 键位

## 运行

```bash
pip install -r requirements-dev.txt
pytest

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
web/     单页工作台：顶部模式切换 + 左输入右结果
tools/   静态预览构建、Pyodide 自托管下载
tests/   核心引擎单元测试
```

MIT License.
