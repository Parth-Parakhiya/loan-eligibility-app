import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [
        Validators.required,
        Validators.pattern(/^[0-9]{10,15}$/), // Allows 10-15 digits
        this.validatePhoneNumber
      ]], // Preset phone number
      password: ['', [
        Validators.required, 
        Validators.minLength(8),
        // Optional: Add more complex password validation
        // Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      ]]
    });
  }

  // Custom phone number validator
validatePhoneNumber(control: AbstractControl): {[key: string]: any} | null {
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
  ngOnInit(): void {}

  onSubmit(): void {
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(field => {
        const control = this.registerForm.get(field);
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }

    const user = this.registerForm.value;
    this.authService.register(user).subscribe(
      () => {
        // Navigate to login or dashboard
        this.router.navigate(['/login']);
      },
      error => {
        console.error('Registration failed', error);
        // Optionally show error message to user
      }
    );
  }
}