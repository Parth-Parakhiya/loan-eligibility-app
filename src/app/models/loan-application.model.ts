export interface LoanApplication {
  id?: string;
  customerId: string;
  productType: 'CAR_LOAN' | 'PERSONAL_LOAN' | 'MORTGAGE' | 'STUDENT_LOAN' | 'CREDIT_CARD' | 'LINE_OF_CREDIT';
  requestedAmount: number;
  purposeDescription: string;
  requestedTermMonths?: number;
  applicationDate: Date;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  supportingDocuments?: Document[];
  currentCreditLimit?: number;
  creditTotalUsage?: number;
}

export interface Document {
  id: string;
  type: 'ID_PROOF' | 'ADDRESS_PROOF' | 'INCOME_PROOF' | 'BANK_STATEMENT' | 'OTHER';
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}