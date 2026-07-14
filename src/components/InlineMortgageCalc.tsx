import { useState, useMemo } from 'react'
import { Banknote, X } from 'lucide-react'

interface InlineMortgageCalcProps {
  onClose: () => void
}

export default function InlineMortgageCalc({ onClose }: InlineMortgageCalcProps) {
  const [propertyValue, setPropertyValue] = useState(2000000)
  const [downPaymentPercent, setDownPaymentPercent] = useState(25)
  const [interestRate, setInterestRate] = useState(6.5)
  const [loanTerm, setLoanTerm] = useState(25)

  const downPayment = propertyValue * (downPaymentPercent / 100)
  const loanAmount = propertyValue - downPayment

  const monthlyPayment = useMemo(() => {
    const r = interestRate / 100 / 12
    const n = loanTerm * 12
    if (r === 0) return loanAmount / n
    return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  }, [loanAmount, interestRate, loanTerm])

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 px-5 sm:px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-navy-950 flex items-center gap-2">
          <Banknote className="w-4 h-4 text-navy-800" />
          Mortgage Calculator
        </h3>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Property Value */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Property Value</label>
          <input
            type="range"
            min="500000"
            max="20000000"
            step="100000"
            value={propertyValue}
            onChange={(e) => setPropertyValue(Number(e.target.value))}
            className="w-full accent-navy-800 mb-1"
          />
          <div className="text-sm font-semibold text-navy-950">AED {(propertyValue / 1000000).toFixed(2)}M</div>
        </div>

        {/* Down Payment */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Down Payment ({downPaymentPercent}%)</label>
          <input
            type="range"
            min="20"
            max="50"
            step="5"
            value={downPaymentPercent}
            onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
            className="w-full accent-navy-800 mb-1"
          />
          <div className="text-sm font-semibold text-navy-950">AED {(downPayment / 1000000).toFixed(2)}M</div>
        </div>

        {/* Interest Rate */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Interest Rate (p.a.)</label>
          <input
            type="range"
            min="1"
            max="15"
            step="0.25"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full accent-navy-800 mb-1"
          />
          <div className="text-sm font-semibold text-navy-950">{interestRate}%</div>
        </div>

        {/* Loan Term */}
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Loan Term</label>
          <input
            type="range"
            min="5"
            max="25"
            step="1"
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
            className="w-full accent-navy-800 mb-1"
          />
          <div className="text-sm font-semibold text-navy-950">{loanTerm} Years</div>
        </div>
      </div>

      {/* Result */}
      <div className="bg-navy-950 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-400 mb-1">Monthly Payment</div>
          <div className="text-2xl font-serif text-gold">AED {Math.round(monthlyPayment).toLocaleString()}</div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-400">Loan: </span>
            <span className="text-white font-medium">AED {(loanAmount / 1000000).toFixed(2)}M</span>
          </div>
          <div>
            <span className="text-gray-400">Total: </span>
            <span className="text-gold font-medium">AED {(monthlyPayment * loanTerm * 12 / 1000000).toFixed(2)}M</span>
          </div>
        </div>
      </div>
    </div>
  )
}
