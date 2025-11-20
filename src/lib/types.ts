export type DecisionType = 'Yes/No' | 'Multiple Choice' | 'Financial Analysis' | 'Financial Spending';

export interface BaseDecision {
  id: string;
  type: DecisionType;
  context: string;
  date: string;
}

export interface YesNoDecision extends BaseDecision {
  type: 'Yes/No';
  decision: 'Yes' | 'No';
}

export interface MultipleChoiceDecision extends BaseDecision {
  type: 'Multiple Choice';
  options: string[];
  decision: string;
}

export interface FinancialSpendingDecision extends BaseDecision {
  type: 'Financial Spending';
  options: string[];
  decision: string;
}

export interface FinancialAnalysisDecision extends BaseDecision {
  type: 'Financial Analysis';
  fixedCost: number;
  variableCost: number;
}

export type Decision = YesNoDecision | MultipleChoiceDecision | FinancialSpendingDecision | FinancialAnalysisDecision;
