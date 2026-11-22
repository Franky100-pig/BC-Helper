"""统一分发入口：网页、桌面、测试都调用这里的 dispatch()。"""
import sympy as sp

from derivative import derivative_steps
from expr import X, constant, parse
from format import fmt, step
from i18n import FORMULAS, err, label, note
from integral import integral_steps_for

VERSION = "0.1.0"


def _lang(payload):
    value = payload.get("lang", "zh") if isinstance(payload, dict) else "zh"
    return value if value in ("zh", "en") else "zh"


def _error(message):
    return {"ok": False, "error": {"message": message}, "version": VERSION}


def _derivative(payload, expr, lang):
    try:
        order = int(payload.get("order", 1))
    except (TypeError, ValueError) as exc:
        raise ValueError(err("bad_order", lang)) from exc
    if order < 1 or order > 5:
        raise ValueError(err("bad_order", lang))

    result, steps = derivative_steps(expr, X, order, lang)
    answer = fmt(result)
    secondary = None

    at = payload.get("at")
    if at is not None and str(at).strip():
        point = constant(str(at), lang)
        value = sp.simplify(result.subs(X, point))
        steps.append(step(
            "evaluate", label("evaluate", lang), fmt(result), fmt(value),
            note("evaluate", lang, point=str(point).replace("**", "^")), 0
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


def _integral(payload, expr, lang):
    kind = payload.get("kind", "indefinite")
    method = payload.get("method", "auto")
    antiderivative, steps = integral_steps_for(expr, X, method, lang)

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
                "back_substitute", label("back_substitute", lang), last_after, final,
                note("back_substitute", lang), 0
            ))

    if kind == "definite":
        lower = constant(str(payload.get("lower", "")), lang)
        upper = constant(str(payload.get("upper", "")), lang)
        value = sp.simplify(sp.integrate(expr, (X, lower, upper)))
        if isinstance(value, sp.Integral):
            raise ValueError(err("no_integral", lang))
        steps.append(step(
            "ftc", label("ftc", lang), fmt(antiderivative), fmt(value),
            note("ftc", lang,
                 upper=str(upper).replace("**", "^"),
                 lower=str(lower).replace("**", "^")),
            0, FORMULAS["ftc"]
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
    """payload 是 dict；返回可 JSON 序列化的结果。lang: zh（默认）/ en。"""
    lang = _lang(payload)
    try:
        if not isinstance(payload, dict):
            raise ValueError(err("bad_payload", lang))
        op = payload.get("op")
        if op not in ("derivative", "integral"):
            raise ValueError(err("bad_op", lang))
        expr = parse(payload.get("expr", ""), lang=lang)
        if op == "derivative":
            return _derivative(payload, expr, lang)
        return _integral(payload, expr, lang)
    except Exception as exc:  # noqa: BLE001 —— 所有错误都变成结构化提示
        return _error(str(exc))
