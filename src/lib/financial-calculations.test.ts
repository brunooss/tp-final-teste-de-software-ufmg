import { describe, it, expect } from 'vitest';
import {
  calculateFinancingMonthlyPayment,
  calculateFinancingTotal,
  calculateConsortiumTotal,
  calculateConsortiumMonthlyPayment,
  calculateWeightedScores,
} from './financial-calculations';

describe('Financial Calculations', () => {

  describe('Financing Calculations', () => {
    const financingDetails = {
      totalValue: 50000,
      downPayment: 10000,
      interestRate: 1.5, // % per month
      installments: 48,
    };

    it('calculates the monthly payment correctly', () => {
      const monthlyPayment = calculateFinancingMonthlyPayment(financingDetails);
      // Value calculated with an external financial calculator for verification
      expect(monthlyPayment).toBeCloseTo(1178.10, 2); 
    });

    it('calculates the total cost correctly', () => {
      const totalCost = calculateFinancingTotal(financingDetails);
      // 10000 (downpayment) + (1178.10 * 48) = 66548.8
      expect(totalCost).toBeCloseTo(66548.80, 2);
    });

    it('handles zero interest rate for financing', () => {
        const details = { ...financingDetails, interestRate: 0 };
        const monthlyPayment = calculateFinancingMonthlyPayment(details);
        expect(monthlyPayment).toBeCloseTo((50000-10000)/48, 2);
        const totalCost = calculateFinancingTotal(details);
        expect(totalCost).toBe(50000);
    });

    it('handles zero installments to avoid division by zero', () => {
        const details = { ...financingDetails, installments: 0 };
        const monthlyPayment = calculateFinancingMonthlyPayment(details);
        expect(monthlyPayment).toBe(40000); // principal
        const totalCost = calculateFinancingTotal(details);
        expect(totalCost).toBe(10000); // just the downpayment
    });
  });

  describe('Consortium Calculations', () => {
    const consortiumDetails = {
      totalValue: 50000,
      adminFee: 15, // %
      installments: 60,
    };

    it('calculates the total cost correctly', () => {
      const totalCost = calculateConsortiumTotal(consortiumDetails);
      // 50000 * (1 + 15/100) = 57500
      expect(totalCost).toBe(57500);
    });

    it('calculates the monthly payment correctly', () => {
      const monthlyPayment = calculateConsortiumMonthlyPayment(consortiumDetails);
      // 57500 / 60
      expect(monthlyPayment).toBeCloseTo(958.33, 2);
    });

     it('handles zero installments to avoid division by zero', () => {
        const details = { ...consortiumDetails, installments: 0 };
        const monthlyPayment = calculateConsortiumMonthlyPayment(details);
        expect(monthlyPayment).toBe(0);
    });
  });

  describe('Weighted Score Calculation', () => {
    const criteria = [
      { name: 'Custo', weight: 50 },
      { name: 'Qualidade', weight: 30 },
      { name: 'Prazo', weight: 20 },
    ];
    const options = [
      { name: 'Opção A', scores: { 'Custo': 10, 'Qualidade': 6, 'Prazo': 8 } },
      { name: 'Opção B', scores: { 'Custo': 7, 'Qualidade': 9, 'Prazo': 9 } },
      { name: 'Opção C', scores: { 'Custo': 9, 'Qualidade': 8, 'Prazo': 6 } },
    ];

    it('calculates weighted scores correctly and sorts results', () => {
      const scores = calculateWeightedScores({ criteria, options });

      // Expected Scores:
      // A: (10 * 0.5) + (6 * 0.3) + (8 * 0.2) = 5 + 1.8 + 1.6 = 8.4
      // B: (7 * 0.5) + (9 * 0.3) + (9 * 0.2) = 3.5 + 2.7 + 1.8 = 8.0
      // C: (9 * 0.5) + (8 * 0.3) + (6 * 0.2) = 4.5 + 2.4 + 1.2 = 8.1

      expect(scores.length).toBe(3);
      
      // Check sorting
      expect(scores[0].name).toBe('Opção A');
      expect(scores[1].name).toBe('Opção C');
      expect(scores[2].name).toBe('Opção B');

      // Check scores
      expect(scores.find(s => s.name === 'Opção A')?.score).toBeCloseTo(8.4, 2);
      expect(scores.find(s => s.name === 'Opção B')?.score).toBeCloseTo(8.0, 2);
      expect(scores.find(s => s.name === 'Opção C')?.score).toBeCloseTo(8.1, 2);
    });

    it('handles missing scores gracefully (treats as 0)', () => {
        const incompleteOptions = [
            { name: 'Opção D', scores: { 'Custo': 10, 'Qualidade': 5 } }, // Missing 'Prazo'
        ];
        const scores = calculateWeightedScores({ criteria, options: incompleteOptions });
        
        // Expected: (10 * 0.5) + (5 * 0.3) + (0 * 0.2) = 5 + 1.5 + 0 = 6.5
        expect(scores[0].score).toBeCloseTo(6.5, 2);
    });

    it('returns an empty array if criteria or options are missing', () => {
        // @ts-expect-error for testing
        expect(calculateWeightedScores({ criteria: [], options: null })).toEqual([]);
        // @ts-expect-error for testing
        expect(calculateWeightedScores({ criteria: null, options: [] })).toEqual([]);
    });

     it('filters out options without a name', () => {
        const optionsWithEmpty = [
          ...options,
          { name: '', scores: { 'Custo': 1, 'Qualidade': 1, 'Prazo': 1 } }
        ];
        const scores = calculateWeightedScores({ criteria, options: optionsWithEmpty });
        expect(scores.length).toBe(3);
    });
  });

});
