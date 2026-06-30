#!/usr/bin/env python3
"""Real estate investment IRR calculator.

Computes IRR for a house purchase with/without rental income,
considering EMI loan, maintenance costs, and linear property appreciation.
"""

import math
from typing import List

# ─── Parameters ───────────────────────────────────────────────────────────────

PURCHASE_PRICE = 10_000_000   # ₹1 Cr
DOWN_PAYMENT = 1_000_000      # ₹10 L
LOAN_AMOUNT = 9_000_000       # ₹90 L
INTEREST_RATE = 0.08          # 8% p.a.
LOAN_TENURE_MONTHS = 240      # 20 years
HOLDING_MONTHS = 120          # 10 years (holding period)
SALE_PRICE = 20_000_000       # ₹2 Cr

RENTAL_YIELD = 0.03           # 3% p.a. of current market value
RENTAL_START_MONTH = 49       # rental starts month 49 (after 4 complete years)
MAINTENANCE_RATE = 0.01       # 1% p.a. of current market value

# ─── Financial Formulas ───────────────────────────────────────────────────────

MONTHLY_RATE = INTEREST_RATE / 12


def calc_emi(principal: float, rate: float, months: int) -> float:
    """Standard EMI: P × r × (1+r)^n / ((1+r)^n - 1)."""
    if rate == 0:
        return principal / months
    factor = (1 + rate) ** months
    return principal * rate * factor / (factor - 1)


def calc_outstanding(principal: float, rate: float, total_months: int,
                     paid_months: int) -> float:
    """Outstanding principal after *paid_months* of *total_months*."""
    if rate == 0:
        return principal * (1 - paid_months / total_months)
    factor_total = (1 + rate) ** total_months
    factor_paid = (1 + rate) ** paid_months
    return principal * (factor_total - factor_paid) / (factor_total - 1)


def prop_value(month: int) -> float:
    """Linear property value: PURCHASE_PRICE → SALE_PRICE over HOLDING_MONTHS."""
    return PURCHASE_PRICE + (SALE_PRICE - PURCHASE_PRICE) * month / HOLDING_MONTHS


# ─── Pre-computed loan constants ──────────────────────────────────────────────

EMI_AMOUNT = calc_emi(LOAN_AMOUNT, MONTHLY_RATE, LOAN_TENURE_MONTHS)
OUTSTANDING_AT_SALE = calc_outstanding(LOAN_AMOUNT, MONTHLY_RATE,
                                       LOAN_TENURE_MONTHS, HOLDING_MONTHS)
NET_SALE_PROCEEDS = SALE_PRICE - OUTSTANDING_AT_SALE

# ─── Cash Flow Builder ────────────────────────────────────────────────────────


def build_cashflows(with_rental: bool) -> List[float]:
    """Monthly cash flows. Index 0 = initial; indices 1..120 = months 1..120."""
    cfs = [0.0] * (HOLDING_MONTHS + 1)
    cfs[0] = -DOWN_PAYMENT

    for m in range(1, HOLDING_MONTHS + 1):
        val = prop_value(m)
        emi_flow = -EMI_AMOUNT
        maint_flow = -val * MAINTENANCE_RATE / 12
        rental_flow = val * RENTAL_YIELD / 12 if (with_rental and m >= RENTAL_START_MONTH) else 0.0
        cfs[m] = emi_flow + maint_flow + rental_flow

        if m == HOLDING_MONTHS:
            cfs[m] += NET_SALE_PROCEEDS

    return cfs


# ─── IRR Solver (Newton-Raphson, no external deps) ────────────────────────────


