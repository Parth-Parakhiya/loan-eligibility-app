import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-product-details-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.name }}</h2>
    <mat-dialog-content>
      <p>{{ data.description }}</p>
      
      <div class="details-section">
        <div class="detail-row">
          <span class="label">Interest Rate:</span>
          <span class="value">{{ data.interestRate }}%</span>
        </div>
        <div class="detail-row">
          <span class="label">Maximum Amount:</span>
          <span class="value">{{ data.maximumAmount | currency }}</span>
        </div>
      </div>
      
      <h3>Key Features</h3>
      <ul class="features-list">
        <li *ngFor="let feature of data.features">{{ feature }}</li>
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Close</button>
      <button mat-raised-button color="primary" (click)="apply()">Apply Now</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .details-section {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    
    .label {
      color: #6c757d;
    }
    
    .value {
      font-weight: 600;
    }
    
    .features-list {
      padding-left: 20px;
    }
    
    .features-list li {
      margin-bottom: 8px;
    }
  `]
})
export class ProductDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProductDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router
  ) {}
  
  close(): void {
    this.dialogRef.close();
  }
  
  apply(): void {
    this.dialogRef.close();
    this.router.navigate(['/apply'], { 
      queryParams: { 
        productType: this.data.type 
      } 
    });
  }
}