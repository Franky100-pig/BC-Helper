"""把 SymPy manualintegrate 的规则树翻译为人能看懂的步骤。"""
import sympy as sp
from sympy.integrals.manualintegrate import integral_steps, manualintegrate

from format import fmt, fmt_text, step
from i18n import ERRORS, FORMULAS, label

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


def _walk(rule, steps, depth=0, preferred=()):
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
                "alternative", label("alternative"), fmt(rule.integrand),
                fmt_text(f"优先尝试 {type(chosen).__name__}"),
                f"SymPy 找到 {len(choices)} 条可能的路径。", depth
            ))
        _walk(chosen, steps, depth, preferred)
        return

    if name == "PartsRule":
        u = getattr(rule, "u", None)
        dv = getattr(rule, "dv", None)
        variable = getattr(rule, "variable", None)
        v = sp.integrate(dv, variable) if dv is not None and variable is not None else None
        steps.append(step(
            "parts", label("parts"), fmt(rule.integrand),
            fmt_text(f"u = {_latex(u)}, dv = {_latex(dv)}, v = {_latex(v)}"),
            "分部积分：先凑出 u 和 dv，再处理剩下的积分。", depth, FORMULAS["parts"]
        ))
        _walk(getattr(rule, "v_step", None), steps, depth + 1, preferred)
        _walk(getattr(rule, "second_step", None), steps, depth + 1, preferred)
        return

    if name == "URule":
        u_var = getattr(rule, "u_var", None)
        u_func = getattr(rule, "u_func", None)
        variable = getattr(rule, "variable", None)
        du = sp.diff(u_func, variable) if u_func is not None and variable is not None else None
        steps.append(step(
            "substitution", label("substitution"), fmt(rule.integrand),
            fmt_text(f"u = {_latex(u_func)}"),
            f"令 u = {_latex(u_func)}，则 du = {_latex(du)} dx。", depth,
            FORMULAS["substitution"]
        ))
        _walk(getattr(rule, "substep", None), steps, depth + 1, preferred)
        return

    if name in ("ConstantTimesRule", "ConstMulRule"):
        steps.append(step(
            "constant_multiple", label("constant_multiple"), fmt(rule.integrand),
            fmt(getattr(rule, "other", rule.integrand)),
            f"把常数 {_latex(getattr(rule, 'constant', ''))} 提到积分号外。", depth
        ))
        _walk(getattr(rule, "substep", None), steps, depth + 1, preferred)
        return

    if name == "AddRule":
        steps.append(step(
            "term_by_term", label("term_by_term"), fmt(rule.integrand),
            fmt(rule.integrand), "把和式拆成几项，分别积分后再相加。", depth
        ))
        for sub in getattr(rule, "substeps", []):
            _walk(sub, steps, depth + 1, preferred)
        return

    if name == "RewriteRule":
        steps.append(step(
            "integral_direct", label("integral_direct"), fmt(rule.integrand),
            fmt(getattr(rule, "rewritten", rule.integrand)),
            "先做恒等变形，再用基本积分公式。", depth
        ))
        _walk(getattr(rule, "substep", None), steps, depth + 1, preferred)
        return

    key = RULE_LABELS.get(name, "integral_direct")
    note = {
        "integral_power": "幂函数积分：指数加 1，再除以新指数。",
        "integral_exp": "指数函数积分：e 的原函数还是 e 的函数。",
        "integral_trig": "套用三角函数的基本积分公式。",
        "integral_log": "对数函数积分：原函数含 x·ln x − x。",
        "integral_arctan": "形如 1/(a²+x²) 的积分得到反正切。",
    }.get(key, "套用基本积分公式。")
    steps.append(step(key, label(key), fmt(rule.integrand), fmt(rule.integrand),
                      note, depth))


def integral_steps_for(expr, x, method="auto"):
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
            raise ValueError(ERRORS["no_integral"]) from exc
        rule_tree = None
    if isinstance(antiderivative, sp.Integral):
        raise ValueError(ERRORS["no_integral"])

    steps = []
    if rule_tree is not None:
        _walk(rule_tree, steps, 0, preferred)
    return antiderivative, steps


def antiderivative_with_steps(expr, x, method="auto"):
    """兼容旧调用名。"""
    return integral_steps_for(expr, x, method)