def compute_irr(cfs: List[float], guess: float = 0.01,
                tol: float = 1e-10, max_iter: int = 1000) -> float:
    """Solve IRR via Newton-Raphson. Returns *monthly* rate."""

    def npv(r: float) -> float:
        total = 0.0
        for t, cf in enumerate(cfs):
            total += cf / (1 + r) ** t
        return total

    def npv_prime(r: float) -> float:
        total = 0.0
        for t, cf in enumerate(cfs):
            if t > 0 and cf != 0:
                total += -t * cf / (1 + r) ** (t + 1)
        return total

    r = guess
    for _ in range(max_iter):
        f = npv(r)
        if abs(f) < tol:
            return r
        fp = npv_prime(r)
        if fp == 0:
            break
        r_new = r - f / fp
        if abs(r_new - r) < tol:
            return r_new
        r = r_new

    raise ValueError("IRR did not converge — cash flows may not yield a real IRR")


# ─── Reporting ────────────────────────────────────────────────────────────────


def annual_cashflow_rows(cfs: List[float], with_rental: bool):
    """Generate (year, emi_out, maint_out, rental_in, net, cum) rows."""
    cum = cfs[0]
    yield (0, 0.0, 0.0, 0.0, cfs[0], cum)

    for year in range(1, 11):
        emi_t = 0.0
        maint_t = 0.0
        rental_t = 0.0

        for m in range((year - 1) * 12 + 1, year * 12 + 1):
            val = prop_value(m)
            emi_t += -EMI_AMOUNT
            maint_t += -val * MAINTENANCE_RATE / 12
            if with_rental and m >= RENTAL_START_MONTH:
                rental_t += val * RENTAL_YIELD / 12

        net = emi_t + maint_t + rental_t

        if year == 10:
            net += NET_SALE_PROCEEDS

        cum += net
        yield (year, emi_t, maint_t, rental_t, net, cum)


def print_annual_table(cfs: List[float], title: str, with_rental: bool):
    """Pretty-print annual cash flow summary."""
    sep = "-" * 106
    print(f"\n  {title}")
    print(f"  {sep}")
    hdr = (f"  {'Year':>5} {'EMI Flow':>13} {'Maint Flow':>13} "
           f"{'Rental Flow':>13} {'Net CF':>13} {'Cumulative':>13}")
    print(hdr)
    print(f"  {'':>5} {'(outflow)':>13} {'(outflow)':>13} {'(inflow)':>13} "
          f"{'':>13} {'':>13}")
    print(f"  {sep}")

    for year, emi, maint, rental, net, cum in annual_cashflow_rows(cfs, with_rental):
        if year == 0:
            print(f"  {year:>5} {'':>13} {'':>13} {'':>13} "
                  f"{net:>13,.0f} {cum:>13,.0f}")
        else:
            print(f"  {year:>5} {emi:>13,.0f} {maint:>13,.0f} "
                  f"{rental:>13,.0f} {net:>13,.0f} {cum:>13,.0f}")
    print(f"  {sep}")


def fmt_irr(v: float) -> str:
    return f"{v * 100:.4f}%" if not math.isnan(v) else "N/A"


# ─── Main ─────────────────────────────────────────────────────────────────────


