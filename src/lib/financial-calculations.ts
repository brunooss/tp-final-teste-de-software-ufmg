export type FinancingDetails = {
    totalValue: number;
    downPayment: number;
    interestRate: number;
    installments: number;
};

export type ConsortiumDetails = {
    totalValue: number;
    adminFee: number;
    installments: number;
};

export type FinancialTotals = {
    financingTotal: number;
    consortiumTotal: number;
}

export type Criterion = {
  name: string;
  weight: number;
};

export type Option = {
  name: string;
  scores: Record<string, number>;
};

export function calculateFinancingMonthlyPayment({ totalValue, downPayment, interestRate, installments }: FinancingDetails): number {
    if (interestRate === 0) {
        return (totalValue - downPayment) / installments;
    }
    const principal = totalValue - downPayment;
    const monthlyRate = interestRate / 100;
    if (principal <= 0) return 0;
    if (installments === 0) return principal;

    // Formula de pagamento mensal (Tabela Price)
    // M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, installments)) / (Math.pow(1 + monthlyRate, installments) - 1);
    return isNaN(monthlyPayment) ? 0 : monthlyPayment;
}

export function calculateFinancingTotal({ totalValue, downPayment, interestRate, installments }: FinancingDetails): number {
    if (downPayment >= totalValue) {
        return totalValue;
    }
    const monthlyPayment = calculateFinancingMonthlyPayment({ totalValue, downPayment, interestRate, installments });
    const totalPaid = downPayment + (monthlyPayment * installments);
    return isNaN(totalPaid) ? 0 : totalPaid;
}

export function calculateConsortiumTotal({ totalValue, adminFee }: ConsortiumDetails): number {
    const total = totalValue * (1 + adminFee / 100);
    return isNaN(total) ? 0 : total;
}

export function calculateConsortiumMonthlyPayment({ totalValue, adminFee, installments }: ConsortiumDetails): number {
    if (installments === 0) return 0;
    const totalCost = calculateConsortiumTotal({ totalValue, adminFee, installments });
    const monthlyPayment = totalCost / installments;
    return isNaN(monthlyPayment) ? 0 : monthlyPayment;
}


export function calculateWeightedScores({ criteria, options }: { criteria: Criterion[], options: Option[] }) {
    if (!criteria || !options) return [];

    return options.map(opt => {
        if(!opt.name) return { name: '', score: 0 };

        const totalScore = criteria.reduce((acc, crit) => {
          if (!crit.name || crit.weight === 0) return acc;
          const score = opt.scores[crit.name] || 0;
          const weight = crit.weight / 100;
          return acc + (score * weight);
        }, 0);
        
        return { name: opt.name, score: totalScore };
    })
    .filter(s => s.name)
    .sort((a, b) => b.score - a.score);
}
