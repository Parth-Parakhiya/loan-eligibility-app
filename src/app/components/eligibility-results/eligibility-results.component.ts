import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoanApplicationService } from '../../services/loan-application.service';
import { EligibilityResult } from '../../models/eligibility-result.model';
import { LoanApplication } from '../../models/loan-application.model';

@Component({
  selector: 'app-eligibility-results',
  templateUrl: './eligibility-results.component.html',
  styleUrls: ['./eligibility-results.component.scss']
})
export class EligibilityResultsComponent implements OnInit {
  applicationId: string = '';
  application: LoanApplication | null = null;
  eligibilityResult: EligibilityResult | null = null;
  loading: boolean = true;
  error: string = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanApplicationService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.applicationId = params['applicationId'];
      this.loadApplicationData();
    });
  }

  loadApplicationData(): void {
    if (!this.applicationId) {
      this.error = 'Application ID is missing';
      this.loading = false;
      return;
    }

    this.loanService.getApplicationById(this.applicationId).subscribe(
      application => {
        this.application = application;
        this.checkEligibility();
      },
      error => {
        console.error('Error loading application', error);
        this.error = 'Failed to load application data';
        this.loading = false;
      }
    );
  }

  checkEligibility(): void {
    this.loanService.checkEligibility(this.applicationId).subscribe(
      result => {
        this.eligibilityResult = result;
        this.loading = false;
      },
      error => {
        console.error('Error checking eligibility', error);
        this.error = 'Failed to determine eligibility. Please try again later.';
        this.loading = false;
      }
    );
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

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
  }

  getImpactClass(impact: string): string {
    switch(impact) {
      case 'POSITIVE': return 'impact-positive';
      case 'NEGATIVE': return 'impact-negative';
      default: return 'impact-neutral';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  navigateToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  applyForAlternative(productType: string): void {
    this.router.navigate(['/apply'], { 
      queryParams: { 
        productType: productType 
      } 
    });
  }

  /**
 * Calculate the percentage position of the credit score marker
 * @param score The current credit score
 * @returns Percentage position (0-100)
 */
getScoreMarkerPosition(score: number = 720): number {
  // Credit score range constants
  const MIN_SCORE = 300;
  const MAX_SCORE = 850;
  const RANGE = MAX_SCORE - MIN_SCORE;
  
  // Calculate position as percentage
  const position = ((score - MIN_SCORE) / RANGE) * 100;
  
  // Ensure position is within bounds
  return Math.max(0, Math.min(100, position));
}

/**
 * Get credit score range classification
 * @param score The current credit score
 * @returns Score classification (Poor, Fair, Good, etc.)
 */
getScoreRange(score: number = 720): string {
  if (score >= 800) return 'Excellent';
  if (score >= 740) return 'Very Good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}
}