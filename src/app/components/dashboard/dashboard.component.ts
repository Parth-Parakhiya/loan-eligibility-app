import { Component, OnInit } from '@angular/core';
import { LoanApplicationService } from '../../services/loan-application.service';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { LoanApplication } from '../../models/loan-application.model';
import { Customer } from '../../models/customer.model';
import { FinancialProfile } from '../../models/financial-profile.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  applications: LoanApplication[] = [];
  customer: Customer | null = null;
  financialProfile: FinancialProfile | null = null;
  loading = true;
  error = '';

  constructor(
    private loanService: LoanApplicationService,
    private customerService: CustomerService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    this.customerService.getCustomerById(currentUser.customerId).subscribe(
      customer => {
        this.customer = customer;
        
        // Load financial profile
        this.customerService.getFinancialProfile(customer.id!).subscribe(
          profile => {
            this.financialProfile = profile;
          },
          error => {
            console.error('Error loading financial profile', error);
          }
        );
        
        // Load applications
        this.loanService.getCustomerApplications(customer.id!).subscribe(
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
      },
      error => {
        console.error('Error loading customer data', error);
        this.error = 'Failed to load customer data. Please try again.';
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
}