def main():
    w = 106

    print(f"\n{'=' * w}")
    print(f"  REAL ESTATE INVESTMENT IRR CALCULATOR")
    print(f"{'=' * w}")
    print(f"  {'Purchase Price:':<25} ₹{PURCHASE_PRICE:>12,.0f}")
    print(f"  {'Down Payment:':<25} ₹{DOWN_PAYMENT:>12,.0f}")
    print(f"  {'Loan:':<25} ₹{LOAN_AMOUNT:>12,.0f}  @ {INTEREST_RATE * 100:.0f}% "
          f"p.a. / {LOAN_TENURE_MONTHS // 12} yr tenure")
    print(f"  {'EMI:':<25} ₹{EMI_AMOUNT:>12,.0f}/month")
    print(f"  {'Sale Price (yr 10):':<25} ₹{SALE_PRICE:>12,.0f}")
    print(f"  {'Outstanding Loan at Sale:':<25} ₹{OUTSTANDING_AT_SALE:>12,.0f}")
    print(f"  {'Net Sale Proceeds:':<25} ₹{NET_SALE_PROCEEDS:>12,.0f}")
    print(f"  {'Maintenance:':<25} {MAINTENANCE_RATE * 100:.0f}% p.a. of market value")
    print(f"  {'Rental Yield:':<25} {RENTAL_YIELD * 100:.0f}% p.a. of market value "
          f"(from month {RENTAL_START_MONTH})")
    print(f"  {'Appreciation:':<25} Linear ₹{PURCHASE_PRICE // 100000}L → "
          f"₹{SALE_PRICE // 100000}L over {HOLDING_MONTHS // 12} years")

    print(f"\n  Computing...")

    # ── Scenario 1: No rental ──
    cfs_no_rental = build_cashflows(with_rental=False)
    irr_no_r_monthly = float("nan")
    irr_no_r_annual = float("nan")
    try:
        irr_no_r_monthly = compute_irr(cfs_no_rental)
        irr_no_r_annual = (1 + irr_no_r_monthly) ** 12 - 1
    except ValueError as e:
        print(f"  [!] Scenario A: {e}")

    # ── Scenario 2: With rental ──
    cfs_with_rental = build_cashflows(with_rental=True)
    irr_with_r_monthly = float("nan")
    irr_with_r_annual = float("nan")
    try:
        irr_with_r_monthly = compute_irr(cfs_with_rental)
        irr_with_r_annual = (1 + irr_with_r_monthly) ** 12 - 1
    except ValueError as e:
        print(f"  [!] Scenario B: {e}")

    # ── Print tables ──
    print_annual_table(cfs_no_rental,
                       "SCENARIO A: WITHOUT RENTAL INCOME", False)
    print(f"  Monthly IRR: {fmt_irr(irr_no_r_monthly)}")
    print(f"  Annual  IRR: {fmt_irr(irr_no_r_annual)}")

    print_annual_table(cfs_with_rental,
                       "SCENARIO B: WITH RENTAL INCOME (3% p.a., from year 5)",
                       True)
    print(f"  Monthly IRR: {fmt_irr(irr_with_r_monthly)}")
    print(f"  Annual  IRR: {fmt_irr(irr_with_r_annual)}")

    # ── Comparison ──
    print(f"\n{'=' * w}")
    print(f"  IRR COMPARISON")
    print(f"{'=' * w}")
    print(f"  {'Scenario':<50} {'Monthly IRR':>15} {'Annual IRR':>15}")
    print(f"  {'─' * 50} {'─' * 15} {'─' * 15}")
    print(f"  {'Without Rental Income':<50} {fmt_irr(irr_no_r_monthly):>15} "
          f"{fmt_irr(irr_no_r_annual):>15}")
    print(f"  {'With Rental (3% p.a., from year 5)':<50} {fmt_irr(irr_with_r_monthly):>15} "
          f"{fmt_irr(irr_with_r_annual):>15}")
    print(f"{'=' * w}\n")

    # ── Summary of key economic metrics ──
    print(f"\n  KEY ECONOMIC METRICS")
    print(f"  {'─' * w}")
    print(f"  Total EMI paid over 10 years:  "
          f"₹{EMI_AMOUNT * 120:>12,.0f}")
    print(f"  Total principal repaid:         "
          f"₹{LOAN_AMOUNT - OUTSTANDING_AT_SALE:>12,.0f}")
    print(f"  Total interest paid:            "
          f"₹{EMI_AMOUNT * 120 - (LOAN_AMOUNT - OUTSTANDING_AT_SALE):>12,.0f}")
    total_maint = sum(-prop_value(m) * MAINTENANCE_RATE / 12 for m in range(1, 121))
    print(f"  Total maintenance paid:         ₹{total_maint:>12,.0f}")

    if not math.isnan(irr_with_r_monthly):
        total_rental = sum(prop_value(m) * RENTAL_YIELD / 12
                           for m in range(RENTAL_START_MONTH, HOLDING_MONTHS + 1))
        print(f"  Total rental received:         ₹{total_rental:>12,.0f}")

    print()


if __name__ == "__main__":
    main()
