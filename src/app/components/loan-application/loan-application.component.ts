import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanApplicationService } from '../../services/loan-application.service';
import { CustomerService } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { LoanApplication } from '../../models/loan-application.model';

@Component({
  selector: 'app-loan-application',
  templateUrl: './loan-application.component.html',
  styleUrls: ['./loan-application.component.scss']
})
export class LoanApplicationComponent implements OnInit {
  applicationForm: FormGroup;
  productTypes = [
    { value: 'CAR_LOAN', label: 'Car Loan' },
    { value: 'PERSONAL_LOAN', label: 'Personal Loan' },
    { value: 'CREDIT_CARD', label: 'Premium Credit Card' },
    { value: 'LINE_OF_CREDIT', label: 'Line of Credit' }
  ];
  documentTypes = [
    { value: 'ID_PROOF', label: 'Identity Proof' },
    { value: 'ADDRESS_PROOF', label: 'Address Proof' },
    { value: 'INCOME_PROOF', label: 'Income Proof' },
    { value: 'BANK_STATEMENT', label: 'Bank Statement' },
    { value: 'OTHER', label: 'Other Document' }
  ];
  uploading = false;
  submitted = false;
  customerId: string | null = null;
  currentStep = 1;
  totalSteps = 4;
  stepTitles = [
    'Loan Details',
    'Personal Information',
    'Financial Information',
    'Document Upload'
  ];
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loanService: LoanApplicationService,
    private customerService: CustomerService,
    private authService: AuthService
  ) {
    this.applicationForm = this.createApplicationForm();
  }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.customerId) {
      this.customerId = currentUser.customerId;
      this.loadCustomerData();
    }
  }

  createApplicationForm(): FormGroup {
    return this.fb.group({
      // Step 1: Loan Details
      productType: ['', Validators.required],
      requestedAmount: ['', [Validators.required, Validators.min(1000)]],
      purposeDescription: ['', [Validators.required, Validators.maxLength(500)]],
      requestedTermMonths: ['', [Validators.required, Validators.min(6)]],
      
      // Step 2: Personal Information (prefilled from customer data)
      personalInfo: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', Validators.required],
        dateOfBirth: ['', Validators.required],
        address: this.fb.group({
          street: ['', Validators.required],
          city: ['', Validators.required],
          state: ['', Validators.required],
          zipCode: ['', Validators.required],
          country: ['', Validators.required],
          residenceDuration: ['', Validators.required]
        })
      }),
      
      // Step 3: Financial Information
      financialInfo: this.fb.group({
        employmentDetails: this.fb.group({
          employerName: ['', Validators.required],
          position: ['', Validators.required],
          employmentDuration: ['', Validators.required],
          monthlyIncome: ['', [Validators.required, Validators.min(0)]],
          employmentType: ['', Validators.required]
        }),
        monthlyExpenses: ['', [Validators.required, Validators.min(0)]],
        existingDebts: this.fb.array([]),
        assets: this.fb.array([])
      }),
      
      // Step 4: Document Upload
      documents: this.fb.array([])
    });
  }

  loadCustomerData(): void {
    if (this.customerId) {
      this.customerService.getCustomerById(this.customerId).subscribe(
        customer => {
          // Populate personal information fields
          const personalInfoForm = this.applicationForm.get('personalInfo');
          if (personalInfoForm) {
            personalInfoForm.patchValue({
              firstName: customer.firstName,
              lastName: customer.lastName,
              email: customer.email,
              phoneNumber: customer.phoneNumber,
              dateOfBirth: customer.dateOfBirth,
              address: customer.address
            });
          }
          
          // Load financial profile
          this.customerService.getFinancialProfile(this.customerId!).subscribe(
            profile => {
              const financialInfoForm = this.applicationForm.get('financialInfo');
              if (financialInfoForm && profile) {
                // Set employment details
                financialInfoForm.get('employmentDetails')?.patchValue({
                  employerName: customer.employmentDetails.employerName,
                  position: customer.employmentDetails.position,
                  employmentDuration: customer.employmentDetails.employmentDuration,
                  monthlyIncome: customer.employmentDetails.monthlyIncome,
                  employmentType: customer.employmentDetails.employmentType
                });
                
                // Set monthly expenses
                financialInfoForm.get('monthlyExpenses')?.setValue(profile.monthlyExpenses);
                
                // Add existing debts
                const debtsArray = financialInfoForm.get('existingDebts') as FormArray;
                if (profile.existingDebts && profile.existingDebts.length > 0) {
                  profile.existingDebts.forEach(debt => {
                    debtsArray.push(this.createDebtForm(debt));
                  });
                }
                
                // Add assets
                const assetsArray = financialInfoForm.get('assets') as FormArray;
                if (profile.assets && profile.assets.length > 0) {
                  profile.assets.forEach(asset => {
                    assetsArray.push(this.createAssetForm(asset));
                  });
                }
              }
            },
            error => {
              console.error('Error loading financial profile', error);
            }
          );
        },
        error => {
          console.error('Error loading customer data', error);
        }
      );
    }
  }

  createDebtForm(debt?: any): FormGroup {
    return this.fb.group({
      type: [debt?.type || '', Validators.required],
      lender: [debt?.lender || '', Validators.required],
      outstandingAmount: [debt?.outstandingAmount || '', [Validators.required, Validators.min(0)]],
      monthlyPayment: [debt?.monthlyPayment || '', [Validators.required, Validators.min(0)]],
      interestRate: [debt?.interestRate || '', [Validators.required, Validators.min(0)]],
      remainingTermMonths: [debt?.remainingTermMonths || '', [Validators.required, Validators.min(0)]]
    });
  }

  createAssetForm(asset?: any): FormGroup {
    return this.fb.group({
      type: [asset?.type || '', Validators.required],
      description: [asset?.description || '', Validators.required],
      estimatedValue: [asset?.estimatedValue || '', [Validators.required, Validators.min(0)]]
    });
  }

  createDocumentForm(): FormGroup {
    return this.fb.group({
      type: ['', Validators.required],
      file: [null, Validators.required]
    });
  }

  get debts(): FormArray {
    return this.applicationForm.get('financialInfo.existingDebts') as FormArray;
  }

  get assets(): FormArray {
    return this.applicationForm.get('financialInfo.assets') as FormArray;
  }

  get documents(): FormArray {
    return this.applicationForm.get('documents') as FormArray;
  }

  addDebt(): void {
    this.debts.push(this.createDebtForm());
  }

  removeDebt(index: number): void {
    this.debts.removeAt(index);
  }

  addAsset(): void {
    this.assets.push(this.createAssetForm());
  }

  removeAsset(index: number): void {
    this.assets.removeAt(index);
  }

  addDocument(): void {
    this.documents.push(this.createDocumentForm());
  }

  removeDocument(index: number): void {
    this.documents.removeAt(index);
  }

  onFileChange(event: any, index: number): void {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      const documentForm = this.documents.at(index) as FormGroup;
      documentForm.get('file')?.setValue(file);
    }
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      window.scrollTo(0, 0);
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  saveAsDraft(): void {
    if (this.customerId) {
      const formValue = this.applicationForm.value;
      const application: LoanApplication = {
        customerId: this.customerId,
        productType: formValue.productType,
        requestedAmount: formValue.requestedAmount,
        purposeDescription: formValue.purposeDescription,
        requestedTermMonths: formValue.requestedTermMonths,
        applicationDate: new Date(),
        status: 'DRAFT'
      };
      
      this.loanService.createApplication(application).subscribe(
        result => {
          this.router.navigate(['/dashboard']);
        },
        error => {
          console.error('Error saving application draft', error);
        }
      );
    }
  }

  submitApplication(): void {
    this.submitted = true;
    
    if (this.applicationForm.invalid) {
      return;
    }
    
    if (this.customerId) {
      const formValue = this.applicationForm.value;
      const application: LoanApplication = {
        customerId: this.customerId,
        productType: formValue.productType,
        requestedAmount: formValue.requestedAmount,
        purposeDescription: formValue.purposeDescription,
        requestedTermMonths: formValue.requestedTermMonths,
        applicationDate: new Date(),
        status: 'SUBMITTED'
      };
      
      this.loanService.createApplication(application).subscribe(
        createdApp => {
          // Upload documents
          const docs = this.applicationForm.get('documents')?.value;
          if (docs && docs.length > 0) {
            this.uploading = true;
            let uploadedCount = 0;
            
            docs.forEach((doc: any, index: number) => {
              this.loanService.uploadDocument(
                createdApp.id!,
                doc.type,
                doc.file
              ).subscribe(
                () => {
                  uploadedCount++;
                  if (uploadedCount === docs.length) {
                    this.uploading = false;
                    this.router.navigate(['/results', createdApp.id]);
                  }
                },
                error => {
                  console.error('Error uploading document', error);
                  this.uploading = false;
                }
              );
            });
          } else {
            this.router.navigate(['/results', createdApp.id]);
          }
        },
        error => {
          console.error('Error submitting application', error);
          this.submitted = false;
        }
      );
    }
  }
}
