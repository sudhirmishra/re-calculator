import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  HelpCircle, 
  Percent, 
  IndianRupee, 
  TrendingUp, 
  ArrowRightLeft, 
  Download, 
  Info,
  Calendar,
  Sparkles,
  ChevronRight,
  TrendingDown,
  ExternalLink,
  BookOpen,
  PieChart,
  BarChart4,
  Briefcase,
  Calculator
} from 'lucide-react';
import { runFinancialModel, formatINR, formatPercent } from './financialEngine';
import { CalculatorInputs, CalculatorOutputs } from './types';

// Preset configurations
const PRESETS = [
  {
    name: "Standard Indian Home Loan (90% LTV)",
    inputs: {
      purchasePrice: 10000000,
      downPaymentPct: 10,
      interestRate: 8.0,
      loanTenure: 20,
      holdingPeriod: 10,
      salePrice: 20000000,
      enableRental: true,
      rentalYield: 3.0,
      rentalStartYear: 4
    }
  },
  {
    name: "High Leverage Tier-1 City Buyout",
    inputs: {
      purchasePrice: 25000000,
      downPaymentPct: 15,
      interestRate: 8.25,
      loanTenure: 25,
      holdingPeriod: 8,
      salePrice: 42000000,
      enableRental: true,
      rentalYield: 2.8,
      rentalStartYear: 1
    }
  },
  {
    name: "Commercial Property (High Yield)",
    inputs: {
      purchasePrice: 50000000,
      downPaymentPct: 30,
      interestRate: 9.0,
      loanTenure: 15,
      holdingPeriod: 10,
      salePrice: 75000000,
      enableRental: true,
      rentalYield: 6.5,
      rentalStartYear: 1
    }
  },
  {
    name: "Cash Buyer (Zero Loan)",
    inputs: {
      purchasePrice: 12000000,
      downPaymentPct: 100,
      interestRate: 0,
      loanTenure: 20,
      holdingPeriod: 10,
      salePrice: 24000000,
      enableRental: true,
      rentalYield: 3.5,
      rentalStartYear: 1
    }
  }
];

