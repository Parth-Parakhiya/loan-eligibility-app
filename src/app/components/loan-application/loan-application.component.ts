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
        creditScore: ['', [Validators.min(300), Validators.max(2000)]],
        employmentDetails: this.fb.array([]),
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
                // Set credit score if available
                if (profile.creditScore) {
                  financialInfoForm.get('creditScore')?.setValue(profile.creditScore);
                }

                // Set monthly expenses
                financialInfoForm.get('monthlyExpenses')?.setValue(profile.monthlyExpenses);

                // Add employment details
                const employmentArray = financialInfoForm.get('employmentDetails') as FormArray;
                if (customer.employmentDetails && customer.employmentDetails.length > 0) {
                  customer.employmentDetails.forEach(employment => {
                    // Format dates for the form
                    const formattedEmployment = {
                      ...employment,
                      startDate: employment.startDate ? new Date(employment.startDate).toISOString().split('T')[0] : '',
                      endDate: employment.endDate ? new Date(employment.endDate).toISOString().split('T')[0] : ''
                    };
                    employmentArray.push(this.createEmploymentForm(formattedEmployment));
                  });
                } else {
                  // Add at least one empty employment form
                  employmentArray.push(this.createEmploymentForm());
                }

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

  createEmploymentForm(employment?: any): FormGroup {
    return this.fb.group({
      employerName: [employment?.employerName || '', Validators.required],
      position: [employment?.position || '', Validators.required],
      employmentType: [employment?.employmentType || '', Validators.required],
      employmentDuration: [employment?.employmentDuration || '', Validators.required],
      startDate: [employment?.startDate || '', Validators.required],
      endDate: [employment?.endDate || '']
    });
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

  get employments(): FormArray {
    return this.applicationForm.get('financialInfo.employmentDetails') as FormArray;
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

  addEmployment(): void {
    this.employments.push(this.createEmploymentForm());
  }

  removeEmployment(index: number): void {
    // If this is the last employment record, add a new one first before removing
    if (this.employments.length === 1) {
      // Create a new employment record
      const newEmployment = this.createEmploymentForm();

      // Add it to the array
      this.employments.push(newEmployment);

      // Then remove the requested one
      this.employments.removeAt(index);
    } else {
      // If there are multiple records, just remove the requested one
      this.employments.removeAt(index);
    }
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

      this.loanService.createLoanApplication(application).subscribe(
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
      // Highlight the first tab with errors
      if (this.applicationForm.get('productType')?.invalid ||
        this.applicationForm.get('requestedAmount')?.invalid ||
        this.applicationForm.get('purposeDescription')?.invalid ||
        this.applicationForm.get('requestedTermMonths')?.invalid) {
        this.currentStep = 1;
      } else if (this.applicationForm.get('personalInfo')?.invalid) {
        this.currentStep = 2;
      } else if (this.applicationForm.get('financialInfo')?.invalid) {
        this.currentStep = 3;
      } else if (this.applicationForm.get('documents')?.invalid) {
        this.currentStep = 4;
      }

      window.scrollTo(0, 0);
      return;
    }

    const formData = this.applicationForm.value;

    // Format the data as needed for the API
    const loanApplication: LoanApplication = {
      customerId: this.customerId!,
      productType: formData.productType,
      requestedAmount: formData.requestedAmount,
      purposeDescription: formData.purposeDescription,
      requestedTermMonths: formData.requestedTermMonths,
      applicationDate: new Date(),
      status: 'SUBMITTED'
    };

    // Upload documents first (if any)
    if (this.documents.length > 0) {
      this.uploading = true;

      // Collect all file upload promises
      const uploadPromises = [];

      for (let i = 0; i < this.documents.length; i++) {
        const doc = this.documents.at(i).value;
        if (doc.file) {
          uploadPromises.push(this.loanService.uploadDocument(doc.file, doc.type));
        }
      }

      // Wait for all uploads to complete
      Promise.all(uploadPromises)
        .then(documentIds => {
          // Attach document IDs to the application
          loanApplication.supportingDocuments = documentIds.map((id, index) => {
            const doc = this.documents.at(index).value;
            return {
              id,
              type: doc.type,
              fileName: doc.file.name,
              fileSize: doc.file.size,
              uploadDate: new Date(),
              status: 'PENDING'
            };
          });

          // Send employment details to update customer profile
          const employmentDetails = this.employments.value.map((employment: any) => {
            // Format dates for submission
            return {
              ...employment,
              startDate: employment.startDate,
              endDate: employment.endDate || null
            };
          });

          const creditScore = this.applicationForm.get('financialInfo.creditScore')?.value;

          // Create financial data object with all the financial information
          const financialData = {
            employmentDetails,
            creditScore: creditScore || undefined
          };

          // Update customer employment and financial records
          this.customerService.updateFinancialData(this.customerId!, financialData)
            .subscribe(
              () => {
                // Then submit the loan application
                this.submitLoanApplication(loanApplication);
              },
              error => {
                console.error('Error updating financial data', error);
                this.uploading = false;
                // Handle error (show message to user)
                alert('Error updating financial data. Please try again.');
              }
            );
        })
        .catch(error => {
          console.error('Error uploading documents', error);
          this.uploading = false;
          // Handle error (show message to user)
          alert('Error uploading documents. Please try again.');
        });
    } else {
      // Update employment details first
      const employmentDetails = this.employments.value.map((employment: any) => {
        // Format dates for submission
        return {
          ...employment,
          startDate: employment.startDate,
          endDate: employment.endDate || null
        };
      });

      const creditScore = this.applicationForm.get('financialInfo.creditScore')?.value;

      // Create financial data object with all the financial information
      const financialData = {
        employmentDetails,
        creditScore: creditScore || undefined
      };

      // Update customer employment and financial records
      this.customerService.updateFinancialData(this.customerId!, financialData)
        .subscribe(
          () => {
            // Then submit the loan application directly (no documents to upload)
            this.submitLoanApplication(loanApplication);
          },
          error => {
            console.error('Error updating financial data', error);
            // Handle error (show message to user)
            alert('Error updating financial data. Please try again.');
          }
        );
    }
  }

  private submitLoanApplication(application: LoanApplication): void {
    this.loanService.createLoanApplication(application)
      .subscribe(
        result => {
          this.uploading = false;
          // Navigate to success page or application dashboard
          this.router.navigate(['/applications', result.id, 'success']);
        },
        error => {
          console.error('Error submitting application', error);
          this.uploading = false;
          // Handle error (show message to user)
          alert('Error submitting application. Please try again.');
        }
      );
  }

  getFileName(file: File): string {
    return file ? file.name : '';
  }
}