"""安全的表达式解析：只认 x 与常见初等函数。"""
import sympy as sp
from sympy.parsing.sympy_parser import (
    convert_xor,
    implicit_multiplication_application,
    parse_expr,
    standard_transformations,
)

from i18n import ERRORS

X = sp.Symbol("x", real=True)
TRANSFORMS = standard_transformations + (implicit_multiplication_application, convert_xor)

ALLOWED = {
    "x": X,
    "e": sp.E,
    "E": sp.E,
    "pi": sp.pi,
    "I": sp.I,
    "sin": sp.sin,
    "cos": sp.cos,
    "tan": sp.tan,
    "cot": sp.cot,
    "sec": sp.sec,
    "csc": sp.csc,
    "asin": sp.asin,
    "acos": sp.acos,
    "atan": sp.atan,
    "exp": sp.exp,
    "log": sp.log,
    "ln": sp.log,
    "sqrt": sp.sqrt,
    "abs": sp.Abs,
    "Abs": sp.Abs,
}


def parse(text, variable=X):
    """把用户输入的字符串变成 SymPy 表达式，拒绝其他自由符号。"""
    if not isinstance(text, str) or not text.strip():
        raise ValueError(ERRORS["empty"])
    cleaned = (
        text.strip()
        .replace("（", "(").replace("）", ")")
        .replace("×", "*").replace("÷", "/")
        .replace("−", "-").replace("·", "*")
    )
    try:
        expr = parse_expr(
            cleaned,
            local_dict=dict(ALLOWED, x=variable),
            transformations=TRANSFORMS,
            evaluate=True,
        )
    except Exception as exc:  # noqa: BLE001 —— 解析错误统一转成中文提示
        raise ValueError(f"{ERRORS['bad_expr']}：{exc}") from exc
    extra = expr.free_symbols - {variable}
    if extra:
        names = ", ".join(sorted(str(s) for s in extra))
        raise ValueError(f"{ERRORS['extra_symbol']}：{names}")
    return expr


def constant(text):
    """解析上下限 / 求值点：必须是常数表达式。"""
    value = parse(text)
    if value.has(X):
        raise ValueError(ERRORS["bad_limit"])
    return value
