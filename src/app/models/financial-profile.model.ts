export interface FinancialProfile {
    customerId: string;
    creditScore?: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    existingDebts: Debt[];
    assets: Asset[];
    bankAccounts: BankAccount[];
    creditCards: CreditCard[];
  }
  
  export interface Debt {
    type: 'MORTGAGE' | 'AUTO_LOAN' | 'PERSONAL_LOAN' | 'STUDENT_LOAN' | 'OTHER';
    lender: string;
    outstandingAmount: number;
    monthlyPayment: number;
    interestRate: number;
    remainingTermMonths: number;
  }
  
  export interface Asset {
    type: 'REAL_ESTATE' | 'VEHICLE' | 'INVESTMENTS' | 'OTHER';
    description: string;
    estimatedValue: number;
  }
  
  export interface BankAccount {
    accountType: 'CHECKING' | 'SAVINGS' | 'MONEY_MARKET' | 'CD';
    balance: number;
    accountAgeMonths: number;
  }
  
  export interface CreditCard {
    issuer: string;
    limit: number;
    currentBalance: number;
    minimumPayment: number;
    interestRate: number;
  }