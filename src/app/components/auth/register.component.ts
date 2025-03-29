import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void { }

  // Initialize the form with validators
  private initForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10,15}$/), // Allows 10-15 digits
        this.validatePhoneNumber
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        // Optional: Add more complex password validation
        // Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]]
    });
  }

  // Custom phone number validator
  validatePhoneNumber(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;

    // Check if the value is empty
    if (!value) {
      return { 'required': true };
    }

    // Check if the value contains only numbers
    const numberOnly = /^[0-9]+$/.test(value);
    if (!numberOnly) {
      return { 'invalidFormat': true };
    }

    // Check length (between 10 and 15 digits)
    if (value.length < 10 || value.length > 15) {
      return { 'invalidLength': true };
    }

    // Additional specific validations
    const invalidPrefixes = ['000', '111', '911'];
    const hasInvalidPrefix = invalidPrefixes.some(prefix => value.startsWith(prefix));
    if (hasInvalidPrefix) {
      return { 'invalidPrefix': true };
    }

    return null;
  }

  // Convenience getter for easy access to form fields
  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Mark all form controls as touched to trigger validation display
    Object.keys(this.f).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });

    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.loading = true;
    const user = this.registerForm.value;

    this.authService.register(user).subscribe({
      next: (response) => {
        this.loading = false;
        // Show success message before redirecting
        this.successMessage = 'Registration successful! Redirecting to login...';

        // Delay redirect to allow user to see success message
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;

        if (error.status === 409) {
          this.errorMessage = 'An account with this email already exists.';
        } else if (error.status === 400) {
          this.errorMessage = 'Invalid registration data. Please check your information.';
        } else if (error.error && error.error.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Registration failed. Please try again later.';
        }

        console.error('Registration failed', error);
      }
    });
  }

  closeErrorMessage(): void {
    this.errorMessage = null;
  }

  closeSuccessMessage(): void {
    this.successMessage = null;
  }
}