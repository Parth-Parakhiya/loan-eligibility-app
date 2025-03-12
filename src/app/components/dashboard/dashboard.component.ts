import { Component, OnInit, AfterViewInit } from '@angular/core';
import { LoanApplicationService } from '../../services/loan-application.service';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { LoanApplication } from '../../models/loan-application.model';
import { Customer } from '../../models/customer.model';
import { FinancialProfile } from '../../models/financial-profile.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  applications: LoanApplication[] = [];
  customer: Customer | null = null;
  financialProfile: FinancialProfile | null = null;
  loading = true;
  error = '';
  financialChart: any;
  applicationChart: any;

  constructor(
    private loanService: LoanApplicationService,
    private customerService: CustomerService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
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
            this.initFinancialChart();
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
            this.initApplicationChart();
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

  initFinancialChart(): void {
    if (!this.financialProfile) return;
    
    const ctx = document.getElementById('financialChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const monthlyIncome = this.financialProfile.monthlyIncome;
    const monthlyExpenses = this.financialProfile.monthlyExpenses;
    const savings = monthlyIncome - monthlyExpenses;
    
    this.financialChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Income', 'Expenses', 'Savings'],
        datasets: [{
          label: 'Monthly Overview',
          data: [monthlyIncome, monthlyExpenses, savings],
          backgroundColor: [
            'rgba(46, 125, 50, 0.7)',  // Green for income
            'rgba(211, 47, 47, 0.7)',  // Red for expenses
            'rgba(33, 150, 243, 0.7)'  // Blue for savings
          ],
          borderColor: [
            'rgba(46, 125, 50, 1)',
            'rgba(211, 47, 47, 1)',
            'rgba(33, 150, 243, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(76, 175, 80, 0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
  }

  initApplicationChart(): void {
    if (this.applications.length === 0) return;
    
    const ctx = document.getElementById('applicationChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    // Count applications by status
    const statusCounts = {
      'APPROVED': 0,
      'REJECTED': 0,
      'UNDER_REVIEW': 0,
      'SUBMITTED': 0,
      'DRAFT': 0
    };
    
    this.applications.forEach(app => {
      if (statusCounts.hasOwnProperty(app.status)) {
        statusCounts[app.status]++;
      }
    });
    
    const statuses = Object.keys(statusCounts);
    const counts = statuses.map(status => statusCounts[status]);
    
    this.applicationChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: statuses.map(status => this.formatStatus(status)),
        datasets: [{
          data: counts,
          backgroundColor: [
            'rgba(46, 125, 50, 0.7)',    // Green for Approved
            'rgba(211, 47, 47, 0.7)',    // Red for Rejected
            'rgba(255, 152, 0, 0.7)',    // Orange for Under Review
            'rgba(33, 150, 243, 0.7)',   // Blue for Submitted
            'rgba(158, 158, 158, 0.7)'   // Grey for Draft
          ],
          borderColor: [
            'rgba(46, 125, 50, 1)',
            'rgba(211, 47, 47, 1)',
            'rgba(255, 152, 0, 1)',
            'rgba(33, 150, 243, 1)',
            'rgba(158, 158, 158, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  formatStatus(status: string): string {
    return status.replace('_', ' ').toLowerCase()
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  getStatusIcon(status: string): string {
    const statusIcons = {
      'APPROVED': 'bi bi-check-circle-fill text-success',
      'REJECTED': 'bi bi-x-circle-fill text-danger',
      'UNDER_REVIEW': 'bi bi-clock-fill text-warning',
      'SUBMITTED': 'bi bi-file-earmark-text text-info',
      'DRAFT': 'bi bi-pencil-square text-secondary'
    };
    return statusIcons[status] || 'bi bi-question-circle';
  }

  getStatusBadgeClass(status: string): string {
    const statusBadges = {
      'APPROVED': 'badge bg-success',
      'REJECTED': 'badge bg-danger',
      'UNDER_REVIEW': 'badge bg-warning',
      'SUBMITTED': 'badge bg-info',
      'DRAFT': 'badge bg-secondary'
    };
    return statusBadges[status] || 'badge bg-light text-dark';
  }

  getCreditScorePercentage(): number {
    if (!this.financialProfile || !this.financialProfile.creditScore) return 0;
    
    // Assuming credit scores range from 300 to 850
    const minScore = 300;
    const maxScore = 850;
    const score = this.financialProfile.creditScore;
    
    // Convert to percentage (0-100%)
    return ((score - minScore) / (maxScore - minScore)) * 100;
  }
}