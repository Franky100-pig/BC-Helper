"""级数敛散性判别：按 AP BC 常见判别法顺序给出可对照课本的逐步说明。"""
import sympy as sp

from expr import parse
from format import fmt, step
from i18n import err, label, note

N = sp.Symbol("n", integer=True, positive=True)
M = sp.Symbol("m", positive=True)


def _text(content):
    return {"latex": "\\text{" + content + "}", "text": content}


def _num(value):
    try:
        out = float(sp.N(value))
        return out if out == out and abs(out) != float("inf") else None
    except Exception:  # noqa: BLE001
        return None


def _sum_fmt(term, start):
    return {
        "latex": "\\sum_{n=" + str(start) + "}^{\\infty}" + sp.latex(term),
        "text": "sum(n=" + str(start) + "..oo) " + sp.pretty(term, use_unicode=True),
    }


def _positive_decreasing(f):
    values = [_num(f.subs(M, k)) for k in (10, 11, 12)]
    return all(v is not None and v > 0 for v in values) and values[1] < values[0] and values[2] < values[1]


def _ratio(term):
    return sp.simplify(term.subs(N, N + 1) / term)


def _abs_converges(positive_term):
    """给正项级数快速定性，用于判断交错级数是否绝对收敛。"""
    coeff, exponent = positive_term.as_coeff_exponent(N)
    if exponent.is_number and N not in coeff.free_symbols and exponent != 0 and coeff != 0:
        p = _num(-exponent)
        if p is not None:
            return p > 1
    try:
        rho = _num(sp.limit(sp.Abs(_ratio(positive_term)), N, sp.oo))
        if rho is not None and rho != 1:
            return rho < 1
    except Exception:  # noqa: BLE001
        pass
    return None


def parse_start(value, lang="zh"):
    try:
        start = int(str(value).strip() or "1")
    except (TypeError, ValueError) as exc:
        raise ValueError(err("bad_start", lang)) from exc
    if start < 0:
        raise ValueError(err("bad_start", lang))
    return start


