"""分步讲解文案字典：中文是源语言，英文按同一组 key 对齐。

关键概念保留英文原名；lang 只影响「讲解文字」，不影响公式与答案。
dispatch(payload) 读取 payload["lang"]，缺省 zh，保持旧调用行为不变。
"""

RULES = {
    "zh": {
        "order": "第 {n} 阶导数 (derivative order {n})",
        "sum": "和的法则 (sum rule)",
        "product": "乘积法则 (product rule)",
        "power": "幂法则 (power rule)",
        "chain": "链式法则 (chain rule)",
        "power_chain": "幂法则 + 链式法则 (power + chain rule)",
        "constant": "常数法则 (constant rule)",
        "trig": "三角函数求导 (trigonometric derivative)",
        "exp": "指数函数求导 (exponential derivative)",
        "log": "对数函数求导 (logarithmic derivative)",
        "inverse_trig": "反三角函数求导 (inverse trig derivative)",
        "direct": "直接求导 (direct differentiation)",
        "evaluate": "代入求值 (evaluate at a point)",
        "substitution": "换元积分法 (u-substitution)",
        "parts": "分部积分法 (integration by parts)",
        "constant_multiple": "提出常数 (constant multiple rule)",
        "term_by_term": "逐项积分 (term-by-term integration)",
        "alternative": "候选方法 (candidate methods)",
        "ftc": "牛顿-莱布尼茨公式 (fundamental theorem of calculus)",
        "integral_power": "幂函数积分 (power rule for integration)",
        "integral_exp": "指数函数积分 (exponential integral)",
        "integral_trig": "三角函数积分 (trigonometric integral)",
        "integral_log": "对数函数积分 (logarithmic integral)",
        "integral_arctan": "反正切积分 (arctangent integral)",
        "integral_direct": "基本积分公式 (basic integral formula)",
        "back_substitute": "回代与合并 (back-substitute and combine)",
    },
    "en": {
        "order": "Derivative order {n}",
        "sum": "Sum rule",
        "product": "Product rule",
        "power": "Power rule",
        "chain": "Chain rule",
        "power_chain": "Power rule + chain rule",
        "constant": "Constant rule",
        "trig": "Trigonometric derivative",
        "exp": "Exponential derivative",
        "log": "Logarithmic derivative",
        "inverse_trig": "Inverse trig derivative",
        "direct": "Direct differentiation",
        "evaluate": "Evaluate at a point",
        "substitution": "u-substitution",
        "parts": "Integration by parts",
        "constant_multiple": "Constant multiple rule",
        "term_by_term": "Term-by-term integration",
        "alternative": "Candidate methods",
        "ftc": "Fundamental theorem of calculus",
        "integral_power": "Power rule for integration",
        "integral_exp": "Exponential integral",
        "integral_trig": "Trigonometric integral",
        "integral_log": "Logarithmic integral",
        "integral_arctan": "Arctangent integral",
        "integral_direct": "Basic integral formula",
        "back_substitute": "Back-substitute and combine",
    },
}

FORMULAS = {
    "sum": "(f + g)' = f' + g'",
    "product": "(uv)' = u'v + uv'",
    "power": "(x^n)' = n·x^(n-1)",
    "chain": "(f(g(x)))' = f'(g(x))·g'(x)",
    "parts": "∫u dv = uv − ∫v du",
    "substitution": "∫f(g(x))g'(x)dx = ∫f(u)du",
    "ftc": "∫[a,b] f(x)dx = F(b) − F(a)",
}

ERRORS = {
    "zh": {
        "bad_payload": "请求格式不对 (invalid payload)",
        "empty": "表达式不能为空 (empty expression)",
        "bad_expr": "看不懂这个表达式，检查一下括号和函数名 (cannot parse expression)",
        "extra_symbol": "只支持变量 x，出现了额外符号 (only x is supported)",
        "bad_order": "求导阶数必须是 1 到 5 的整数 (order must be 1–5)",
        "bad_limit": "上下限必须是常数，不能含 x (bounds must be constants)",
        "bad_op": "未知计算类型 (unknown operation)",
        "no_integral": "SymPy 暂时算不出这个积分 (SymPy could not evaluate this integral)",
    },
    "en": {
        "bad_payload": "Invalid payload",
        "empty": "The expression is empty",
        "bad_expr": "Cannot parse this expression — check parentheses and function names",
        "extra_symbol": "Only the variable x is supported",
        "bad_order": "Derivative order must be an integer from 1 to 5",
        "bad_limit": "Bounds must be constants; they cannot contain x",
        "bad_op": "Unknown operation",
        "no_integral": "SymPy could not evaluate this integral",
    },
}

