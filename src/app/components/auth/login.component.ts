import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  loginError: string | null = null;
  
  // New property to track error type
  errorType: 'credentials' | 'network' | 'unknown' = 'unknown';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.loginError = null;
    this.errorType = 'unknown';

    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe(
      (response) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      (error) => {
        this.isLoading = false;
        
        // Detailed error handling
        if (error.status === 401) {
          // Unauthorized - incorrect credentials
          this.errorType = 'credentials';
          this.loginError = 'Invalid email or password. Please try again.';
        } else if (error.status === 0) {
          // Network error
          this.errorType = 'network';
          this.loginError = 'Unable to connect to the server. Please check your internet connection.';
        } else {
          // Other unknown errors
          this.errorType = 'unknown';
          this.loginError = 'Invalid email or password. Please try again.';
        }
        
        console.error('Login failed', error);
      }
    );
  }
}