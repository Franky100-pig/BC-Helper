"""按求导法则递归生成步骤，而不是只给最终答案。"""
import sympy as sp

from format import fmt, step
from i18n import FORMULAS, label

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


def _diff(expr, x, depth=0):
    """返回 (导数, 步骤列表)。步骤按「先总览、后展开」排列。"""
    if not expr.has(x):
        return sp.S.Zero, [
            step("constant", label("constant"), fmt(expr), fmt(0),
                 "表达式不含 x，所以导数为 0。", depth)
        ]

    if isinstance(expr, sp.Add):
        pieces = [_diff(term, x, depth + 1) for term in expr.args]
        deriv = sum(p[0] for p in pieces)
        steps = [step("sum", label("sum"), fmt(expr), fmt(deriv),
                      "把和式拆开，逐项求导后再相加。", depth, FORMULAS["sum"])]
        for piece in pieces:
            steps.extend(piece[1])
        return deriv, steps

    if isinstance(expr, sp.Mul):
        factors = [f for f in expr.args if f.has(x)]
        coeff = sp.prod([f for f in expr.args if not f.has(x)])
        pieces = [_diff(f, x, depth + 1) for f in factors]
        deriv = coeff * sum(
            piece[0] * sp.prod([f for j, f in enumerate(factors) if j != i])
            for i, piece in enumerate(pieces)
        )
        note = (
            "常数系数保留，只对含 x 的因子轮流求导。"
            if len(factors) == 1 else
            f"共有 {len(factors)} 个含 x 的因子，每个因子轮流求导一次。"
        )
        steps = [step("product", label("product"), fmt(expr), fmt(deriv),
                      note, depth, FORMULAS["product"])]
        for piece in pieces:
            steps.extend(piece[1])
        return deriv, steps

    if isinstance(expr, sp.Pow):
        base, power = expr.as_base_exp()
        if power.is_number:
            if base == x:
                deriv = power * x ** (power - 1)
                return deriv, [step(
                    "power", label("power"), fmt(expr), fmt(deriv),
                    f"指数 n = {power}，把指数降下来。", depth, FORMULAS["power"]
                )]
            inner, sub = _diff(base, x, depth + 1)
            deriv = power * base ** (power - 1) * inner
            steps = [step("power_chain", label("power_chain"), fmt(expr), fmt(deriv),
                          "外层用幂法则，内层继续求导。", depth, FORMULAS["chain"])]
            steps.extend(sub)
            return deriv, steps
        if base == sp.E:
            inner, sub = _diff(power, x, depth + 1)
            deriv = expr * inner
            steps = [step("exp", label("exp"), fmt(expr), fmt(deriv),
                          "e 的指数函数求导：原函数乘指数的导数。", depth,
                          "d(e^u)/du = e^u")]
            steps.extend(sub)
            return deriv, steps
        deriv = sp.diff(expr, x)
        return deriv, [step("log", label("log"), fmt(expr), fmt(deriv),
                            "底数和指数都含 x，用对数求导法。", depth)]

    if isinstance(expr, sp.Function) and len(expr.args) == 1:
        inner, sub = _diff(expr.args[0], x, depth + 1)
        deriv = sp.diff(expr, x)
        rule, outer = TRIG_OUTER.get(expr.func, ("direct", "套用基本求导公式。"))
        steps = [step(rule, label(rule), fmt(expr), fmt(deriv),
                      f"先对外层求导（{outer}），再乘内层的导数。", depth,
                      FORMULAS["chain"])]
        steps.extend(sub)
        return deriv, steps

    deriv = sp.diff(expr, x)
    return deriv, [step("direct", label("direct"), fmt(expr), fmt(deriv),
                        "套用 SymPy 的基本求导规则。", depth)]


def derivative_steps(expr, x, order=1):
    """计算第 order 阶导数，返回 (结果, 步骤列表)。"""
    steps = []
    current = expr
    for n in range(1, order + 1):
        deriv, substeps = _diff(current, x)
        steps.append(step(
            "order", label("order", n=n), fmt(current), fmt(deriv),
            "下面是这一阶用到的具体法则。", 0
        ))
        steps.extend(substeps)
        current = deriv
    return sp.simplify(current), steps
