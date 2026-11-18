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
        # 分部公式是 ∫u dv = uv − ∫v du，剩下那个积分的被积函数是 v·u'，
        # 不是 v 本身；之前写成 ∫v dx 会让人以为子步骤算错了。
        du = sp.diff(u, variable) if u is not None and variable is not None else None
        leftover = sp.simplify(v * du) if v is not None and du is not None else None
        steps.append(step(
            "parts", label("parts"),
            _as_integral(rule.integrand, variable),
            fmt_text(f"{_latex(u)}\\,{_latex(v)} - {_as_integral(leftover, variable)['latex']}"),
            f"取 u = {_text(u)}，dv = {_text(dv)}，则 du = {_text(du)} dx、v = {_text(v)}；"
            "分部积分后只需再算剩下那个较小的积分。", depth, FORMULAS["parts"]
        ))
        _walk(getattr(rule, "v_step", None), steps, depth + 1, preferred)
        _walk(getattr(rule, "second_step", None), steps, depth + 1, preferred)
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
            "substitution", label("substitution"),
            _as_integral(rule.integrand, variable),
            _as_integral(new_integrand, new_var),
            f"令 u = {_text(u_func)}，则 du = {_text(du)} dx，"
            f"把 dx 一起换成 du 后得到右边这个更简单的积分。", depth,
            FORMULAS["substitution"]
        ))
        _walk(substep, steps, depth + 1, preferred)
        return

    if name in ("ConstantTimesRule", "ConstMulRule"):
        constant = getattr(rule, "constant", "")
        other = getattr(rule, "other", rule.integrand)
        variable = getattr(rule, "variable", None)
        steps.append(step(
            "constant_multiple", label("constant_multiple"),
            _as_integral(rule.integrand, variable),
            _as_const_integral(constant, other, variable),
            f"把常数 {_text(constant)} 提到积分号外；它不会消失，最后要乘回结果。", depth
        ))
        _walk(getattr(rule, "substep", None), steps, depth + 1, preferred)
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
            "term_by_term", label("term_by_term"),
            _as_integral(rule.integrand, variable), after,
            "把和式拆成几项，分别积分后再相加。", depth
        ))
        for sub in substeps:
            _walk(sub, steps, depth + 1, preferred)
        return

    if name == "RewriteRule":
        variable = getattr(rule, "variable", None)
        rewritten = getattr(rule, "rewritten", rule.integrand)
        steps.append(step(
            "integral_direct", label("integral_direct"),
            _as_integral(rule.integrand, variable),
            _as_integral(rewritten, variable),
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
    variable = getattr(rule, "variable", None)
    if key == "integral_power" and isinstance(rule.integrand, sp.Pow):
        power = rule.integrand.exp
        note = (f"幂函数积分：指数 {_text(power)} 加 1 得 {_text(power + 1)}，"
                f"再除以 {_text(power + 1)}。")
    steps.append(step(key, label(key),
                      _as_integral(rule.integrand, variable),
                      _integrated(rule.integrand, variable),
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
