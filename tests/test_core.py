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
    assert not dispatch({"op": "derivative", "expr": "x", "order": 99})["ok"]
    assert not dispatch({"op": "integral", "expr": "x", "kind": "definite", "lower": "x", "upper": "2"})["ok"]
    assert not dispatch({"op": "limit", "expr": "x"})["ok"]