export default function App() {
  // Input states - initialized to standard default values
  const [purchasePriceInput, setPurchasePriceInput] = useState<string>("1,00,00,000");
  const [downPaymentPct, setDownPaymentPct] = useState<number>(10);
  const [interestRate, setInterestRate] = useState<number>(8.0);
  const [loanTenure, setLoanTenure] = useState<number>(20);
  const [holdingPeriod, setHoldingPeriod] = useState<number>(10);
  const [salePriceInput, setSalePriceInput] = useState<string>("2,00,00,000");
  const [enableRental, setEnableRental] = useState<boolean>(true);
  const [rentalYield, setRentalYield] = useState<number>(3.0);
  const [rentalStartYear, setRentalStartYear] = useState<number>(4);

  // Active Tab for Right Side
  const [activeTab, setActiveTab] = useState<'summary' | 'charts' | 'schedule'>('summary');
  
  // Interactive chart state for showing tooltip details
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Help Modal/Tooltip state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Parse strings to clean numbers
  const purchasePrice = useMemo(() => {
    const clean = purchasePriceInput.replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
  }, [purchasePriceInput]);

  const salePrice = useMemo(() => {
    const clean = salePriceInput.replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
  }, [salePriceInput]);

  // Sync back holding period if user decreases loan tenure to be shorter than holding period
  // Usually, they are independent, but to prevent negative balance queries, we capped holdingPeriod limit or handled it
  useEffect(() => {
    if (rentalStartYear > holdingPeriod) {
      setRentalStartYear(holdingPeriod);
    }
  }, [holdingPeriod, rentalStartYear]);

  // Compute values
  const currentInputs: CalculatorInputs = useMemo(() => {
    return {
      purchasePrice,
      downPaymentPct,
      interestRate,
      loanTenure,
      holdingPeriod,
      salePrice,
      enableRental,
      rentalYield,
      rentalStartYear
    };
  }, [
    purchasePrice,
    downPaymentPct,
    interestRate,
    loanTenure,
    holdingPeriod,
    salePrice,
    enableRental,
    rentalYield,
    rentalStartYear
  ]);

  const outputs: CalculatorOutputs = useMemo(() => {
    return runFinancialModel(currentInputs);
  }, [currentInputs]);

  // Apply a Preset config
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setPurchasePriceInput(new Intl.NumberFormat('en-IN').format(preset.inputs.purchasePrice));
    setDownPaymentPct(preset.inputs.downPaymentPct);
    setInterestRate(preset.inputs.interestRate);
    setLoanTenure(preset.inputs.loanTenure);
    setHoldingPeriod(preset.inputs.holdingPeriod);
    setSalePriceInput(new Intl.NumberFormat('en-IN').format(preset.inputs.salePrice));
    setEnableRental(preset.inputs.enableRental);
    setRentalYield(preset.inputs.rentalYield);
    setRentalStartYear(preset.inputs.rentalStartYear);
  };

  // Convert number to Indian words
  const formatIndianWords = (num: number): string => {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Crore`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    } else if (num >= 1000) {
      return `₹${(num / 1000).toFixed(2)} Thousand`;
    }
    return `₹${num}`;
  };

  // Safe manual keyup parsers to auto-add commas
  const handlePurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal === '') {
      setPurchasePriceInput('');
      return;
    }
    const num = parseInt(rawVal, 10);
    setPurchasePriceInput(new Intl.NumberFormat('en-IN').format(num));
  };

  const handleSalePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal === '') {
      setSalePriceInput('');
      return;
    }
    const num = parseInt(rawVal, 10);
    setSalePriceInput(new Intl.NumberFormat('en-IN').format(num));
  };

  // Download schedule as CSV helper
  const handleDownloadCSV = () => {
    const headers = ['Month', 'EMI Paid (INR)', 'Interest Paid (INR)', 'Principal Paid (INR)', 'Outstanding Loan Balance (INR)', 'Rental Income (INR)', 'Monthly Cash Flow (INR)'];
    const rows = outputs.amortizationSchedule.map(s => [
      s.month,
      Math.round(s.emiPaid),
      Math.round(s.interestPaid),
      Math.round(s.principalPaid),
      Math.round(s.outstandingBalance),
      Math.round(s.rentEarned),
      Math.round(s.cashFlow)
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `IRR_Calculator_Schedule_${holdingPeriod}Yrs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for tooltips/glossary
  const tooltips: Record<string, { title: string; desc: string }> = {
    irr: {
      title: "Annualized Internal Rate of Return (IRR)",
      desc: "The true annualized compound rate of return earned on your cash investments over the holding period. It accounts for the exact timing and magnitude of all cash outflows (down payment, monthly EMIs) and cash inflows (monthly rent, net cash proceeds from selling the property and paying off the loan)."
    },
    equityMultiple: {
      title: "Equity Multiple (EM)",
      desc: "Calculated as Total Cash Inflows (Total Rent Earned + Net Sale proceeds after loan clearance) divided by Total Cash Outflows (Down Payment + all EMIs paid). A multiple of 2.0x means you got back double the cash you put into the project."
    },
    emi: {
      title: "Equated Monthly Installment (EMI)",
      desc: "The fixed monthly payment made to the lender over the loan tenure. It comprises both principal repayment and interest. In early years, the EMI is mostly interest; in later years, it becomes mostly principal."
    },
    leverage: {
      title: "The Power of Financial Leverage",
      desc: "By putting down only a portion of the purchase price (e.g., 10%) and borrowing the rest, you leverage the bank's money. If the property appreciates significantly, your return on your actual cash invested (IRR) is amplified compared to a cash buyer. However, high leverage also magnifies risk if the sale price falls."
    },
    rentalYield: {
      title: "Rental Yield",
      desc: "The annual gross rental income expressed as a percentage of the original property purchase price. For example, a 3% yield on a ₹1 Crore property means ₹3,00,000 in rental income per year (₹25,000 per month)."
    },
    outstandingBalance: {
      title: "Outstanding Loan Balance",
      desc: "The remaining principal amount of the loan that must be paid to the bank to fully close/clear the loan at the end of your holding period before you pocket the net cash proceeds of the sale."
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Premium Elegant Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase">Leveraged Asset Model</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-3xs font-medium text-indigo-700 border border-indigo-200">
                  <Sparkles className="h-2 w-2" /> Tier-1 Analytics
                </span>
              </div>
              <h1 id="app-title" className="text-xl md:text-2xl font-bold tracking-tight text-slate-850">
                EquityMax Real Estate IRR & Amortization Calculator
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setActiveTooltip('leverage')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <BookOpen className="h-3.5 w-3.5 text-slate-400" />
              Leverage Guide
            </button>
            <a 
              href="#calculation-methodology"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Info className="h-3.5 w-3.5" />
              Math & Formula
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input Panel (cols 1-5) */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            
            {/* Presets Row */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> Quick Investment Scenarios
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 text-left rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-indigo-300 transition-all text-xs cursor-pointer group"
                  >
                    <div className="font-bold text-slate-700 group-hover:text-indigo-700 line-clamp-1">
                      {preset.name.split(' (')[0]}
                    </div>
                    <div className="text-slate-400 text-3xs mt-0.5 font-medium">
                      ₹{(preset.inputs.purchasePrice / 10000000).toFixed(1)}Cr · {preset.inputs.downPaymentPct}% Down
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calculator className="h-4 w-4 text-indigo-600" /> Model Parameters
            </h2>

            {/* Parameter Group 1: Property Acquisition */}
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Capital Inflow
                </h3>
              </div>
                
                {/* Purchase Price Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      Property Purchase Price (₹)
                    </label>
                    <span className="text-xs font-bold text-indigo-600 font-mono">
                      {formatIndianWords(purchasePrice)}
                    </span>
                  </div>
                  <div className="relative rounded shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      value={purchasePriceInput}
                      onChange={handlePurchasePriceChange}
                      placeholder="1,00,00,000"
                      className="block w-full pl-8 pr-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="100000000"
                    step="500000"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePriceInput(new Intl.NumberFormat('en-IN').format(parseInt(e.target.value, 10)))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Target Sale Price Input */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Target Property Sale Price (₹)
                    </label>
                    <span className="text-xs font-bold text-indigo-600 font-mono">
                      {formatIndianWords(salePrice)}
                    </span>
                  </div>
                  <div className="relative rounded shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-slate-400 text-sm">₹</span>
                    </div>
                    <input
                      type="text"
                      value={salePriceInput}
                      onChange={handleSalePriceChange}
                      placeholder="2,00,00,000"
                      className="block w-full pl-8 pr-3 py-2 text-sm font-semibold bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="200000000"
                    step="500000"
                    value={salePrice}
                    onChange={(e) => setSalePriceInput(new Intl.NumberFormat('en-IN').format(parseInt(e.target.value, 10)))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between items-center text-3xs text-slate-400">
                    <span>
                      Multiplier: {(purchasePrice > 0 ? salePrice / purchasePrice : 0).toFixed(2)}x
                    </span>
                    <span>
                      Appreciation: {purchasePrice > 0 ? (((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              {/* Parameter Group 2: Debt Financing */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    2. Debt Financing
                  </h3>
                </div>

                {/* Down Payment % Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Down Payment Percentage (%)
                    </label>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {downPaymentPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between items-center text-3xs text-slate-500 font-medium">
                    <span>Down Payment Amt: <strong className="text-slate-800">{formatINR(outputs.downPaymentAmount)}</strong></span>
                    <span>Loan Amt (LTV): <strong className="text-slate-800">{formatINR(outputs.loanAmount)} ({100 - downPaymentPct}%)</strong></span>
                  </div>
                </div>

                {/* Interest Rate */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Loan Interest Rate (Annual %)
                    </label>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {interestRate.toFixed(1)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Loan Tenure */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Loan Tenure (Years)
                    </label>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {loanTenure} Years
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  {outputs.monthlyEmi > 0 && (
                    <div className="bg-indigo-50/50 p-2 rounded border border-indigo-100 text-3xs text-indigo-900 flex justify-between items-center">
                      <span className="font-semibold">Monthly EMI Payment:</span>
                      <strong className="font-extrabold font-mono">{formatINR(outputs.monthlyEmi)}/mo</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Parameter Group 3: Holding & Rentals */}
              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-2 pt-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    3. Holding & Rental Income
                  </h3>
                </div>

                {/* Holding Period */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Holding Period (Years)
                    </label>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {holdingPeriod} Years
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={holdingPeriod}
                    onChange={(e) => setHoldingPeriod(parseInt(e.target.value, 10))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  {holdingPeriod > loanTenure && (
                    <div className="text-3xs text-amber-600 bg-amber-50 px-2.5 py-2 rounded border border-amber-100">
                      Note: Holding Period is longer than the loan tenure. The loan will be fully repaid in Year {loanTenure}.
                    </div>
                  )}
                </div>

                {/* Rental Income Toggle */}
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Enable Rental Income?
                  </span>
                  <button
                    type="button"
                    onClick={() => setEnableRental(!enableRental)}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${enableRental ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enableRental ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>

                {enableRental && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    {/* Rental Yield */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-semibold text-slate-500">
                          Rental Yield (% of Purchase Price/yr)
                        </label>
                        <span className="text-xs font-bold text-slate-950 font-mono">
                          {rentalYield.toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="10"
                        step="0.1"
                        value={rentalYield}
                        onChange={(e) => setRentalYield(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-3xs text-slate-400 font-medium">
                        <span>Annual: {formatINR(purchasePrice * (rentalYield / 100))}</span>
                        <span>Monthly: {formatINR((purchasePrice * (rentalYield / 100)) / 12)}/mo</span>
                      </div>
                    </div>

                    {/* Rental Start Year */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-semibold text-slate-500">
                          Rental Start Year
                        </label>
                        <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                          Year {rentalStartYear}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max={holdingPeriod}
                        step="1"
                        value={rentalStartYear}
                        onChange={(e) => setRentalStartYear(parseInt(e.target.value, 10))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <p className="text-3xs text-slate-400">
                        Rental income begins in Month {((rentalStartYear - 1) * 12) + 1}. No rent accumulated before this.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

        {/* Right Column: Calculations & Dashboard (cols 6-12) */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* Executive KPI Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            
            {/* IRR Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-xl p-3 min-[380px]:p-4 shadow-sm border border-indigo-950 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div className="min-w-0">
                <span className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase flex items-center gap-1 flex-wrap">
                  Annualized IRR <HelpCircle className="h-3.5 w-3.5 text-indigo-400 hover:text-indigo-200 cursor-pointer shrink-0" onClick={() => setActiveTooltip('irr')} />
                </span>
                <div 
                  className="text-xl min-[380px]:text-2xl sm:text-lg min-[720px]:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight mt-1 text-emerald-400 font-mono truncate"
                  title={outputs.annualizedIrr !== null ? formatPercent(outputs.annualizedIrr * 100) : 'N/A'}
                >
                  {outputs.annualizedIrr !== null ? formatPercent(outputs.annualizedIrr * 100) : 'N/A'}
                </div>
              </div>
              <p className="text-3xs text-indigo-200/70 mt-2 border-t border-indigo-800/60 pt-1.5 truncate">
                True compound return
              </p>
            </div>

            {/* Net Profit Card */}
            <div className="bg-white rounded-xl p-3 min-[380px]:p-4 shadow-sm border border-slate-200 flex flex-col justify-between min-h-[110px]">
              <div className="min-w-0">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block truncate">
                  Net Profit Pocketed
                </span>
                <div 
                  className={`text-base min-[380px]:text-lg sm:text-sm min-[720px]:text-base md:text-lg lg:text-xl xl:text-2xl font-extrabold tracking-tight mt-1 font-mono truncate ${outputs.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                  title={formatINR(outputs.netProfit)}
                >
                  {formatINR(outputs.netProfit)}
                </div>
              </div>
              <p className="text-3xs text-slate-400 mt-2 border-t border-slate-150 pt-1.5 truncate">
                Absolute cash gain
              </p>
            </div>

            {/* Equity Multiple Card */}
            <div className="bg-white rounded-xl p-3 min-[380px]:p-4 shadow-sm border border-slate-200 flex flex-col justify-between min-h-[110px]">
              <div className="min-w-0">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1 flex-wrap">
                  Equity Multiple <HelpCircle className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0" onClick={() => setActiveTooltip('equityMultiple')} />
                </span>
                <div 
                  className="text-base min-[380px]:text-lg sm:text-sm min-[720px]:text-base md:text-lg lg:text-xl xl:text-2xl font-extrabold tracking-tight mt-1 text-slate-800 font-mono truncate"
                  title={`${outputs.equityMultiple.toFixed(2)}x`}
                >
                  {outputs.equityMultiple.toFixed(2)}x
                </div>
              </div>
              <p className="text-3xs text-slate-400 mt-2 border-t border-slate-150 pt-1.5 truncate">
                Return multiplier
              </p>
            </div>

            {/* Total Capital Invested Card */}
            <div className="bg-white rounded-xl p-3 min-[380px]:p-4 shadow-sm border border-slate-200 flex flex-col justify-between min-h-[110px]">
              <div className="min-w-0">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block truncate">
                  Capital Invested
                </span>
                <div 
                  className="text-base min-[380px]:text-lg sm:text-sm min-[720px]:text-base md:text-lg lg:text-xl xl:text-2xl font-extrabold tracking-tight mt-1 text-slate-800 font-mono truncate"
                  title={formatINR(outputs.totalCapitalInvested)}
                >
                  {formatINR(outputs.totalCapitalInvested)}
                </div>
              </div>
              <p className="text-3xs text-slate-400 mt-2 border-t border-slate-150 pt-1.5 truncate">
                Down Payment + EMIs
              </p>
            </div>

          </div>

          {/* Interactive Navigation Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            
            {/* Tab Headers */}
            <div className="flex border-b border-slate-150 bg-slate-50/50 p-2 gap-1">
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'summary' ? 'bg-white text-indigo-700 shadow-xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <PieChart className="h-4 w-4" />
                Investment Summary
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'charts' ? 'bg-white text-indigo-700 shadow-xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <BarChart4 className="h-4 w-4" />
                Growth Charts
              </button>
              <button
                onClick={() => setActiveTab('schedule')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'schedule' ? 'bg-white text-indigo-700 shadow-xs border border-slate-150' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Calendar className="h-4 w-4" />
                Yearly Breakdown
              </button>
            </div>

            {/* Tab 1: Summary Table (The required schema) */}
            {activeTab === 'summary' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Required Output Financial Statement
                  </h3>
                  <span className="text-3xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded border border-indigo-150">
                    Live Updated
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-100">
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      
                      <tr className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">Property Purchase Price</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right font-mono">
                          {formatINR(outputs.purchasePrice)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">Down Payment Amount</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right font-mono">
                          {formatINR(outputs.downPaymentAmount)} <span className="text-4xs text-slate-400">({downPaymentPct}%)</span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">Loan Amount</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right font-mono">
                          {formatINR(outputs.loanAmount)} <span className="text-4xs text-slate-400">({100 - downPaymentPct}% LTV)</span>
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/40 bg-indigo-50/20">
                        <td className="px-4 py-3 text-xs font-semibold text-indigo-900">Monthly EMI</td>
                        <td className="px-4 py-3 text-xs font-extrabold text-indigo-700 text-right font-mono">
                          {formatINR(outputs.monthlyEmi)}
                        </td>
                      </tr>

                      {/* EMI Details Block */}
                      <tr className="bg-slate-50/30">
                        <td className="px-4 py-2.5 text-xs font-semibold text-slate-800 pl-4">
                          Total EMIs Paid (Over Holding Period)
                        </td>
                        <td className="px-4 py-2.5 text-xs font-bold text-slate-900 text-right font-mono">
                          {formatINR(outputs.totalEmisPaid)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/10">
                        <td className="px-4 py-1.5 text-3xs text-slate-500 pl-8 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span> Out of which is Principal Paid
                        </td>
                        <td className="px-4 py-1.5 text-3xs font-medium text-slate-600 text-right font-mono">
                          {formatINR(outputs.totalPrincipalPaid)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/10">
                        <td className="px-4 py-1.5 text-3xs text-slate-500 pl-8 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span> Out of which is Interest Paid
                        </td>
                        <td className="px-4 py-1.5 text-3xs font-medium text-slate-600 text-right font-mono">
                          {formatINR(outputs.totalInterestPaid)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/40 font-semibold">
                        <td className="px-4 py-3 text-xs text-slate-800">Total Capital Invested (Down Payment + EMIs Paid)</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right font-mono">
                          {formatINR(outputs.totalCapitalInvested)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">Total Rental Income Earned</td>
                        <td className="px-4 py-3 text-xs font-bold text-emerald-600 text-right font-mono">
                          {formatINR(outputs.totalRentalEarned)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">Property Sale Price</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right font-mono">
                          {formatINR(outputs.salePrice)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/40">
                        <td className="px-4 py-3 text-xs font-medium text-slate-500 flex items-center gap-1">
                          Outstanding Loan Principal Paid to Close Loan
                          <HelpCircle className="h-3 w-3 text-slate-400 cursor-pointer" onClick={() => setActiveTooltip('outstandingBalance')} />
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right font-mono text-amber-700">
                          {formatINR(outputs.outstandingPrincipalToClose)}
                        </td>
                      </tr>

                      <tr className="hover:bg-slate-50/40 font-semibold bg-indigo-50/10">
                        <td className="px-4 py-3 text-xs text-slate-800">Net Cash Received from Sale (Sale Price - Loan Clearance)</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right font-mono">
                          {formatINR(outputs.netCashFromSale)}
                        </td>
                      </tr>

                      <tr className="font-bold bg-emerald-50/40 text-slate-900">
                        <td className="px-4 py-3 text-xs text-slate-800">Final Net Profit Pocketed (Net Cash Received + Total Rent - Total Capital Invested)</td>
                        <td className={`px-4 py-3 text-xs font-extrabold text-right font-mono ${outputs.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatINR(outputs.netProfit)}
                        </td>
                      </tr>

                      <tr className="bg-indigo-900 text-white font-bold">
                        <td className="px-4 py-3.5 text-xs tracking-wider uppercase text-indigo-200">Final Annualized IRR (%)</td>
                        <td className="px-4 py-3.5 text-sm font-extrabold text-emerald-400 text-right font-mono">
                          {outputs.annualizedIrr !== null ? formatPercent(outputs.annualizedIrr * 100) : 'N/A'}
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>

                {/* Info Note on Leverage */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-150 rounded-lg flex items-start gap-2 text-3xs text-blue-800">
                  <Info className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <strong>Leverage Highlight:</strong> By investing only {formatINR(outputs.downPaymentAmount)} as a down payment instead of paying the full ₹{new Intl.NumberFormat('en-IN').format(outputs.purchasePrice)}, your final annualized return is calculated on your actual periodic cash outflows.
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Visual Area Charts (Growth chart showing Equity vs Loan Principal) */}
            {activeTab === 'charts' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1">
                    Outstanding Loan vs. Equity Growth Over Time
                  </h3>
                  <p className="text-3xs text-slate-500">
                    Hover over any year node to view the breakdown of Home Equity (value minus loan outstanding) and Cumulative Rent.
                  </p>
                </div>

                {/* SVG Visual Area Chart */}
                <div className="relative bg-slate-50 border border-slate-250 rounded-xl p-4 overflow-hidden">
                  
                  {/* Chart Title or Overlay */}
                  <div className="flex items-center justify-between text-3xs mb-4 font-semibold">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded bg-emerald-500"></span> Property Value
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded bg-amber-500"></span> Remaining Debt
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded bg-indigo-600"></span> Built-in Equity
                      </span>
                    </div>
                  </div>

                  {/* Responsive SVG Chart Container */}
                  <div className="w-full h-[250px] relative">
                    <svg viewBox="0 0 600 240" className="w-full h-full overflow-visible">
                      {/* Grid Lines */}
                      <line x1="50" y1="20" x2="550" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="50" y1="70" x2="550" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="50" y1="120" x2="550" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="50" y1="170" x2="550" y2="170" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="50" y1="210" x2="550" y2="210" stroke="#e2e8f0" strokeWidth="1.5" />

                      {/* Calculations for Chart Coords */}
                      {(() => {
                        const maxVal = Math.max(salePrice, purchasePrice) * 1.15 || 10000000;
                        const years = outputs.yearlySummary.length;
                        
                        // Coords mapping helper
                        const getX = (yearIdx: number) => 50 + (yearIdx / (years || 1)) * 500;
                        const getY = (amount: number) => 210 - (amount / maxVal) * 190;

                        // Create area paths
                        // 1. Property Value Area (linear growth between start and sale price)
                        const propPoints = [{ yr: 0, val: purchasePrice }];
                        outputs.yearlySummary.forEach((y, i) => {
                          const interpVal = purchasePrice + ((salePrice - purchasePrice) / years) * (i + 1);
                          propPoints.push({ yr: i + 1, val: interpVal });
                        });

                        const propPath = propPoints.map((p, i) => `${getX(p.yr)},${getY(p.val)}`).join(' L ');
                        const propAreaPath = `M ${getX(0)},210 L ${propPath} L ${getX(years)},210 Z`;

                        // 2. Loan Balance Area
                        const loanPoints = [{ yr: 0, val: outputs.loanAmount }];
                        outputs.yearlySummary.forEach((y, i) => {
                          loanPoints.push({ yr: i + 1, val: y.endingBalance });
                        });
                        const loanPath = loanPoints.map((p, i) => `${getX(p.yr)},${getY(p.val)}`).join(' L ');
                        const loanAreaPath = `M ${getX(0)},210 L ${loanPath} L ${getX(years)},210 Z`;

                        return (
                          <>
                            {/* Property Value Fill */}
                            <path d={propAreaPath} fill="url(#propValGrad)" opacity="0.1" />
                            <path d={propPath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3 3" />

                            {/* Home Equity Fill (Dynamic polygon between property value and loan balance) */}
                            {/* Outstanding Debt Fill */}
                            <path d={loanAreaPath} fill="url(#debtGrad)" opacity="0.15" />
                            <path d={loanPath} fill="none" stroke="#f59e0b" strokeWidth="2" />

                            {/* Highlighted Interactive Nodes */}
                            {propPoints.map((p, i) => {
                              const x = getX(p.yr);
                              const yProp = getY(p.val);
                              const yLoan = getY(loanPoints[i].val);
                              const isHovered = hoveredYear === p.yr;

                              return (
                                <g key={i} className="cursor-pointer">
                                  {/* Vertical Year Line */}
                                  <line 
                                    x1={x} 
                                    y1="20" 
                                    x2={x} 
                                    y2="210" 
                                    stroke={isHovered ? "#4f46e5" : "#f1f5f9"} 
                                    strokeWidth={isHovered ? "1.5" : "1"} 
                                    opacity={isHovered ? "0.8" : "0.3"}
                                  />

                                  {/* Property value dot */}
                                  <circle 
                                    cx={x} 
                                    cy={yProp} 
                                    r={isHovered ? "6" : "4"} 
                                    fill="#10b981" 
                                    stroke="white" 
                                    strokeWidth="1.5" 
                                    onMouseEnter={() => setHoveredYear(p.yr)}
                                    onMouseLeave={() => setHoveredYear(null)}
                                  />

                                  {/* Loan balance dot */}
                                  <circle 
                                    cx={x} 
                                    cy={yLoan} 
                                    r={isHovered ? "6" : "4"} 
                                    fill="#f59e0b" 
                                    stroke="white" 
                                    strokeWidth="1.5"
                                    onMouseEnter={() => setHoveredYear(p.yr)}
                                    onMouseLeave={() => setHoveredYear(null)}
                                  />

                                  {/* Year Label */}
                                  <text 
                                    x={x} 
                                    y="230" 
                                    fontSize="9" 
                                    fontWeight={isHovered ? "bold" : "normal"} 
                                    fill={isHovered ? "#4f46e5" : "#64748b"} 
                                    textAnchor="middle"
                                  >
                                    Yr {p.yr}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Gradients */}
                            <defs>
                              <linearGradient id="propValGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                              </linearGradient>
                              <linearGradient id="debtGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* Display details of hovered Node */}
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs transition-all">
                  {hoveredYear !== null ? (
                    (() => {
                      const yr = hoveredYear;
                      const years = outputs.yearlySummary.length;
                      const interpPropVal = yr === 0 ? purchasePrice : purchasePrice + ((salePrice - purchasePrice) / years) * yr;
                      const loanBal = yr === 0 ? outputs.loanAmount : outputs.yearlySummary[yr - 1].endingBalance;
                      const equity = interpPropVal - loanBal;
                      
                      // Calculate accumulated rent up to this year
                      let accRent = 0;
                      if (yr > 0) {
                        for (let k = 0; k < yr; k++) {
                          accRent += outputs.yearlySummary[k].rentEarned;
                        }
                      }

                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="border-r border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Selected Year</span>
                            <div className="text-base font-bold text-slate-800">Year {yr}</div>
                          </div>
                          <div className="border-r border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Prop Value
                            </span>
                            <div className="text-base font-extrabold text-slate-900">{formatINR(interpPropVal)}</div>
                          </div>
                          <div className="border-r border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Remaining Debt
                            </span>
                            <div className="text-base font-extrabold text-slate-900">{formatINR(loanBal)}</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center justify-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span> Built-in Equity
                            </span>
                            <div className="text-base font-extrabold text-indigo-600">{formatINR(equity)}</div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center text-xs text-slate-400 py-2">
                      💡 Protip: Move your mouse cursor over the chart node points to view exact equity and debt levels dynamically.
                    </div>
                  )}
                </div>

                {/* Additional Amortization Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-slate-200 p-4 rounded-xl text-center bg-slate-50/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Equity Built (Loan Paid Down)</span>
                    <strong className="text-base font-bold text-slate-800 mt-1 block">
                      {formatINR(outputs.loanAmount - outputs.outstandingPrincipalToClose)}
                    </strong>
                    <span className="text-4xs text-slate-400">Total debt principal retired</span>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-xl text-center bg-slate-50/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Rent Earned</span>
                    <strong className="text-base font-bold text-emerald-600 mt-1 block">
                      {formatINR(outputs.totalRentalEarned)}
                    </strong>
                    <span className="text-4xs text-slate-400">Additional passive cash inflow</span>
                  </div>
                  <div className="border border-slate-200 p-4 rounded-xl text-center bg-slate-50/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Leverage ROI Boost</span>
                    <strong className="text-base font-bold text-indigo-600 mt-1 block">
                      {outputs.annualizedIrr !== null ? ((outputs.annualizedIrr * 100) - (salePrice/purchasePrice - 1) * 10).toFixed(1) + '%' : 'N/A'}
                    </strong>
                    <span className="text-4xs text-slate-400">Outperformance vs. Unleverage</span>
                  </div>
                </div>

              </div>
            )}

            {/* Tab 3: Detailed Year-by-Year breakdown */}
            {activeTab === 'schedule' && (
              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                      Year-by-Year Financial Statement Summary
                    </h3>
                    <p className="text-3xs text-slate-500">
                      Consolidated annual interest payments, principal retirements, and rent streams.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleDownloadCSV}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download CSV (120-Mo)
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-150">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-3xs font-bold text-slate-400 uppercase tracking-wider">Year</th>
                        <th className="px-4 py-2.5 text-right text-3xs font-bold text-slate-400 uppercase tracking-wider">EMIs Paid</th>
                        <th className="px-4 py-2.5 text-right text-3xs font-bold text-slate-400 uppercase tracking-wider">Interest Component</th>
                        <th className="px-4 py-2.5 text-right text-3xs font-bold text-slate-400 uppercase tracking-wider">Principal Paid</th>
                        <th className="px-4 py-2.5 text-right text-3xs font-bold text-slate-400 uppercase tracking-wider">Rent Collected</th>
                        <th className="px-4 py-2.5 text-right text-3xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Debt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-xs font-medium text-slate-700 font-mono">
                      {outputs.yearlySummary.map((yr, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 font-bold text-slate-900 font-sans">Year {yr.year}</td>
                          <td className="px-4 py-2.5 text-right text-slate-800">{formatINR(yr.emiPaid)}</td>
                          <td className="px-4 py-2.5 text-right text-amber-700">{formatINR(yr.interestPaid)}</td>
                          <td className="px-4 py-2.5 text-right text-indigo-700">{formatINR(yr.principalPaid)}</td>
                          <td className="px-4 py-2.5 text-right text-emerald-600">{formatINR(yr.rentEarned)}</td>
                          <td className="px-4 py-2.5 text-right text-slate-900">{formatINR(yr.endingBalance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

          {/* Educational Real Estate Investment Math Guide */}
          <div id="calculation-methodology" className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" /> Investment Mathematics Explained
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1">
                  1. Amortization Engine Logic (Monthly loop)
                </h4>
                <p>
                  A real estate mortgage is paid back in Equated Monthly Installments (EMI).
                  Each month, interest is calculated on the outstanding balance:
                  <span className="block my-1.5 p-2 bg-slate-50 border border-slate-100 rounded font-mono text-3xs text-slate-700 font-semibold">
                    Monthly Interest = Outstanding Balance × r
                  </span>
                  The principal payment is the remaining portion:
                  <span className="block my-1.5 p-2 bg-slate-50 border border-slate-100 rounded font-mono text-3xs text-slate-700 font-semibold">
                    Principal Paid = Monthly EMI - Monthly Interest
                  </span>
                  This decreases the loan outstanding balance for the subsequent month.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1">
                  2. True Annualized IRR Math
                </h4>
                <p>
                  Internal Rate of Return (IRR) is the precise discount rate that sets the Net Present Value (NPV) of your cash flows to exactly zero. 
                  Our model solves:
                  <span className="block my-1.5 p-2 bg-slate-50 border border-slate-100 rounded font-mono text-3xs text-slate-700 font-semibold">
                    0 = -DownPayment + ∑ [ MonthlyCashFlow_t / (1+r)^t ]
                  </span>
                  Where Month 0 is negative (outflow), and Year 10 (Month 120) incorporates the net exit proceeds (Sale Price - Outstanding Principal to Close Loan).
                </p>
              </div>
            </div>
          </div>

        </section>

      </main>

      {/* Global Tooltip/Glossary Modal (Drawer/Overlay) */}
      {activeTooltip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="text-base font-extrabold text-slate-900">
                  {tooltips[activeTooltip]?.title || "Concept Guide"}
                </h4>
                <button
                  onClick={() => setActiveTooltip(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors text-xs font-semibold"
                >
                  ✕ Close
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {tooltips[activeTooltip]?.desc}
              </p>
              <div className="bg-slate-50 p-3 rounded-xl text-[11px] text-slate-500 border border-slate-100">
                💡 **Insight:** Leveraged yields are highly dynamic. High loan interest rates can act as "negative leverage," making it more profitable to buy properties in full cash.
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTooltip(null)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-100 mt-12 bg-white py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>© {new Date().getFullYear()} Leveraged Real Estate Model Engine. All calculations run with high-precision double arithmetic.</p>
          <p className="text-3xs text-slate-400">Disclaimer: Financial investment calculations are for educational scenarios. Consult a professional advisor for tax and mortgage agreements.</p>
        </div>
      </footer>
    </div>
  );
}