# 分步说明：模板里的占位符由调用方填入，公式本身由 before/after 展示。
NOTES = {
    "zh": {
        "constant": "表达式不含 x，所以导数为 0。",
        "sum": "把和式拆开，逐项求导后再相加。",
        "product_one": "常数系数保留，只对含 x 的因子轮流求导。",
        "product_many": "共有 {n} 个含 x 的因子，每个因子轮流求导一次。",
        "power": "指数 n = {power}，把指数降下来。",
        "power_chain": "外层用幂法则，内层继续求导。",
        "exp": "e 的指数函数求导：原函数乘指数的导数。",
        "log": "底数和指数都含 x，用对数求导法。",
        "function_outer": "先对外层求导（{outer}），再乘内层的导数。",
        "outer_fallback": "套用基本求导公式",
        "direct": "套用 SymPy 的基本求导规则。",
        "order_note": "下面是这一阶用到的具体法则。",
        "evaluate": "把 x = {point} 代入导数表达式。",
        "back_substitute": "把前面提到积分号外的常数乘回，再把 u 换回原来的 x，就得到最终的原函数（不定积分最后加 + C）。",
        "ftc": "F({upper}) − F({lower})。",
        "alternative_try": "优先尝试 {name}",
        "alternative_note": "SymPy 找到 {n} 条可能的路径。",
        "parts": "取 u = {u}，dv = {dv}，则 du = {du} dx、v = {v}；分部积分后只需再算剩下那个较小的积分。",
        "substitution": "令 u = {u}，则 du = {du} dx，把 dx 一起换成 du 后得到右边这个更简单的积分。",
        "constant_multiple": "把常数 {constant} 提到积分号外；它不会消失，最后要乘回结果。",
        "term_by_term": "把和式拆成几项，分别积分后再相加。",
        "rewrite": "先做恒等变形，再用基本积分公式。",
        "integral_power": "幂函数积分：指数加 1，再除以新指数。",
        "integral_power_detail": "幂函数积分：指数 {power} 加 1 得 {next}，再除以 {next}。",
        "integral_exp": "指数函数积分：e 的原函数还是 e 的函数。",
        "integral_trig": "套用三角函数的基本积分公式。",
        "integral_log": "对数函数积分：原函数含 x·ln x − x。",
        "integral_arctan": "形如 1/(a²+x²) 的积分得到反正切。",
        "integral_direct": "套用基本积分公式。",
    },
    "en": {
        "constant": "No x appears in the expression, so the derivative is 0.",
        "sum": "Split the sum, differentiate each term, then add the results.",
        "product_one": "Keep the constant coefficient; differentiate the factor containing x.",
        "product_many": "There are {n} factors containing x; differentiate each one in turn.",
        "power": "The exponent is n = {power}; bring it down and reduce it by one.",
        "power_chain": "Power rule on the outside; keep differentiating the inside.",
        "exp": "Derivative of e^u is e^u times the derivative of the exponent.",
        "log": "Both the base and the exponent contain x, so use logarithmic differentiation.",
        "function_outer": "Differentiate the outer function ({outer}), then multiply by the inner derivative.",
        "outer_fallback": "basic formula",
        "direct": "Apply SymPy's basic differentiation rule.",
        "order_note": "Here are the specific rules used for this order.",
        "evaluate": "Substitute x = {point} into the derivative.",
        "back_substitute": "Multiply back the constant pulled out earlier, then replace u with the original x to get the final antiderivative (add + C for indefinite integrals).",
        "ftc": "F({upper}) − F({lower}).",
        "alternative_try": "Try {name} first",
        "alternative_note": "SymPy found {n} possible routes.",
        "parts": "Let u = {u}, dv = {dv}, so du = {du} dx and v = {v}; after integration by parts, only the smaller remaining integral is left.",
        "substitution": "Let u = {u}, so du = {du} dx; replacing dx with du gives the simpler integral on the right.",
        "constant_multiple": "Pull the constant {constant} outside the integral; it is not lost — multiply it back at the end.",
        "term_by_term": "Split the sum into separate integrals, evaluate each, then add.",
        "rewrite": "Rewrite the integrand first, then apply a basic integral formula.",
        "integral_power": "Power rule for integrals: add 1 to the exponent, then divide by the new exponent.",
        "integral_power_detail": "Power rule: exponent {power} + 1 = {next}, then divide by {next}.",
        "integral_exp": "The antiderivative of an exponential function is the same exponential function (up to a constant factor).",
        "integral_trig": "Apply a basic trigonometric integral formula.",
        "integral_log": "Logarithmic integral: the antiderivative contains x·ln x − x.",
        "integral_arctan": "An integrand of the form 1/(a²+x²) integrates to an arctangent.",
        "integral_direct": "Apply a basic integral formula.",
    },
}


def _lang(lang):
    return lang if lang in ("zh", "en") else "zh"


def label(key, lang="zh", **kwargs):
    text = RULES[_lang(lang)].get(key, key)
    return text.format(**kwargs) if kwargs else text


def note(key, lang="zh", **kwargs):
    text = NOTES[_lang(lang)].get(key, key)
    return text.format(**kwargs) if kwargs else text


def err(key, lang="zh"):
    return ERRORS[_lang(lang)].get(key, key)
