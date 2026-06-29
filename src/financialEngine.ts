import { CalculatorInputs, CalculatorOutputs, AmortizationMonth, YearlySummary } from './types';

/**
 * Formats a number with Indian Style commas and optionally the Rupee symbol.
 */
export function formatINR(amount: number, includeSymbol: boolean = true): string {
  try {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: includeSymbol ? 'currency' : 'decimal',
      currency: 'INR',
      maximumFractionDigits: 0,
    });
    return formatter.format(amount);
  } catch (e) {
    return (includeSymbol ? '₹' : '') + amount.toLocaleString('en-IN');
  }
}

/**
 * Formats a percentage value.
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value) + '%';
}

/**
 * Helper to calculate Net Present Value (NPV) for a given rate and cash flow stream.
 */
export function calculateNPV(rate: number, cashFlows: number[]): number {
  let npv = 0;
  for (let t = 0; t < cashFlows.length; t++) {
    npv += cashFlows[t] / Math.pow(1 + rate, t);
  }
  return npv;
}

/**
 * Robust IRR solver using a combination of bracket expansion and stable binary search.
 * It is guaranteed to be stable and avoid divergence.
 */
export function calculateMonthlyIRR(cashFlows: number[]): number | null {
  const hasPositive = cashFlows.some(cf => cf > 0);
  const hasNegative = cashFlows.some(cf => cf < 0);
  
  if (!hasPositive || !hasNegative) {
    return null;
  }

  // Define initial bounds for monthly rate
  let low = -0.9999;
  let high = 5.0; // 500% monthly return
  
  let npvLow = calculateNPV(low, cashFlows);
  let npvHigh = calculateNPV(high, cashFlows);

  // If both endpoints have the same sign, we need to locate a proper bracketing range
  if (npvLow * npvHigh > 0) {
    let found = false;
    let prevVal = npvLow;
    let prevRate = low;
    
    // Scan across possible rates to find a sign change interval
    for (let rTest = -0.95; rTest <= 10.0; rTest += 0.05) {
      const val = calculateNPV(rTest, cashFlows);
      if (val * prevVal < 0) {
        low = prevRate;
        high = rTest;
        found = true;
        break;
      }
      prevVal = val;
      prevRate = rTest;
    }
    
    if (!found) {
      return null;
    }
  }

  // Binary search for NPV close to zero
  let mid = 0;
  for (let i = 0; i < 80; i++) {
    mid = (low + high) / 2;
    const npvMid = calculateNPV(mid, cashFlows);
    
    if (Math.abs(npvMid) < 1e-10) {
      break;
    }
    
    const valLow = calculateNPV(low, cashFlows);
    if (valLow * npvMid < 0) {
      high = mid;
    } else {
      low = mid;
    }

    if (high - low < 1e-12) {
      break;
    }
  }

  return mid;
}

/**
 * Run the primary real estate leverage model.
 */
