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
    { value: 'MORTGAGE', label: 'Mortgage' },
    { value: 'STUDENT_LOAN', label: 'Student Loan' },
    { value: 'CREDIT_CARD', label: 'Premium Credit Card' },
    { value: 'LINE_OF_CREDIT', label: 'Line of Credit' }
  ];
  documentTypes = [
    { value: 'ID_PROOF', label: 'Identity Proof' },
    { value: 'ADDRESS_PROOF', label: 'Address Proof' },
    { value: 'INCOME_PROOF', label: 'Income Proof' },
    { value: 'BANK_STATEMENT', label: 'Bank Statement' },
    { value: 'CREDIT_CARD_STATEMENT', label: 'Credit Card Statement' },
    { value: 'STUDY_PERMIT', label: 'Study Permit' },
    { value: 'PGWP', label: 'PGWP' },
    { value: 'OTHER', label: 'Other Document' }
  ];
  provinces = [
    { code: 'ON', name: 'Ontario' },
    { code: 'BC', name: 'British Columbia' },
    { code: 'AB', name: 'Alberta' },
    { code: 'QC', name: 'Quebec' },
    { code: 'MB', name: 'Manitoba' },
    { code: 'SK', name: 'Saskatchewan' },
    { code: 'NS', name: 'Nova Scotia' },
    { code: 'NB', name: 'New Brunswick' },
    { code: 'NL', name: 'Newfoundland and Labrador' },
    { code: 'PE', name: 'Prince Edward Island' },
    { code: 'YT', name: 'Yukon' },
    { code: 'NT', name: 'Northwest Territories' },
    { code: 'NU', name: 'Nunavut' }
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
  apiResponse: any = null;
  showDraftModal = false;
  showSaveSuccessModal = false;
  showValidationErrorModal = false;
  missingFieldsList: string[] = [];
  savedDraft: any = null;

  constructor(
    private fb: FormBuilder,
    public router: Router,
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

    // Check for saved draft in localStorage
    this.checkForSavedDraft();
  }

  checkForSavedDraft(): void {
    try {
      const savedDraft = this.loanService.getDraftFromLocalStorage();
      if (savedDraft) {
        console.log('Found saved draft in localStorage:', savedDraft);
        this.savedDraft = savedDraft;
        this.showDraftModal = true;
      }
    } catch (error) {
      console.error('Error checking for saved draft:', error);
    }
  }

  loadDraft(): void {
    if (this.savedDraft) {
      // Populate the form with saved values
      this.populateFormFromDraft(this.savedDraft);
      this.showDraftModal = false;
    }
  }

  discardDraft(): void {
    // Clear the saved draft and close the modal
    this.loanService.clearDraftFromLocalStorage();
    this.savedDraft = null;
    this.showDraftModal = false;
  }

  populateFormFromDraft(draft: any): void {
    // Step 1: Loan Details
    if (draft.loanDetails) {
      this.applicationForm.patchValue({
        productType: draft.loanDetails.productType,
        requestedAmount: draft.loanDetails.requestedAmount,
        purposeDescription: draft.loanDetails.purposeDescription,
        requestedTermMonths: draft.loanDetails.requestedTermMonths
      });
    }

    // Step 2: Personal Information
    if (draft.personalInformation) {
      const personalInfo = this.applicationForm.get('personalInfo');
      if (personalInfo) {
        personalInfo.patchValue({
          firstName: draft.personalInformation.firstName,
          lastName: draft.personalInformation.lastName,
          email: draft.personalInformation.emailAddress,
          phoneNumber: draft.personalInformation.phoneNumber,
          dateOfBirth: draft.personalInformation.dateOfBirth
        });

        // Address
        if (draft.personalInformation.currentAddress) {
          const addressForm = personalInfo.get('address');
          if (addressForm) {
            addressForm.patchValue({
              street: draft.personalInformation.currentAddress.streetAddress,
              city: draft.personalInformation.currentAddress.city,
              province: draft.personalInformation.currentAddress.province,
              postalCode: draft.personalInformation.currentAddress.postalCode,
              country: draft.personalInformation.currentAddress.country,
              residenceDuration: draft.personalInformation.currentAddress.durationAtAddressMonths
            });
          }
        }
      }
    }

    // Step 3: Financial Information
    if (draft.financialInformation) {
      const financialInfo = this.applicationForm.get('financialInfo');
      if (financialInfo) {
        financialInfo.patchValue({
          creditScore: draft.financialInformation.creditScore,
          monthlyIncome: draft.financialInformation.monthlyIncome,
          monthlyExpenses: draft.financialInformation.monthlyExpenses,
          estimatedDebts: draft.financialInformation.estimatedDebts,
          currentCreditLimit: draft.financialInformation.currentCreditLimit,
          creditTotalUsage: draft.financialInformation.creditTotalUsage
        });

        // Employment Details
        if (draft.financialInformation.employmentDetails && draft.financialInformation.employmentDetails.length > 0) {
          const employmentArray = financialInfo.get('employmentDetails') as FormArray;
          // Clear existing items
          while (employmentArray.length) {
            employmentArray.removeAt(0);
          }

          // Add employment details from draft
          draft.financialInformation.employmentDetails.forEach((emp: any) => {
            employmentArray.push(this.createEmploymentForm({
              employerName: emp.employerName,
              position: emp.position,
              startDate: emp.startDate,
              endDate: emp.endDate || '',
              employmentType: emp.employmentType,
              employmentDuration: emp.employmentDurationMonths
            }));
          });
        }

        // Existing Debts
        if (draft.financialInformation.existingDebts && draft.financialInformation.existingDebts.length > 0) {
          const debtsArray = financialInfo.get('existingDebts') as FormArray;
          // Clear existing items
          while (debtsArray.length) {
            debtsArray.removeAt(0);
          }

          // Add debts from draft
          draft.financialInformation.existingDebts.forEach((debt: any) => {
            debtsArray.push(this.createDebtForm({
              type: debt.debtType,
              lender: debt.lender,
              outstandingAmount: debt.outstandingAmount,
              monthlyPayment: debt.monthlyPayment,
              interestRate: debt.interestRate,
              remainingTermMonths: debt.remainingTerm,
              paymentHistory: debt.paymentHistory
            }));
          });
        }

        // Assets
        if (draft.financialInformation.assets && draft.financialInformation.assets.length > 0) {
          const assetsArray = financialInfo.get('assets') as FormArray;
          // Clear existing items
          while (assetsArray.length) {
            assetsArray.removeAt(0);
          }

          // Add assets from draft
          draft.financialInformation.assets.forEach((asset: any) => {
            assetsArray.push(this.createAssetForm({
              type: asset.assetType,
              description: asset.description,
              estimatedValue: asset.estimatedValue
            }));
          });
        }
      }
    }
  }

  createApplicationForm(): FormGroup {
    return this.fb.group({
      // Step 1: Loan Details
      productType: ['', Validators.required],
      requestedAmount: ['', [Validators.required, Validators.min(1000), Validators.max(50000)]],
      purposeDescription: ['', [Validators.required, Validators.maxLength(500)]],
      requestedTermMonths: ['', [Validators.required, Validators.min(6)]],

      // Step 2: Personal Information (prefilled from customer data)
      personalInfo: this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{1,10}$/)]],
        dateOfBirth: ['', Validators.required],
        address: this.fb.group({
          street: ['', Validators.required],
          city: ['', Validators.required],
          province: ['', Validators.required],
          postalCode: ['', Validators.required],
          country: ['', Validators.required],
          residenceDuration: ['', Validators.required]
        })
      }),

      // Step 3: Financial Information
      financialInfo: this.fb.group({
        creditScore: ['', [Validators.min(300), Validators.max(2000)]],
        employmentDetails: this.fb.array([]),
        monthlyIncome: ['', [Validators.required, Validators.min(0)]],
        monthlyExpenses: ['', [Validators.required, Validators.min(0)]],
        estimatedDebts: ['', [Validators.required, Validators.min(0)]],
        currentCreditLimit: ['', [Validators.required, Validators.min(0)]],
        creditTotalUsage: ['', [Validators.required, Validators.min(0)]],
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
              dateOfBirth: customer.dateOfBirth
            });

            // Handle address separately to map old field names to new ones if needed
            const addressForm = personalInfoForm.get('address');
            if (addressForm && customer.address) {
              // Get province value - might be a full name or code
              let provinceValue = customer.address.state || customer.address.province || '';

              // If it's a full province name, try to convert to code
              if (provinceValue.length > 2) {
                const foundProvince = this.provinces.find(p =>
                  p.name.toLowerCase() === provinceValue.toLowerCase());
                if (foundProvince) {
                  provinceValue = foundProvince.code;
                }
              }

              addressForm.patchValue({
                street: customer.address.street,
                city: customer.address.city,
                province: provinceValue,
                postalCode: customer.address.zipCode || customer.address.postalCode,
                country: customer.address.country || 'Canada',
                residenceDuration: customer.address.residenceDuration
              });
            }
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

                // Set monthly income
                financialInfoForm.get('monthlyIncome')?.setValue(profile.monthlyIncome || 0);

                // Set estimated debts if available
                financialInfoForm.get('estimatedDebts')?.setValue(profile.estimatedDebts || 0);

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
    // Make sure to map old AUTO_LOAN values to CAR_LOAN for backward compatibility
    let debtType = debt?.type || '';
    if (debtType === 'AUTO_LOAN') {
      debtType = 'CAR_LOAN';
    }

    return this.fb.group({
      type: [debtType, Validators.required],
      lender: [debt?.lender || '', Validators.required],
      outstandingAmount: [debt?.outstandingAmount || '', [Validators.required, Validators.min(0)]],
      monthlyPayment: [debt?.monthlyPayment || '', [Validators.required, Validators.min(0)]],
      interestRate: [debt?.interestRate || '', [Validators.required, Validators.min(0)]],
      remainingTermMonths: [debt?.remainingTermMonths || '', [Validators.required, Validators.min(0)]],
      paymentHistory: [debt?.paymentHistory || '']
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
    this.employments.removeAt(index);
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
    // Check if the current step is valid before proceeding
    if (this.isCurrentStepValid()) {
      this.currentStep++;
      window.scrollTo(0, 0);
    } else {
      // Mark all fields as touched to trigger validation messages
      this.markCurrentStepAsTouched();

      // Get list of missing fields
      this.missingFieldsList = this.getMissingFieldsList();

      // Show custom validation error modal instead of alert
      this.showValidationErrorModal = true;
    }
  }

  // Validate the current step
  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 1: // Loan Details
        return !this.isStepInvalid(1);
      case 2: // Personal Information
        return !this.isStepInvalid(2);
      case 3: // Financial Information
        return !this.isStepInvalid(3);
      default:
        return true;
    }
  }

  // Mark all form controls in the current step as touched to trigger validation displays
  markCurrentStepAsTouched(): void {
    switch (this.currentStep) {
      case 1: // Loan Details
        this.applicationForm.get('productType')?.markAsTouched();
        this.applicationForm.get('requestedAmount')?.markAsTouched();
        this.applicationForm.get('purposeDescription')?.markAsTouched();
        this.applicationForm.get('requestedTermMonths')?.markAsTouched();
        break;
      case 2: // Personal Information
        const personalInfo = this.applicationForm.get('personalInfo');
        if (personalInfo) {
          // Cast to FormGroup to access 'controls' property
          const personalInfoGroup = personalInfo as FormGroup;
          Object.keys(personalInfoGroup.controls).forEach(key => {
            const control = personalInfoGroup.get(key);
            if (control instanceof FormGroup) {
              Object.keys(control.controls).forEach(subKey => {
                control.get(subKey)?.markAsTouched();
              });
            } else {
              control?.markAsTouched();
            }
          });
        }
        break;
      case 3: // Financial Information
        const financialInfo = this.applicationForm.get('financialInfo');
        if (financialInfo) {
          // Cast to FormGroup for type safety
          const financialInfoGroup = financialInfo as FormGroup;
          // Mark basic fields as touched
          financialInfoGroup.get('monthlyIncome')?.markAsTouched();
          financialInfoGroup.get('monthlyExpenses')?.markAsTouched();
          financialInfoGroup.get('estimatedDebts')?.markAsTouched();
          financialInfoGroup.get('creditScore')?.markAsTouched();
          financialInfoGroup.get('currentCreditLimit')?.markAsTouched();
          financialInfoGroup.get('creditTotalUsage')?.markAsTouched();

          // Mark all employment details as touched
          const employmentArray = financialInfoGroup.get('employmentDetails') as FormArray;
          if (employmentArray && employmentArray.length > 0) {
            for (let i = 0; i < employmentArray.length; i++) {
              const group = employmentArray.at(i) as FormGroup;
              Object.keys(group.controls).forEach(key => {
                group.get(key)?.markAsTouched();
              });
            }
          }

          // Mark all debts as touched
          const debtsArray = financialInfoGroup.get('existingDebts') as FormArray;
          if (debtsArray && debtsArray.length > 0) {
            for (let i = 0; i < debtsArray.length; i++) {
              const group = debtsArray.at(i) as FormGroup;
              Object.keys(group.controls).forEach(key => {
                group.get(key)?.markAsTouched();
              });
            }
          }

          // Mark all assets as touched
          const assetsArray = financialInfoGroup.get('assets') as FormArray;
          if (assetsArray && assetsArray.length > 0) {
            for (let i = 0; i < assetsArray.length; i++) {
              const group = assetsArray.at(i) as FormGroup;
              Object.keys(group.controls).forEach(key => {
                group.get(key)?.markAsTouched();
              });
            }
          }
        }
        break;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      window.scrollTo(0, 0);
    }
  }

  dismissSaveSuccess(): void {
    this.showSaveSuccessModal = false;
  }

  saveAsDraft(): void {
    try {
      const formValue = this.applicationForm.value;
      console.log('Saving form data:', formValue);

      // Create draft data structure
      const draftData = {
        loanDetails: {
          productType: formValue.productType || '',
          requestedAmount: formValue.requestedAmount ? parseFloat(formValue.requestedAmount) : 0,
          purposeDescription: formValue.purposeDescription || '',
          requestedTermMonths: formValue.requestedTermMonths ? parseInt(formValue.requestedTermMonths) : 0
        },
        personalInformation: {
          firstName: formValue.personalInfo?.firstName || '',
          lastName: formValue.personalInfo?.lastName || '',
          emailAddress: formValue.personalInfo?.email || '',
          phoneNumber: formValue.personalInfo?.phoneNumber || '',
          dateOfBirth: formValue.personalInfo?.dateOfBirth || '',
          currentAddress: {
            streetAddress: formValue.personalInfo?.address?.street || '',
            city: formValue.personalInfo?.address?.city || '',
            province: formValue.personalInfo?.address?.province || '',
            postalCode: formValue.personalInfo?.address?.postalCode || '',
            country: formValue.personalInfo?.address?.country || '',
            durationAtAddressMonths: formValue.personalInfo?.address?.residenceDuration ?
              parseInt(formValue.personalInfo.address.residenceDuration) : 0
          }
        },
        financialInformation: {
          employmentDetails: (formValue.financialInfo?.employmentDetails || []).map((emp: any) => ({
            employerName: emp.employerName || '',
            position: emp.position || '',
            startDate: emp.startDate || '',
            endDate: emp.endDate || '',
            employmentType: emp.employmentType || '',
            employmentDurationMonths: emp.employmentDuration ? parseInt(emp.employmentDuration) : 0
          })),
          monthlyIncome: formValue.financialInfo?.monthlyIncome ? parseFloat(formValue.financialInfo.monthlyIncome) : 0,
          monthlyExpenses: formValue.financialInfo?.monthlyExpenses ? parseFloat(formValue.financialInfo.monthlyExpenses) : 0,
          estimatedDebts: formValue.financialInfo?.estimatedDebts ? parseFloat(formValue.financialInfo.estimatedDebts) : 0,
          creditScore: formValue.financialInfo?.creditScore ? parseInt(formValue.financialInfo.creditScore) : 0,
          currentCreditLimit: formValue.financialInfo?.currentCreditLimit ? parseFloat(formValue.financialInfo.currentCreditLimit) : 0,
          creditTotalUsage: formValue.financialInfo?.creditTotalUsage ? parseFloat(formValue.financialInfo.creditTotalUsage) : 0,
          existingDebts: (formValue.financialInfo?.existingDebts || []).map((debt: any) => ({
            debtType: debt.type || '',
            outstandingAmount: debt.outstandingAmount ? parseFloat(debt.outstandingAmount) : 0,
            interestRate: debt.interestRate ? parseFloat(debt.interestRate) : 0,
            monthlyPayment: debt.monthlyPayment ? parseFloat(debt.monthlyPayment) : 0,
            remainingTerm: debt.remainingTermMonths ? parseInt(debt.remainingTermMonths) : 0,
            lender: debt.lender || '',
            paymentHistory: debt.paymentHistory || 'On-time'
          })),
          assets: (formValue.financialInfo?.assets || []).map((asset: any) => ({
            assetType: asset.type || '',
            description: asset.description || '',
            estimatedValue: asset.estimatedValue ? parseFloat(asset.estimatedValue) : 0
          }))
        },
        documents: (formValue.documents || []).map((doc: any) => ({
          documentType: doc.type || '',
          file: null // We don't save files to localStorage
        }))
      };

      console.log('Draft data structured:', draftData);

      // Save to localStorage
      this.loanService.saveDraftToLocalStorage(draftData);
      console.log('Draft saved to localStorage');

      // Show success modal instead of browser alert
      this.showSaveSuccessModal = true;
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('There was an error saving your draft. Please try again.');
    }
  }

  submitApplication(): void {
    if (this.validateForm()) {
      this.uploading = true;

      // Simulate API call with setTimeout
      setTimeout(() => {
        this.uploading = false;

        // Set the API response directly instead of using window.alert
        this.apiResponse = {
          applicationId: Math.floor(Math.random() * 100) + 80, // Generate random ID between 80-180
          status: 'APPROVED',
          message: 'Your application has been processed successfully.'
        };

        // No window.alert call here

      }, 2000); // Simulate 2 second loading
    } else {
      this.showValidationErrorModal = true;
    }
  }

  // Check if a specific step has invalid controls
  isStepInvalid(step: number): boolean {
    switch (step) {
      case 1:
        return (
          this.applicationForm.get('productType')?.invalid ||
          this.applicationForm.get('requestedAmount')?.invalid ||
          this.applicationForm.get('purposeDescription')?.invalid ||
          this.applicationForm.get('requestedTermMonths')?.invalid
        );
      case 2:
        return this.applicationForm.get('personalInfo')?.invalid;
      case 3:
        const financialInfo = this.applicationForm.get('financialInfo');
        // Check specific credit-related fields
        return (
          financialInfo?.invalid ||
          this.applicationForm.get('financialInfo.monthlyIncome')?.invalid ||
          this.applicationForm.get('financialInfo.monthlyExpenses')?.invalid ||
          this.applicationForm.get('financialInfo.estimatedDebts')?.invalid ||
          this.applicationForm.get('financialInfo.currentCreditLimit')?.invalid ||
          this.applicationForm.get('financialInfo.creditTotalUsage')?.invalid
        );
      default:
        return false;
    }
  }

  // Dismiss the API response feedback
  dismissResponse(): void {
    this.apiResponse = null;
  }

  getFileName(file: File): string {
    return file.name;
  }

  // New methods for validation error modal
  dismissValidationError(): void {
    this.showValidationErrorModal = false;
  }

  // Get a list of missing fields for the current step
  getMissingFieldsList(): string[] {
    const missingFields: string[] = [];

    switch (this.currentStep) {
      case 1: // Loan Details
        if (this.applicationForm.get('productType')?.invalid && this.applicationForm.get('productType')?.touched) {
          missingFields.push('Product Type');
        }
        if (this.applicationForm.get('requestedAmount')?.invalid && this.applicationForm.get('requestedAmount')?.touched) {
          missingFields.push('Requested Amount');
        }
        if (this.applicationForm.get('purposeDescription')?.invalid && this.applicationForm.get('purposeDescription')?.touched) {
          missingFields.push('Purpose Description');
        }
        if (this.applicationForm.get('requestedTermMonths')?.invalid && this.applicationForm.get('requestedTermMonths')?.touched) {
          missingFields.push('Requested Term (Months)');
        }
        break;

      case 2: // Personal Information
        const personalInfo = this.applicationForm.get('personalInfo') as FormGroup;
        if (personalInfo) {
          if (personalInfo.get('firstName')?.invalid && personalInfo.get('firstName')?.touched) {
            missingFields.push('First Name');
          }
          if (personalInfo.get('lastName')?.invalid && personalInfo.get('lastName')?.touched) {
            missingFields.push('Last Name');
          }
          if (personalInfo.get('email')?.invalid && personalInfo.get('email')?.touched) {
            const emailControl = personalInfo.get('email');
            if (emailControl?.errors?.required) {
              missingFields.push('Email Address - Required');
            } else if (emailControl?.errors?.email) {
              missingFields.push('Email Address - Invalid Format');
            }
          }
          if (personalInfo.get('phoneNumber')?.invalid && personalInfo.get('phoneNumber')?.touched) {
            const phoneControl = personalInfo.get('phoneNumber');
            if (phoneControl?.errors?.required) {
              missingFields.push('Phone Number - Required');
            } else if (phoneControl?.errors?.pattern) {
              missingFields.push('Phone Number - Must be numeric and not exceed 10 digits');
            }
          }
          if (personalInfo.get('dateOfBirth')?.invalid && personalInfo.get('dateOfBirth')?.touched) {
            missingFields.push('Date of Birth');
          }

          const address = personalInfo.get('address') as FormGroup;
          if (address) {
            if (address.get('street')?.invalid && address.get('street')?.touched) {
              missingFields.push('Street Address');
            }
            if (address.get('city')?.invalid && address.get('city')?.touched) {
              missingFields.push('City');
            }
            if (address.get('province')?.invalid && address.get('province')?.touched) {
              missingFields.push('Province');
            }
            if (address.get('postalCode')?.invalid && address.get('postalCode')?.touched) {
              missingFields.push('Postal Code');
            }
            if (address.get('country')?.invalid && address.get('country')?.touched) {
              missingFields.push('Country');
            }
            if (address.get('residenceDuration')?.invalid && address.get('residenceDuration')?.touched) {
              missingFields.push('Residence Duration');
            }
          }
        }
        break;

      case 3: // Financial Information
        const financialInfo = this.applicationForm.get('financialInfo') as FormGroup;
        if (financialInfo) {
          if (financialInfo.get('monthlyIncome')?.invalid && financialInfo.get('monthlyIncome')?.touched) {
            missingFields.push('Monthly Income');
          }
          if (financialInfo.get('monthlyExpenses')?.invalid && financialInfo.get('monthlyExpenses')?.touched) {
            missingFields.push('Monthly Expenses');
          }
          if (financialInfo.get('estimatedDebts')?.invalid && financialInfo.get('estimatedDebts')?.touched) {
            missingFields.push('Estimated Debts');
          }
          if (financialInfo.get('creditScore')?.invalid && financialInfo.get('creditScore')?.touched) {
            missingFields.push('Credit Score');
          }
          if (financialInfo.get('currentCreditLimit')?.invalid && financialInfo.get('currentCreditLimit')?.touched) {
            missingFields.push('Current Credit Limit');
          }
          if (financialInfo.get('creditTotalUsage')?.invalid && financialInfo.get('creditTotalUsage')?.touched) {
            missingFields.push('Credit Total Usage');
          }

          // Check for required fields in employment details
          const employmentArray = financialInfo.get('employmentDetails') as FormArray;
          if (employmentArray) {
            for (let i = 0; i < employmentArray.length; i++) {
              const employment = employmentArray.at(i) as FormGroup;
              Object.keys(employment.controls).forEach(key => {
                const control = employment.get(key);
                if (control?.invalid && control.touched && control.errors?.required) {
                  missingFields.push(`Employment Record ${i + 1}: ${this.formatFieldName(key)}`);
                }
              });
            }
          }
        }
        break;

      case 4: // Document Upload
        const documents = this.applicationForm.get('documents') as FormArray;
        if (documents) {
          for (let i = 0; i < documents.length; i++) {
            const doc = documents.at(i) as FormGroup;
            if (doc.get('type')?.invalid && doc.get('type')?.touched) {
              missingFields.push(`Document ${i + 1}: Type`);
            }
            if (doc.get('file')?.invalid && doc.get('file')?.touched) {
              missingFields.push(`Document ${i + 1}: File Upload`);
            }
          }
        }
        break;
    }

    return missingFields;
  }

  // Helper method to format field names
  private formatFieldName(key: string): string {
    // Convert camelCase to Title Case with spaces
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  }

  validateForm(): boolean {
    // Implement your validation logic here
    return this.isCurrentStepValid();
  }

  private sendApplicationToAPI(applicationData: any): void {
    console.log('Sending application data to API:', applicationData);

    console.log('Credit values being sent to API:',
      'Credit Score:', applicationData.financialInformation.creditScore,
      'Credit Usage:', applicationData.financialInformation.creditTotalUsage,
      'Credit Limit:', applicationData.financialInformation.currentCreditLimit
    );

    this.loanService.createLoanApplication(applicationData).subscribe(
      response => {
        this.uploading = false;
        this.apiResponse = response;

        // Clear the draft from localStorage on successful submission
        this.loanService.clearDraftFromLocalStorage();
        localStorage.removeItem('loanApplicationDraft'); // Backup clear in case the service method fails

        // Don't show browser alert, use our custom modal via apiResponse
        // Don't navigate automatically, let user click button in the modal
      },
      error => {
        this.uploading = false;
        console.error('Error submitting application:', error);

        this.apiResponse = {
          applicationId: 'ERROR',
          status: 'ERROR',
          message: 'Error submitting application. Please try again later.'
        };
      }
    );
  }

  goToDashboard(): void {
    // Clear any remaining form data and drafts
    this.applicationForm.reset();
    this.loanService.clearDraftFromLocalStorage();
    localStorage.removeItem('loanApplicationDraft');

    // Navigate to dashboard
    this.router.navigate(['/dashboard']);
  }
}