import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ProductDetailsDialogComponent } from './product-details-dialog.component';


interface Product {
  type: string;
  name: string;
  description: string;
  interestRate: number;
  maximumAmount: number;
  features?: string[];
}

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.scss']
})
export class ProductCatalogComponent implements OnInit {
  products: Product[] = [
    {
      type: 'CAR_LOAN',
      name: 'Car Loan',
      description: 'Finance your dream car with competitive rates and flexible repayment options.',
      interestRate: 5.5,
      maximumAmount: 50000,
      features: [
        'Quick approval process',
        'No prepayment penalties',
        'Terms up to 84 months',
        'Fixed interest rates'
      ]
    },
    {
      type: 'PERSONAL_LOAN',
      name: 'Personal Loan',
      description: 'Get the funds you need for personal expenses, debt consolidation, or unexpected costs.',
      interestRate: 7.0,
      maximumAmount: 20000,
      features: [
        'No collateral required',
        'Funds available within 48 hours',
        'Flexible repayment schedules',
        'No hidden fees'
      ]
    },
    {
      type: 'CREDIT_CARD',
      name: 'Premium Credit Card',
      description: 'Enjoy exclusive rewards, cashback, and travel benefits with our premium card.',
      interestRate: 18.0,
      maximumAmount: 10000,
      features: [
        '2% cashback on all purchases',
        'Travel insurance included',
        'No foreign transaction fees',
        'Premium concierge service'
      ]
    },
    {
      type: 'LINE_OF_CREDIT',
      name: 'Line of Credit',
      description: 'Access funds as needed with our flexible line of credit for ongoing expenses.',
      interestRate: 10.0,
      maximumAmount: 30000,
      features: [
        'Pay interest only on what you use',
        'Revolving credit facility',
        'Easy online management',
        'Competitive variable rates'
      ]
    }
  ];

  constructor(
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {}

  getProductIcon(productType: string): string {
    switch(productType) {
      case 'CAR_LOAN':
        return 'fas fa-car';
      case 'PERSONAL_LOAN':
        return 'fas fa-wallet';
      case 'CREDIT_CARD':
        return 'fas fa-credit-card';
      case 'LINE_OF_CREDIT':
        return 'fas fa-money-check-alt';
      default:
        return 'fas fa-dollar-sign';
    }
  }

  applyForProduct(productType: string): void {
    this.router.navigate(['/apply'], { 
      queryParams: { 
        productType: productType 
      } 
    });
  }

  showProductDetails(product: Product): void {
    this.dialog.open(ProductDetailsDialogComponent, {
      width: '500px',
      data: product
    });
  }
}