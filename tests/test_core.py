"""核心引擎测试：求导 / 积分 / 错误处理。"""
from engine import dispatch


def test_derivative_product_and_chain():
    result = dispatch({"op": "derivative", "expr": "x^2*sin(x)+e^(2x)", "order": 1})
    assert result["ok"]
    titles = " ".join(step["title"] for step in result["steps"])
    assert "乘积法则" in titles
    assert "链式法则" in titles or "指数函数求导" in titles
    assert result["answer"]["latex"]


def test_derivative_higher_order_and_point():
    result = dispatch({"op": "derivative", "expr": "x^3+2x", "order": 1, "at": "1"})
    assert result["ok"]
    assert result["answer"]["text"].strip() == "5"
    assert result["secondary"]["latex"] == "3 x^{2} + 2"


def test_integral_substitution():
    result = dispatch({
        "op": "integral",
        "expr": "x^2*sqrt(x^3+1)",
        "kind": "indefinite",
        "method": "substitution",
    })
    assert result["ok"]
    assert any("换元积分法" in step["title"] for step in result["steps"])
    assert "x^{3} + 1" in result["answer"]["latex"]
    assert result["answer"]["latex"].endswith("+ C")


def test_integral_steps_show_equivalent_transformations():
    """每一步的 before→after 必须是看得懂的等价变形，不能像丢因子或原样不动。"""
    result = dispatch({
        "op": "integral", "expr": "x^2*sqrt(x^3+1)",
        "kind": "indefinite", "method": "substitution",
    })
    assert result["ok"]
    steps = result["steps"]
    sub = next(s for s in steps if s["rule"] == "substitution")
    const = next(s for s in steps if s["rule"] == "constant_multiple")
    power = next(s for s in steps if s["rule"] == "integral_power")

    # 换元：after 应是换元后的积分 ∫(1/3)√u du，而不是把被积函数写成 "u = ..."
    assert "\\int" in sub["after"]["latex"], "换元步没有显示换元后的积分"
    assert "=" not in sub["after"]["latex"], "换元步的 after 不应是一句定义"
    assert "u" in sub["after"]["latex"]

    # 提常数：1/3 必须还在（只是从积分号内移到号外），不能凭空消失
    assert "frac{1}{3}" in const["after"]["latex"] or "\\frac{1}{3}" in const["after"]["latex"], \
        "提出常数后 1/3 不见了"
    assert "\\int" in const["after"]["latex"], "提出常数后应显示为常数乘积分"

    # 幂函数积分：必须显示积分结果，不能 √u → √u 原样不动
    assert power["before"]["latex"] != power["after"]["latex"], "幂函数积分步没有变化"
    assert "frac{3}{2}" in power["after"]["latex"] or "frac{2}{3}" in power["after"]["latex"], \
        "幂函数积分步没有显示新的指数"


def test_integral_parts():
    result = dispatch({"op": "integral", "expr": "x*ln(x)", "kind": "indefinite", "method": "parts"})
    assert result["ok"]
    assert any("分部积分法" in step["title"] for step in result["steps"])


def test_definite_integral():
    result = dispatch({
        "op": "integral", "expr": "x^2", "kind": "definite", "lower": "0", "upper": "2"
    })
    assert result["ok"]
    assert result["answer"]["text"].strip() == "8/3"
    assert any("牛顿-莱布尼茨" in step["title"] for step in result["steps"])


def test_step_shape():
    result = dispatch({"op": "derivative", "expr": "sin(x^2)", "order": 2})
    assert result["ok"]
    for step in result["steps"]:
        assert {"rule", "title", "before", "after", "note", "depth"} <= set(step)
        assert "latex" in step["before"] and "text" in step["before"]


def test_errors():
    assert not dispatch({"op": "derivative", "expr": ""})["ok"]
    assert not dispatch({"op": "derivative", "expr": "y^2"})["ok"]
    assert not dispatch({"op": "derivative", "expr": "x", "order": 6})["ok"]
    assert not dispatch({"op": "derivative", "expr": "x", "order": 99})["ok"]
    assert not dispatch({"op": "integral", "expr": "x", "kind": "definite", "lower": "x", "upper": "2"})["ok"]
    assert not dispatch({"op": "limit", "expr": "x"})["ok"]


def test_english_steps_and_errors():
    """lang=en 时标题/说明/错误提示全英文；缺省仍保持中文优先。"""
    result = dispatch({
        "op": "derivative", "expr": "x^2*sin(x)+e^(2x)", "order": 1, "lang": "en",
    })
    assert result["ok"]
    titles = [step["title"] for step in result["steps"]]
    assert "Derivative order 1" in titles
    assert "Sum rule" in titles and "Product rule" in titles
    notes = " ".join(step["note"] for step in result["steps"])
    assert "Split the sum" in notes
    assert not any("\u4e00" <= ch <= "\u9fff" for ch in " ".join(titles) + notes)

    integral = dispatch({
        "op": "integral", "expr": "x^2*sqrt(x^3+1)",
        "method": "substitution", "lang": "en",
    })
    assert any(step["title"] == "u-substitution" for step in integral["steps"])

    error = dispatch({"op": "derivative", "expr": "x", "order": 6, "lang": "en"})
    assert error["error"]["message"] == "Derivative order must be an integer from 1 to 5"


