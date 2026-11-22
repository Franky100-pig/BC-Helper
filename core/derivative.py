"""按求导法则递归生成步骤，而不是只给最终答案。"""
import sympy as sp

from format import fmt, step
from i18n import FORMULAS, label, note

TRIG_OUTER = {
    sp.sin: ("trig", "d(sin u)/du = cos u"),
    sp.cos: ("trig", "d(cos u)/du = −sin u"),
    sp.tan: ("trig", "d(tan u)/du = sec² u"),
    sp.cot: ("trig", "d(cot u)/du = −csc² u"),
    sp.sec: ("trig", "d(sec u)/du = sec u·tan u"),
    sp.csc: ("trig", "d(csc u)/du = −csc u·cot u"),
    sp.asin: ("inverse_trig", "d(asin u)/du = 1/√(1−u²)"),
    sp.acos: ("inverse_trig", "d(acos u)/du = −1/√(1−u²)"),
    sp.atan: ("inverse_trig", "d(atan u)/du = 1/(1+u²)"),
    sp.exp: ("exp", "d(e^u)/du = e^u"),
    sp.log: ("log", "d(ln u)/du = 1/u"),
}


def _diff(expr, x, depth=0, lang="zh"):
    """返回 (导数, 步骤列表)。步骤按「先总览、后展开」排列。"""
    if not expr.has(x):
        return sp.S.Zero, [
            step("constant", label("constant", lang), fmt(expr), fmt(0),
                 note("constant", lang), depth)
        ]

    if isinstance(expr, sp.Add):
        pieces = [_diff(term, x, depth + 1, lang) for term in expr.args]
        deriv = sum(p[0] for p in pieces)
        steps = [step("sum", label("sum", lang), fmt(expr), fmt(deriv),
                      note("sum", lang), depth, FORMULAS["sum"])]
        for piece in pieces:
            steps.extend(piece[1])
        return deriv, steps

    if isinstance(expr, sp.Mul):
        factors = [f for f in expr.args if f.has(x)]
        coeff = sp.prod([f for f in expr.args if not f.has(x)])
        pieces = [_diff(f, x, depth + 1, lang) for f in factors]
        deriv = coeff * sum(
            piece[0] * sp.prod([f for j, f in enumerate(factors) if j != i])
            for i, piece in enumerate(pieces)
        )
        explanation = (
            note("product_one", lang)
            if len(factors) == 1 else
            note("product_many", lang, n=len(factors))
        )
        steps = [step("product", label("product", lang), fmt(expr), fmt(deriv),
                      explanation, depth, FORMULAS["product"])]
        for piece in pieces:
            steps.extend(piece[1])
        return deriv, steps

    if isinstance(expr, sp.Pow):
        base, power = expr.as_base_exp()
        if power.is_number:
            if base == x:
                deriv = power * x ** (power - 1)
                return deriv, [step(
                    "power", label("power", lang), fmt(expr), fmt(deriv),
                    note("power", lang, power=power), depth, FORMULAS["power"]
                )]
            inner, sub = _diff(base, x, depth + 1, lang)
            deriv = power * base ** (power - 1) * inner
            steps = [step("power_chain", label("power_chain", lang), fmt(expr), fmt(deriv),
                          note("power_chain", lang), depth, FORMULAS["chain"])]
            steps.extend(sub)
            return deriv, steps
        if base == sp.E:
            inner, sub = _diff(power, x, depth + 1, lang)
            deriv = expr * inner
            steps = [step("exp", label("exp", lang), fmt(expr), fmt(deriv),
                          note("exp", lang), depth, "d(e^u)/du = e^u")]
            steps.extend(sub)
            return deriv, steps
        deriv = sp.diff(expr, x)
        return deriv, [step("log", label("log", lang), fmt(expr), fmt(deriv),
                            note("log", lang), depth)]

    if isinstance(expr, sp.Function) and len(expr.args) == 1:
        inner, sub = _diff(expr.args[0], x, depth + 1, lang)
        deriv = sp.diff(expr, x)
        rule, outer = TRIG_OUTER.get(expr.func, ("direct", note("outer_fallback", lang)))
        steps = [step(rule, label(rule, lang), fmt(expr), fmt(deriv),
                      note("function_outer", lang, outer=outer), depth,
                      FORMULAS["chain"])]
        steps.extend(sub)
        return deriv, steps

    deriv = sp.diff(expr, x)
    return deriv, [step("direct", label("direct", lang), fmt(expr), fmt(deriv),
                        note("direct", lang), depth)]


def derivative_steps(expr, x, order=1, lang="zh"):
    """计算第 order 阶导数，返回 (结果, 步骤列表)。"""
    steps = []
    current = expr
    for n in range(1, order + 1):
        deriv, substeps = _diff(current, x, lang=lang)
        steps.append(step(
            "order", label("order", lang, n=n), fmt(current), fmt(deriv),
            note("order_note", lang), 0
        ))
        steps.extend(substeps)
        current = deriv
    return sp.simplify(current), steps
