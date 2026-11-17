"""中文优先的文案字典：关键概念保留英文原名。"""

RULES = {
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
    "empty": "表达式不能为空 (empty expression)",
    "bad_expr": "看不懂这个表达式，检查一下括号和函数名 (cannot parse expression)",
    "extra_symbol": "只支持变量 x，出现了额外符号 (only x is supported)",
    "bad_order": "求导阶数必须是 1 到 8 的整数 (order must be 1–8)",
    "bad_limit": "上下限必须是常数，不能含 x (bounds must be constants)",
    "bad_op": "未知计算类型 (unknown operation)",
    "no_integral": "SymPy 暂时算不出这个积分 (SymPy could not evaluate this integral)",
}


def label(key, **kwargs):
    text = RULES.get(key, key)
    return text.format(**kwargs) if kwargs else text
