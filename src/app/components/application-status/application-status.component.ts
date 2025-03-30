// application-status.component.ts
import { Component, OnInit } from '@angular/core';
import { LoanApplicationService } from '../../services/loan-application.service';
import { AuthService } from '../../services/auth.service';
import { LoanApplication } from '../../models/loan-application.model';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-application-status',
  templateUrl: './application-status.component.html',
  styleUrls: ['./application-status.component.scss']
})
export class ApplicationStatusComponent implements OnInit {
  applications: LoanApplication[] = [];
  loading: boolean = true;
  error: string = '';
  applicationId: string = '';
  applicationResult: any = null;

  // Default values will be overridden by API response
  preApproved: boolean = false;
  loanDetails = {
    type: 'Loan',
    eligibilityScore: 0,
    maxAmount: 0,
    interestRate: 0,
    term: 0,
    monthlyPayment: 0
  };

  decisionFactors: any[] = [];

  constructor(
    private loanService: LoanApplicationService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Add animation delay for loading
    setTimeout(() => {
      // Get application ID from route parameters
      this.route.params.subscribe(params => {
        this.applicationId = params['id'];
        if (this.applicationId) {
          this.loadApplicationResult(this.applicationId);
        } else {
          // Fallback to loading all applications if no ID provided
          this.loadApplications();
        }
      });
    }, 500); // Small delay for better user experience
  }

  loadApplicationResult(id: string): void {
    this.loading = true;
    this.loanService.getApplicationResultsById(id).subscribe(
      result => {
        this.applicationResult = result;

        // Update preApproved status based on response
        this.preApproved = result.status === 'APPROVED';

        // Update loan details from the response
        this.loanDetails = {
          type: 'Loan', // This could be set from application data if needed
          eligibilityScore: result.eligibilityDetails.eligibilityScore,
          maxAmount: result.eligibilityDetails.approvedTerms.maximumEligibleAmount,
          interestRate: parseFloat(result.eligibilityDetails.approvedTerms.suggestedInterestRate),
          term: result.eligibilityDetails.approvedTerms.suggestedTerm,
          monthlyPayment: result.eligibilityDetails.approvedTerms.estimatedMonthlyPayment
        };

        // Map decision factors to the format used in the template
        this.decisionFactors = result.decisionFactors.map((factor: any) => ({
          name: factor.factor,
          status: factor.impact.toUpperCase(),
          description: factor.description
        }));

        this.loading = false;
      },
      error => {
        console.error('Error loading application result', error);
        this.error = 'Failed to load application status. Please try again.';
        this.loading = false;
      }
    );
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
    switch (status) {
      case 'APPROVED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'UNDER_REVIEW': return 'status-review';
      case 'SUBMITTED': return 'status-submitted';
      default: return 'status-draft';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'APPROVED': return 'Approved';
      case 'REJECTED': return 'Rejected';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'SUBMITTED': return 'Submitted';
      case 'DRAFT': return 'Draft';
      default: return status;
    }
  }

  getProductTypeDisplay(type: string): string {
    switch (type) {
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

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}