import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private apiUrl = `${environment.apiUrl}/auth`; // Add API URL

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<any>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  public get token(): string {
    return this.currentUserValue?.token || '';
  }

  public getAuthorizationHeader(): { Authorization: string } {
    return { Authorization: `Bearer ${this.token}` };
  }

  login(email: string, password: string): Observable<any> {
    // Replace simulated login with actual API call
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        // Store user and token in localStorage
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  register(user: any): Observable<any> {
    const url = `${this.apiUrl}/register`;

    // Use post method with the full response to access status code
    return this.http.post(url, user, { observe: 'response' }).pipe(
      map(response => {
        // If we get a successful response, return the body or a success object
        return response.body || { success: true };
      }),
      catchError((error: HttpErrorResponse) => {
        // Check if it's actually a success code that's being treated as an error
        if (error.status === 201 || error.status === 200) {
          return of({ success: true });
        }

        // For 409 Conflict - User already exists, preserve the backend message
        if (error.status === 409) {
          // Log the actual backend response for debugging
          console.error('User already exists error:', error.error);
        }

        // Pass through the error without modifying it, so component can access the original error
        return throwError(() => error);
      })
    );
  }

  isAuthenticated(): boolean {
    // Check if token exists in localStorage
    return !!localStorage.getItem('token');
  }

  // New method to get token
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}