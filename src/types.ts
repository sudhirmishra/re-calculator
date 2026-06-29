export interface CalculatorInputs {
  purchasePrice: number;
  downPaymentPct: number;
  interestRate: number;
  loanTenure: number;
  holdingPeriod: number;
  salePrice: number;
  enableRental: boolean;
  rentalYield: number;
  rentalStartYear: number;
}

export interface AmortizationMonth {
  month: number;
  interestPaid: number;
  principalPaid: number;
  emiPaid: number;
  outstandingBalance: number;
  rentEarned: number;
  cashFlow: number;
}

export interface YearlySummary {
  year: number;
  emiPaid: number;
  interestPaid: number;
  principalPaid: number;
  rentEarned: number;
  endingBalance: number;
}

export interface CalculatorOutputs {
  purchasePrice: number;
  downPaymentAmount: number;
  loanAmount: number;
  monthlyEmi: number;
  totalEmisPaid: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalCapitalInvested: number;
  totalRentalEarned: number;
  salePrice: number;
  outstandingPrincipalToClose: number;
  netCashFromSale: number;
  netProfit: number;
  annualizedIrr: number | null;
  equityMultiple: number;
  amortizationSchedule: AmortizationMonth[];
  yearlySummary: YearlySummary[];
}