export function runFinancialModel(inputs: CalculatorInputs): CalculatorOutputs {
  const {
    purchasePrice,
    downPaymentPct,
    interestRate,
    loanTenure,
    holdingPeriod,
    salePrice,
    enableRental,
    rentalYield,
    rentalStartYear,
  } = inputs;

  const downPaymentAmount = purchasePrice * (downPaymentPct / 100);
  const loanAmount = purchasePrice - downPaymentAmount;

  const r = (interestRate / 100) / 12;
  const n = loanTenure * 12;
  const h = holdingPeriod * 12;

  // Monthly EMI Calculation
  let monthlyEmi = 0;
  if (loanAmount > 0) {
    if (r > 0) {
      monthlyEmi = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    } else {
      monthlyEmi = loanAmount / n;
    }
  }

  const amortizationSchedule: AmortizationMonth[] = [];
  let currentBalance = loanAmount;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;
  let totalEmisPaid = 0;
  let totalRentalEarned = 0;

  for (let m = 1; m <= h; m++) {
    let interestPaid = 0;
    let principalPaid = 0;
    let emiPaid = 0;

    if (m <= n && currentBalance > 0) {
      interestPaid = currentBalance * r;
      emiPaid = monthlyEmi;
      principalPaid = emiPaid - interestPaid;

      if (principalPaid > currentBalance) {
        principalPaid = currentBalance;
        emiPaid = interestPaid + principalPaid;
      }

      currentBalance -= principalPaid;
      if (currentBalance < 0.01) {
        currentBalance = 0;
      }
    } else {
      interestPaid = 0;
      principalPaid = 0;
      emiPaid = 0;
    }

    // Accumulate rental income
    let rentEarned = 0;
    if (enableRental && m > (rentalStartYear - 1) * 12) {
      rentEarned = (purchasePrice * (rentalYield / 100)) / 12;
    }

    totalInterestPaid += interestPaid;
    totalPrincipalPaid += principalPaid;
    totalEmisPaid += emiPaid;
    totalRentalEarned += rentEarned;

    amortizationSchedule.push({
      month: m,
      interestPaid,
      principalPaid,
      emiPaid,
      outstandingBalance: currentBalance,
      rentEarned,
      cashFlow: -emiPaid + rentEarned,
    });
  }

  const outstandingPrincipalToClose = currentBalance; // Balance at holdingPeriod end

  // Build the Cash Flows Array for IRR
  // Month 0: - (Down Payment)
  // Month 1 to h-1: - (Monthly EMI) + (Monthly Rent, if active)
  // Month h: - (Monthly EMI) + (Monthly Rent, if active) + Sale Price - Outstanding Principal
  const cashFlows: number[] = [];
  cashFlows.push(-downPaymentAmount);

  for (let m = 1; m <= h; m++) {
    const amort = amortizationSchedule[m - 1];
    let cf = amort.cashFlow; // -emiPaid + rentEarned
    if (m === h) {
      cf += salePrice - outstandingPrincipalToClose;
    }
    cashFlows.push(cf);
  }

  const monthlyIrr = calculateMonthlyIRR(cashFlows);
  const annualizedIrr = monthlyIrr !== null ? Math.pow(1 + monthlyIrr, 12) - 1 : null;

  // Core metrics
  const totalCapitalInvested = downPaymentAmount + totalEmisPaid;
  const netCashFromSale = salePrice - outstandingPrincipalToClose;
  const netProfit = netCashFromSale + totalRentalEarned - totalCapitalInvested;

  // Equity Multiple = (Total cash inflows) / (Total cash outflows)
  // Outflows: Down Payment + EMIs
  // Inflows: Rent + Net Cash from Sale
  const totalInflows = totalRentalEarned + netCashFromSale;
  const equityMultiple = totalCapitalInvested > 0 ? totalInflows / totalCapitalInvested : 0;

  // Generate Year-by-Year Summaries
  const yearlySummary: YearlySummary[] = [];
  for (let y = 1; y <= holdingPeriod; y++) {
    const startMonth = (y - 1) * 12;
    const endMonth = y * 12;
    let yrEmi = 0;
    let yrInterest = 0;
    let yrPrincipal = 0;
    let yrRent = 0;
    let yrEndBalance = 0;

    for (let m = startMonth; m < endMonth && m < h; m++) {
      const sch = amortizationSchedule[m];
      yrEmi += sch.emiPaid;
      yrInterest += sch.interestPaid;
      yrPrincipal += sch.principalPaid;
      yrRent += sch.rentEarned;
      yrEndBalance = sch.outstandingBalance;
    }

    yearlySummary.push({
      year: y,
      emiPaid: yrEmi,
      interestPaid: yrInterest,
      principalPaid: yrPrincipal,
      rentEarned: yrRent,
      endingBalance: yrEndBalance,
    });
  }

  return {
    purchasePrice,
    downPaymentAmount,
    loanAmount,
    monthlyEmi,
    totalEmisPaid,
    totalPrincipalPaid,
    totalInterestPaid,
    totalCapitalInvested,
    totalRentalEarned,
    salePrice,
    outstandingPrincipalToClose,
    netCashFromSale,
    netProfit,
    annualizedIrr,
    equityMultiple,
    amortizationSchedule,
    yearlySummary,
  };
}
