import pydantic
import fastapi
import sympy
from typing import cast
from mathjson import Expression

router = fastapi.APIRouter(prefix="/expr")


class OneExpression(pydantic.BaseModel):
    expr: Expression


class TwoExpressions(pydantic.BaseModel):
    expr1: Expression
    expr2: Expression


def args(expr: sympy.Expr) -> list[sympy.Expr]:
    return cast(list[sympy.Expr], expr.args)


def flatten(expr: sympy.Expr, op=sympy.Mul) -> sympy.Expr:
    if expr.func != op:
        return expr
    terms: list[sympy.Expr] = []
    for term in args(expr):
        if term.func == op:
            terms += args(flatten(term, op))
        else:
            terms.append(term)
    return op(*terms, evaluate=False)


@router.post("/commonRoots")
def common_roots(input: TwoExpressions) -> list[str]:
    expr = sympy.solveset(input.expr1.expr).intersect(sympy.solveset(input.expr2.expr))
    return [sympy.latex(e) for e in expr]


@router.post("/equal")
def equal(input: TwoExpressions) -> bool:
    expr = input.expr1.expr - input.expr2.expr
    if expr.is_complex:
        expr = sympy.expand_complex(expr)
    return sympy.simplify(expr) == 0


@router.post("/isFactored")
def is_factored(input: OneExpression) -> bool:
    expr = input.expr.expr
    if expr.func != sympy.Mul:
        expr = sympy.Mul(1, expr, evaluate=False)
    expr = flatten(expr)
    for term in args(expr):
        if sympy.factor(term).func == sympy.Mul:
            if not (args(sympy.factor(term))[0] ** (-1)).is_integer:
                return False
        if term.func != sympy.Pow and sympy.factor(term).func == sympy.Pow:
            return False
    return True


@router.post("/match")
def match(input: TwoExpressions) -> bool:
    expr, pattern = sympy.expand(input.expr1.expr), input.expr2.expr
    subs = {
        s: sympy.Wild(s.name, properties=[lambda e: e.is_polynomial()])
        for s in pattern.free_symbols
    }
    pattern = sympy.expand(pattern.subs(subs))
    return expr.match(pattern) is not None


@router.post("/latex")
def latex(input: OneExpression) -> str:
    return sympy.latex(input.expr.expr)


@router.post("/roots")
def roots(input: OneExpression) -> list[str]:
    expr = sympy.solveset(input.expr.expr)
    return [sympy.latex(e) for e in expr]
