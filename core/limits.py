"""极限与敛散性判断：lim(x→a) f(x)，支持有限点、左右极限与 ±∞。"""
import sympy as sp

from expr import X, constant
from format import fmt, step
from i18n import err, label, note

INFINITY = {
    "oo": sp.oo,
    "+oo": sp.oo,
    "inf": sp.oo,
    "infinity": sp.oo,
    "-oo": -sp.oo,
    "-inf": -sp.oo,
    "-infinity": -sp.oo,
}


def limit_point(text, lang="zh"):
    """把趋近点写成 SymPy 对象；oo / -oo 直接认，其余走常数解析。"""
    token = str(text).strip().lower().replace(" ", "")
    if token in INFINITY:
        return INFINITY[token]
    try:
        return constant(text, lang)
    except Exception as exc:  # noqa: BLE001 —— 统一成更贴近极限场景的提示
        raise ValueError(err("bad_point", lang)) from exc


def _lim(expr, point, side):
    try:
        return sp.limit(expr, X, point, dir=side)
    except Exception:  # noqa: BLE001 —— 交给 L'Hôpital / 判定层兜底
        return None


def _point_latex(point):
    return "\\infty" if point == sp.oo else "-\\infty" if point == -sp.oo else sp.latex(point)


def notation(expr, point, side_key):
    if point in (sp.oo, -sp.oo) or side_key == "both":
        suffix = ""
    else:
        suffix = "^{-}" if side_key == "left" else "^{+}"
    latex = "\\lim_{x \\to " + _point_latex(point) + suffix + "}" + sp.latex(expr)
    text = "lim(x→" + str(point) + suffix + ") " + sp.pretty(expr, use_unicode=True)
    return {"latex": latex, "text": text}


def _indeterminate(value):
    return value is not None and (value == 0 or value in (sp.oo, -sp.oo, sp.nan, sp.zoo))


def _text(content):
    """结论类文案交给 KaTeX 的 \\text 排版，保持与公式一致的字体。"""
    return {"latex": "\\text{" + content + "}", "text": content}


def _verdict(value):
    """返回 (verdict, answer, note_key)。"""
    if value in (sp.oo, -sp.oo):
        key = "diverges_pos_inf" if value == sp.oo else "diverges_neg_inf"
        return "diverges_inf", _text(label(key)), "limit_inf"
    if value is None or isinstance(value, sp.AccumBounds) or isinstance(value, sp.Limit):
        return "dne", _text(label("does_not_exist")), "limit_dne"
    if value.has(sp.AccumBounds) or value.has(sp.zoo) or value.has(sp.nan):
        return "dne", _text(label("does_not_exist")), "limit_dne"
    if value.is_number and value.is_finite:
        return "converges", fmt(value), "limit_ok"
    return "dne", _text(label("does_not_exist")), "limit_dne"


def limit_result(expr, point, side_key, lang="zh"):
    """返回 (answer, secondary, steps, verdict)。"""
    steps = []
    direction = "-" if side_key == "left" else "+"
    start = notation(expr, point, side_key)
    point_text = str(point).replace("**", "^")

    # 有限点先试直接代入：连续点一眼就能看懂；不连续点再试洛必达。
    if point not in (sp.oo, -sp.oo):
        try:
            substituted = sp.simplify(expr.subs(X, point))
            if substituted.is_number and substituted.is_finite:
                steps.append(step(
                    "direct_substitution", label("direct_substitution", lang),
                    start, fmt(substituted),
                    note("direct_substitution", lang, point=point_text), 0
                ))
        except Exception:  # noqa: BLE001
            pass

    if not steps:
        try:
            numerator, denominator = sp.fraction(sp.together(expr))
            if denominator != 1:
                top = _lim(numerator, point, direction)
                bottom = _lim(denominator, point, direction)
                if _indeterminate(top) and _indeterminate(bottom):
                    derived = sp.simplify(sp.diff(numerator, X) / sp.diff(denominator, X))
                    steps.append(step(
                        "lhospital", label("lhospital", lang),
                        fmt(sp.together(expr)), fmt(derived),
                        note("lhospital", lang), 0
                    ))
        except Exception:  # noqa: BLE001
            pass

    value = _lim(expr, point, direction)
    if value is None:
        raise ValueError(err("limit_failed", lang))
    verdict, answer, note_key = _verdict(value)
    steps.append(step(
        "limit_eval", label("limit_eval", lang), start,
        fmt(value) if verdict == "converges" else answer,
        note(note_key, lang), 0
    ))
    steps.append(step(
        "verdict", label("verdict", lang), answer,
        _text(label("verdict_ok" if verdict == "converges" else "verdict_div", lang)),
        "", 0
    ))
    secondary = fmt(value) if verdict == "diverges_inf" else None
    return answer, secondary, steps, verdict
