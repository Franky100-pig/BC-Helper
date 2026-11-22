"""把 SymPy manualintegrate 的规则树翻译为人能看懂的步骤。"""
import sympy as sp
from sympy.integrals.manualintegrate import integral_steps, manualintegrate

from format import fmt, fmt_text, step
from i18n import FORMULAS, err, label, note

MAX_STEPS = 16

RULE_LABELS = {
    "AddRule": "term_by_term",
    "ConstantTimesRule": "constant_multiple",
    "ConstMulRule": "constant_multiple",
    "PartsRule": "parts",
    "URule": "substitution",
    "AlternativeRule": "alternative",
    "PowerRule": "integral_power",
    "ExpRule": "integral_exp",
    "SinRule": "integral_trig",
    "CosRule": "integral_trig",
    "TanRule": "integral_trig",
    "LogRule": "integral_log",
    "ArctanRule": "integral_arctan",
    "ConstantRule": "integral_direct",
    "RewriteRule": "integral_direct",
}


def _latex(expr):
    return sp.latex(expr) if expr is not None else ""


def _text(expr):
    """说明文字里用可读写法（x^3、1/3），不要把 LaTeX 源码直接摆给学生看。"""
    return str(expr).replace("**", "^") if expr is not None else ""


def _as_integral(expr, var):
    """把「被积函数 + 变量」写成 ∫ expr dvar，供步骤的 before/after 使用。"""
    if expr is None or var is None:
        return fmt(expr)
    return {
        "latex": r"\int " + sp.latex(expr) + r"\,d" + sp.latex(var),
        "text": "∫ " + sp.pretty(expr, use_unicode=True) + " d" + str(var),
    }


def _as_const_integral(constant, expr, var):
    """常数 × ∫ expr dvar：常数提出积分号后仍要看得见。"""
    if expr is None or var is None:
        return _as_integral(expr, var)
    return {
        "latex": sp.latex(constant) + r"\int " + sp.latex(expr) + r"\,d" + sp.latex(var),
        "text": str(constant) + "∫ " + sp.pretty(expr, use_unicode=True) + " d" + str(var),
    }


def _integrated(expr, var):
    """基本积分规则的结果：∫ expr dvar 的原函数。"""
    if expr is None or var is None:
        return fmt(expr)
    try:
        return fmt(sp.integrate(expr, var))
    except Exception:  # noqa: BLE001
        return fmt(expr)