def test_limit_convergence_verdicts():
    finite = dispatch({"op": "limit", "expr": "sin(x)/x", "at": "0"})
    assert finite["ok"]
    assert finite["answer"]["text"].strip() == "1"
    assert finite["meta"]["verdict"] == "converges"
    assert any("洛必达" in s["title"] for s in finite["steps"])

    at_infinity = dispatch({"op": "limit", "expr": "1/x", "at": "oo"})
    assert at_infinity["ok"] and at_infinity["answer"]["text"].strip() == "0"

    unbounded = dispatch({"op": "limit", "expr": "x^2", "at": "oo"})
    assert unbounded["meta"]["verdict"] == "diverges_inf"
    assert "发散" in unbounded["answer"]["text"]

    oscillating = dispatch({"op": "limit", "expr": "sin(x)", "at": "oo"})
    assert oscillating["meta"]["verdict"] == "dne"
    assert "DNE" in oscillating["steps"][-2]["after"]["latex"]

    one_sided = dispatch({"op": "limit", "expr": "1/(x-1)", "at": "1", "side": "left"})
    assert one_sided["meta"]["verdict"] == "diverges_inf"
    assert "1^{-}" in one_sided["steps"][0]["before"]["latex"]


def test_limit_english_and_bad_point():
    result = dispatch({
        "op": "limit", "expr": "ln(x)/x", "at": "oo", "lang": "en",
    })
    assert result["ok"]
    titles = " ".join(s["title"] for s in result["steps"])
    assert "L'Hôpital's rule" in titles and "Convergence verdict" in titles
    notes = " ".join(s["note"] for s in result["steps"])
    assert not any("\u4e00" <= ch <= "\u9fff" for ch in titles + notes)
    assert not dispatch({"op": "limit", "expr": "x", "at": "not-a-point"})["ok"]


def test_series_convergence_tests():
    geometric = dispatch({"op": "series", "expr": "(1/2)^n"})
    assert geometric["ok"] and geometric["meta"]["verdict"] == "converges_absolutely"
    assert any("几何级数" in s["title"] for s in geometric["steps"])

    p_series = dispatch({"op": "series", "expr": "1/n^2"})
    assert p_series["meta"]["verdict"] == "converges_absolutely"
    assert any("p-级数" in s["title"] for s in p_series["steps"])

    harmonic = dispatch({"op": "series", "expr": "1/n"})
    assert harmonic["meta"]["verdict"] == "diverges_series"

    alternating = dispatch({"op": "series", "expr": "(-1)^n/n"})
    assert alternating["meta"]["verdict"] == "converges_conditionally"
    assert any("交错级数" in s["title"] for s in alternating["steps"])

    absolute_alt = dispatch({"op": "series", "expr": "(-1)^n/n^2"})
    assert absolute_alt["meta"]["verdict"] == "converges_absolutely"

    ratio = dispatch({"op": "series", "expr": "n/2^n"})
    assert ratio["meta"]["verdict"] == "converges_absolutely"
    assert any("比值判别" in s["title"] for s in ratio["steps"])

    integral = dispatch({"op": "series", "expr": "1/(n*ln(n))"})
    assert integral["meta"]["verdict"] == "diverges_series"
    assert any("积分判别" in s["title"] for s in integral["steps"])

    term = dispatch({"op": "series", "expr": "(-1)^n*n/(n+1)"})
    assert term["meta"]["verdict"] == "diverges_series"
    assert any("项判别" in s["title"] for s in term["steps"])


def test_series_english_and_bad_start():
    result = dispatch({"op": "series", "expr": "(-1)^n/n", "lang": "en"})
    assert result["ok"] and result["answer"]["text"] == "Converges conditionally"
    titles = " ".join(s["title"] for s in result["steps"])
    notes = " ".join(s["note"] for s in result["steps"])
    assert "Alternating series test" in titles
    assert not any("\u4e00" <= ch <= "\u9fff" for ch in titles + notes)
    assert not dispatch({"op": "series", "expr": "1/n", "start": "bad"})["ok"]


def test_step_notes_mark_math_for_katex():
    """说明文案里的表达式用 $...$ 标出来，前端才能交给 KaTeX 排版。"""
    payload = {
        "op": "integral", "expr": "x^2*sqrt(x^3+1)",
        "kind": "indefinite", "method": "substitution",
    }
    for lang in ("zh", "en"):
        result = dispatch({**payload, "lang": lang})
        note = next(s["note"] for s in result["steps"] if s["rule"] == "substitution")
        assert note.count("$") >= 4 and note.count("$") % 2 == 0, note
        assert "x^3 + 1" in note, note
        assert "$u = " in note and "$du = " in note, note


def test_default_language_is_chinese():
    result = dispatch({"op": "derivative", "expr": "x^2*sin(x)", "order": 1})
    titles = " ".join(step["title"] for step in result["steps"])
    assert "乘积法则" in titles or "和的法则" in titles
