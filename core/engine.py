"""统一分发入口：网页、桌面、测试都调用这里的 dispatch()。"""
import sympy as sp

from derivative import derivative_steps
from expr import X, constant, parse
from format import fmt, fmt_text, step
from i18n import ERRORS, FORMULAS, label
from integral import integral_steps_for

VERSION = "0.1.0"


def _error(message):
    return {"ok": False, "error": {"message": message}, "version": VERSION}


def _derivative(payload, expr):
    try:
        order = int(payload.get("order", 1))
    except (TypeError, ValueError) as exc:
        raise ValueError(ERRORS["bad_order"]) from exc
    if order < 1 or order > 5:
        raise ValueError(ERRORS["bad_order"])

    result, steps = derivative_steps(expr, X, order)
    answer = fmt(result)
    secondary = None

    at = payload.get("at")
    if at is not None and str(at).strip():
        point = constant(str(at))
        value = sp.simplify(result.subs(X, point))
        steps.append(step(
            "evaluate", label("evaluate"), fmt(result), fmt(value),
            f"把 x = {str(point).replace('**', '^')} 代入导数表达式。", 0
        ))
        answer = fmt(value)
        secondary = fmt(result)

    return {
        "ok": True,
        "version": VERSION,
        "op": "derivative",
        "answer": answer,
        "secondary": secondary,
        "steps": steps,
        "meta": {
            "input": fmt(expr),
            "order": order,
            "at": str(at) if at else "",
        },
    }


def _integral(payload, expr):
    kind = payload.get("kind", "indefinite")
    method = payload.get("method", "auto")
    antiderivative, steps = integral_steps_for(expr, X, method)

    # 换元 / 提常数后，最后一步只算出 u 的基本积分；补一步「乘回常数 + 代回 u」，
    # 否则学生会看到 (2/3)u^(3/2) 却不知道怎么变成答案里的 2/9(x³+1)^(3/2)。
    has_substitution = any(s["rule"] == "substitution" for s in steps)
    if has_substitution and steps[-1]["rule"] in (
        "constant_multiple", "integral_power", "integral_exp",
        "integral_trig", "integral_log", "integral_arctan", "integral_direct",
    ):
        last_after = steps[-1]["after"]
        final = fmt(antiderivative)
        if last_after["latex"] != final["latex"]:
            steps.append(step(
                "back_substitute", label("back_substitute"), last_after, final,
                "把前面提到积分号外的常数乘回，再把 u 换回原来的 x，"
                "就得到最终的原函数（不定积分最后加 + C）。", 0
            ))

    if kind == "definite":
        lower = constant(str(payload.get("lower", "")))
        upper = constant(str(payload.get("upper", "")))
        value = sp.simplify(sp.integrate(expr, (X, lower, upper)))
        if isinstance(value, sp.Integral):
            raise ValueError(ERRORS["no_integral"])
        steps.append(step(
            "ftc", label("ftc"), fmt(antiderivative), fmt(value),
            f"F({str(upper).replace('**', '^')}) − F({str(lower).replace('**', '^')})。", 0, FORMULAS["ftc"]
        ))
        return {
            "ok": True,
            "version": VERSION,
            "op": "integral",
            "answer": fmt(value),
            "secondary": fmt(antiderivative),
            "steps": steps,
            "meta": {
                "input": fmt(expr),
                "kind": "definite",
                "lower": fmt(lower),
                "upper": fmt(upper),
                "method": method,
            },
        }

    return {
        "ok": True,
        "version": VERSION,
        "op": "integral",
        "answer": {
            "latex": sp.latex(antiderivative) + " + C",
            "text": sp.pretty(antiderivative, use_unicode=True) + " + C",
        },
        "secondary": None,
        "steps": steps,
        "meta": {
            "input": fmt(expr),
            "kind": "indefinite",
            "method": method,
        },
    }


def dispatch(payload):
    """payload 是 dict；返回可 JSON 序列化的结果。"""
    try:
        if not isinstance(payload, dict):
            raise ValueError("请求格式不对 (invalid payload)")
        op = payload.get("op")
        if op not in ("derivative", "integral"):
            raise ValueError(ERRORS["bad_op"])
        expr = parse(payload.get("expr", ""))
        return _derivative(payload, expr) if op == "derivative" else _integral(payload, expr)
    except Exception as exc:  # noqa: BLE001 —— 所有错误都变成结构化提示
        return _error(str(exc))
