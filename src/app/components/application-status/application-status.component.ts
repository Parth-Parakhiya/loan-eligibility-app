// application-status.component.ts
import { Component, OnInit } from '@angular/core';
import { LoanApplicationService } from '../../services/loan-application.service';
import { AuthService } from '../../services/auth.service';
import { LoanApplication } from '../../models/loan-application.model';

@Component({
  selector: 'app-application-status',
  templateUrl: './application-status.component.html',
  styleUrls: ['./application-status.component.scss']
})
export class ApplicationStatusComponent implements OnInit {
  applications: LoanApplication[] = [];
  loading: boolean = true;
  error: string = '';
  
  // Static data for demo purposes
  preApproved: boolean = true;
  loanDetails = {
    type: 'Car Loan',
    eligibilityScore: 85,
    maxAmount: 25000,
    interestRate: 4.25,
    term: 60,
    monthlyPayment: 462.75
  };
  
  decisionFactors = [
    { name: 'Excellent Credit Score', status: 'POSITIVE', description: 'Your credit score is above average, which positively impacts your eligibility.' },
    { name: 'Existing Debt Ratio', status: 'NEGATIVE', description: 'Your existing debt-to-income ratio is slightly higher than optimal.' },
    { name: 'Stable Employment', status: 'POSITIVE', description: 'You have been with your current employer for over 3 years.' },
    { name: 'Good Payment History', status: 'POSITIVE', description: 'Your payment history shows consistent on-time payments.' }
  ];
  
  constructor(
    private loanService: LoanApplicationService,
    private authService: AuthService
  ) { }
  
  ngOnInit(): void {
    // Keep original method for loading real data
    // this.loadApplications();
    
    // For demo, we're using static data
    this.loading = false;
  }
  
  loadApplications(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !currentUser.customerId) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }
    
    this.loanService.getCustomerApplications(currentUser.customerId).subscribe(
      applications => {
        this.applications = applications;
        this.loading = false;
      },
      error => {
        console.error('Error loading applications', error);
        this.error = 'Failed to load applications. Please try again.';
        this.loading = false;
      }
    );
  }
  
  getStatusClass(status: string): string {
    switch(status) {
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'UNDER_REVIEW': return 'status-review';
      case 'SUBMITTED': return 'status-submitted';
      default: return 'status-draft';
    }
  }
  
  getStatusText(status: string): string {
    switch(status) {
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'SUBMITTED': return 'Submitted';
      case 'DRAFT': return 'Draft';
      default: return status;
    }
  }
  
  getProductTypeDisplay(type: string): string {
    switch(type) {
      case 'CAR_LOAN': return 'Car Loan';
      case 'PERSONAL_LOAN': return 'Personal Loan';
      case 'CREDIT_CARD': return 'Premium Credit Card';
      case 'LINE_OF_CREDIT': return 'Line of Credit';
      default: return type;
    }
  }
  
  getDecisionFactorClass(status: string): string {
    return status === 'POSITIVE' ? 'positive-factor' : 'negative-factor';
  }
}