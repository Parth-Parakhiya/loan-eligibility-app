export interface EligibilityResult {
    applicationId: string;
    customerId: string;
    isEligible: boolean;
    score: number;
    maximumEligibleAmount?: number;
    suggestedInterestRate?: number;
    suggestedTermMonths?: number;
    monthlyPaymentEstimate?: number;
    decisionFactors: DecisionFactor[];
    alternativeProducts?: ProductRecommendation[];
    requiredDocuments?: string[];
  }
  
  export interface DecisionFactor {
    factor: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    description: string;
    weight: number;
  }
  
  export interface ProductRecommendation {
    productType: string;
    productName: string;
    eligibilityScore: number;
    description: string;
    maximumAmount?: number;
    interestRateRange?: string;
  }