def _walk(rule, steps, depth=0, preferred=(), lang="zh"):
    if rule is None or len(steps) >= MAX_STEPS:
        return
    name = type(rule).__name__

    if name == "AlternativeRule":
        choices = list(getattr(rule, "alternatives", []))
        if not choices:
            return
        chosen = None
        for wanted in preferred:
            chosen = next((c for c in choices if type(c).__name__ == wanted), None)
            if chosen is not None:
                break
        if chosen is None:
            chosen = choices[0]
        if len(choices) > 1:
            steps.append(step(
                "alternative", label("alternative", lang), fmt(rule.integrand),
                fmt_text(note("alternative_try", lang, name=type(chosen).__name__)),
                note("alternative_note", lang, n=len(choices)), depth
            ))
        _walk(chosen, steps, depth, preferred, lang)
        return

    if name == "PartsRule":
        u = getattr(rule, "u", None)
        dv = getattr(rule, "dv", None)
        variable = getattr(rule, "variable", None)
        v = sp.integrate(dv, variable) if dv is not None and variable is not None else None
        # 分部公式是 ∫u dv = uv − ∫v du，剩下那个积分的被积函数是 v·u'，
        # 不是 v 本身；之前写成 ∫v dx 会让人以为子步骤算错了。
        du = sp.diff(u, variable) if u is not None and variable is not None else None
        leftover = sp.simplify(v * du) if v is not None and du is not None else None
        steps.append(step(
            "parts", label("parts", lang),
            _as_integral(rule.integrand, variable),
            fmt_text(f"{_latex(u)}\\,{_latex(v)} - {_as_integral(leftover, variable)['latex']}"),
            note("parts", lang, u=_text(u), dv=_text(dv), du=_text(du), v=_text(v)),
            depth, FORMULAS["parts"]
        ))
        _walk(getattr(rule, "v_step", None), steps, depth + 1, preferred, lang)
        _walk(getattr(rule, "second_step", None), steps, depth + 1, preferred, lang)
        return

    if name == "URule":
        u_var = getattr(rule, "u_var", None)
        u_func = getattr(rule, "u_func", None)
        variable = getattr(rule, "variable", None)
        du = sp.diff(u_func, variable) if u_func is not None and variable is not None else None
        substep = getattr(rule, "substep", None)
        # 换元后的被积函数从子规则读取（此时变量已是 u）；拿不到就退化成 ∫f(u)du。
        new_integrand = getattr(substep, "integrand", None) if substep is not None else None
        new_var = getattr(substep, "variable", None) or u_var
        if new_integrand is None:
            new_integrand = u_var
        steps.append(step(
            "substitution", label("substitution", lang),
            _as_integral(rule.integrand, variable),
            _as_integral(new_integrand, new_var),
            note("substitution", lang, u=_text(u_func), du=_text(du)),
            depth, FORMULAS["substitution"]
        ))
        _walk(substep, steps, depth + 1, preferred, lang)
        return

    if name in ("ConstantTimesRule", "ConstMulRule"):
        constant = getattr(rule, "constant", "")
        other = getattr(rule, "other", rule.integrand)
        variable = getattr(rule, "variable", None)
        steps.append(step(
            "constant_multiple", label("constant_multiple", lang),
            _as_integral(rule.integrand, variable),
            _as_const_integral(constant, other, variable),
            note("constant_multiple", lang, constant=_text(constant)), depth
        ))
        _walk(getattr(rule, "substep", None), steps, depth + 1, preferred, lang)
        return

    if name == "AddRule":
        variable = getattr(rule, "variable", None)
        substeps = list(getattr(rule, "substeps", []) or [])
        parts = [_as_integral(getattr(s, "integrand", None), getattr(s, "variable", None) or variable)
                 for s in substeps]
        after = {
            "latex": " + ".join(p["latex"] for p in parts) or _latex(rule.integrand),
            "text": " + ".join(p["text"] for p in parts) or _latex(rule.integrand),
        }
        steps.append(step(
            "term_by_term", label("term_by_term", lang),
            _as_integral(rule.integrand, variable), after,
            note("term_by_term", lang), depth
        ))
        for sub in substeps:
            _walk(sub, steps, depth + 1, preferred, lang)
        return

    if name == "RewriteRule":
        variable = getattr(rule, "variable", None)
        rewritten = getattr(rule, "rewritten", rule.integrand)
        steps.append(step(
            "integral_direct", label("integral_direct", lang),
            _as_integral(rule.integrand, variable),
            _as_integral(rewritten, variable),
            note("rewrite", lang), depth
        ))
        _walk(getattr(rule, "substep", None), steps, depth + 1, preferred, lang)
        return

    key = RULE_LABELS.get(name, "integral_direct")
    explanation = note(key, lang)
    variable = getattr(rule, "variable", None)
    if key == "integral_power" and isinstance(rule.integrand, sp.Pow):
        power = rule.integrand.exp
        explanation = note("integral_power_detail", lang,
                           power=_text(power), next=_text(power + 1))
    steps.append(step(key, label(key, lang),
                      _as_integral(rule.integrand, variable),
                      _integrated(rule.integrand, variable),
                      explanation, depth))


def integral_steps_for(expr, x, method="auto", lang="zh"):
    """返回 (原函数, 步骤列表)。method: auto / substitution / parts。"""
    preferred = {
        "substitution": ("URule",),
        "parts": ("PartsRule",),
    }.get(method, ())
    try:
        antiderivative = sp.simplify(manualintegrate(expr, x))
        rule_tree = integral_steps(expr, x)
    except Exception as exc:  # noqa: BLE001
        antiderivative = sp.integrate(expr, x)
        if isinstance(antiderivative, sp.Integral):
            raise ValueError(err("no_integral", lang)) from exc
        rule_tree = None
    if isinstance(antiderivative, sp.Integral):
        raise ValueError(err("no_integral", lang))

    steps = []
    if rule_tree is not None:
        _walk(rule_tree, steps, 0, preferred, lang)
    return antiderivative, steps


def antiderivative_with_steps(expr, x, method="auto", lang="zh"):
    """兼容旧调用名。"""
    return integral_steps_for(expr, x, method, lang)
