import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-catalog',
  templateUrl: './product-catalog.component.html',
  styleUrls: ['./product-catalog.component.scss']
})
export class ProductCatalogComponent implements OnInit {
  products = [
    {
      type: 'CAR_LOAN',
      name: 'Car Loan',
      description: 'Get a loan to buy your dream car.',
      interestRate: 5.5,
      maximumAmount: 50000
    },
    {
      type: 'PERSONAL_LOAN',
      name: 'Personal Loan',
      description: 'Flexible loan for personal needs.',
      interestRate: 7.0,
      maximumAmount: 20000
    },
    {
      type: 'CREDIT_CARD',
      name: 'Premium Credit Card',
      description: 'Enjoy exclusive benefits with our premium credit card.',
      interestRate: 18.0,
      maximumAmount: 10000
    },
    {
      type: 'LINE_OF_CREDIT',
      name: 'Line of Credit',
      description: 'Access funds as you need them.',
      interestRate: 10.0,
      maximumAmount: 30000
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {}

  applyForProduct(productType: string): void {
    this.router.navigate(['/apply'], { 
      queryParams: { 
        productType: productType 
      } 
    });
  }
}