def series_result(text, start, lang="zh"):
    """返回 (answer, secondary, steps, verdict)。"""
    term = parse(text, variable=N, lang=lang)
    whole = _sum_fmt(term, start)
    steps = []

    def finish(verdict, secondary=None):
        steps.append(step(
            "series_verdict", label("series_verdict", lang), whole,
            _text(label(verdict, lang)), "", 0
        ))
        return _text(label(verdict, lang)), secondary, steps, verdict

    if term == 0:
        return finish("converges_absolutely")

    # 1. 项判别：aₙ 不趋于 0 是最快、最硬的发散结论。
    first = None
    try:
        first = sp.limit(term, N, sp.oo)
        bad = (first in (sp.oo, -sp.oo, sp.nan, sp.zoo)
               or isinstance(first, (sp.AccumBounds, sp.Limit))
               or (first.is_number and first.is_finite and first != 0))
        if bad:
            after = fmt(first) if first.is_number and first.is_finite else _text(str(first))
            steps.append(step(
                "term_test", label("term_test", lang), whole, after,
                note("term_test", lang, lim=str(first).replace("**", "^")), 0
            ))
            return finish("diverges_series")
    except Exception:  # noqa: BLE001 —— SymPy 对含 (-1)^n 的极限常抛异常
        pass

    # 符号极限算不出时，用大 n 的幅值做兜底。
    try:
        samples = [_num(sp.Abs(term).subs(N, k)) for k in (1000, 10000)]
        if (all(v is not None for v in samples)
                and samples[1] > 1e-3 and samples[1] >= samples[0] * 0.9):
            steps.append(step(
                "term_test", label("term_test", lang), whole,
                _text(label("diverges_series", lang)),
                note("term_test", lang, lim="%.3f (n=10000)" % samples[1]), 0
            ))
            return finish("diverges_series")
    except Exception:  # noqa: BLE001
        pass

    # 2. 几何级数：公比是常数。
    try:
        ratio = _ratio(term)
        if ratio.is_number and ratio.free_symbols == set():
            r = _num(sp.Abs(ratio))
            verdict = "converges_absolutely" if r is not None and r < 1 else "diverges_series"
            steps.append(step(
                "geometric_series", label("geometric_series", lang), whole, fmt(ratio),
                note("geometric", lang, ratio=str(ratio).replace("**", "^")), 0
            ))
            return finish(verdict)
    except Exception:  # noqa: BLE001
        pass

    # 3. p-级数：通项能写成 c·n^p。
    try:
        coeff, exponent = term.as_coeff_exponent(N)
        if exponent.is_number and N not in coeff.free_symbols and exponent != 0 and coeff != 0:
            p = _num(-exponent)
            verdict = "converges_absolutely" if p is not None and p > 1 else "diverges_series"
            steps.append(step(
                "p_series", label("p_series", lang), whole, fmt(term),
                note("p_series", lang, p=str(-exponent).replace("**", "^")), 0
            ))
            return finish(verdict)
    except Exception:  # noqa: BLE001
        pass

    # 4. 交错级数：剥掉 (-1)^n 后检查 bₙ 递减趋零。
    for sign in ((-1) ** N, (-1) ** (N + 1)):
        try:
            b = sp.simplify(term / sign)
            if b == term or b.free_symbols - {N} or N not in b.free_symbols:
                continue
            if not _positive_decreasing(b.subs(N, M)):
                continue
            if sp.limit(b, N, sp.oo) != 0:
                continue
            absolute = _abs_converges(b)
            verdict = "converges_absolutely" if absolute is True else "converges_conditionally"
            steps.append(step(
                "alternating_series", label("alternating_series", lang), whole, fmt(b),
                note("alternating_absolute" if absolute is True else "alternating",
                     lang, b=sp.latex(b)), 0
            ))
            return finish(verdict)
        except Exception:  # noqa: BLE001
            continue

    # 5. 比值判别。
    try:
        ratio = _ratio(term)
        rho = sp.limit(sp.Abs(ratio), N, sp.oo)
        number = _num(rho)
        if rho in (sp.oo, -sp.oo) or (number is not None and number != 1):
            verdict = "converges_absolutely" if number is not None and number < 1 else "diverges_series"
            steps.append(step(
                "ratio_test", label("ratio_test", lang), whole, fmt(rho),
                note("ratio", lang, rho=str(rho).replace("**", "^")), 0
            ))
            return finish(verdict)
    except Exception:  # noqa: BLE001
        pass

    # 6. 根值判别。
    try:
        rho = sp.limit(sp.Abs(term) ** (sp.Rational(1, 1) / N), N, sp.oo)
        number = _num(rho)
        if rho in (sp.oo, -sp.oo) or (number is not None and number != 1):
            verdict = "converges_absolutely" if number is not None and number < 1 else "diverges_series"
            steps.append(step(
                "root_test", label("root_test", lang), whole, fmt(rho),
                note("root", lang, rho=str(rho).replace("**", "^")), 0
            ))
            return finish(verdict)
    except Exception:  # noqa: BLE001
        pass

    # 7. 积分判别：正项、递减、连续时与广义积分同敛散。
    try:
        f = term.subs(N, M)
        if _positive_decreasing(f):
            total = sp.integrate(f, (M, 2, sp.oo))
            if total in (sp.oo, -sp.oo) or (total.is_number and total.is_finite):
                verdict = "converges_absolutely" if total.is_number and total.is_finite else "diverges_series"
                steps.append(step(
                    "integral_test", label("integral_test", lang), whole, fmt(total),
                    note("integral", lang, value=str(total).replace("**", "^")), 0
                ))
                return finish(verdict)
    except Exception:  # noqa: BLE001
        pass

    # 8. 最后让 SymPy 试着直接求和；仍无结果就如实说无法判定。
    try:
        total = sp.summation(term, (N, start, sp.oo))
        if total in (sp.oo, -sp.oo) or (total.is_number and total.is_finite):
            verdict = "converges_absolutely" if total.is_number and total.is_finite else "diverges_series"
            steps.append(step(
                "summation", label("summation", lang), whole, fmt(total),
                note("summation", lang, value=str(total).replace("**", "^")), 0
            ))
            return finish(verdict, fmt(total) if verdict != "diverges_series" else None)
    except Exception:  # noqa: BLE001
        pass

    steps.append(step(
        "inconclusive", label("inconclusive", lang), whole,
        _text(label("inconclusive", lang)), note("inconclusive", lang), 0
    ))
    return finish("inconclusive")
