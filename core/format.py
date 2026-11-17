"""统一的公式输出格式：LaTeX 给网页排版，纯文本给打印与兜底。"""
import sympy as sp


def fmt(expr):
    if expr is None:
        return {"latex": "", "text": ""}
    return {
        "latex": sp.latex(expr),
        "text": sp.pretty(expr, use_unicode=True),
    }


def fmt_text(text):
    return {"latex": text, "text": text}


def step(rule, title, before, after, note="", depth=0, formula=""):
    """生成一个步骤卡的数据结构。"""
    return {
        "rule": rule,
        "title": title,
        "before": before if isinstance(before, dict) else fmt_text(str(before)),
        "after": after if isinstance(after, dict) else fmt_text(str(after)),
        "note": note,
        "depth": depth,
        "formula": formula,
    }
