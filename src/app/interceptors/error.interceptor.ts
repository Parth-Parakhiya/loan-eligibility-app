import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private router: Router) { }

    intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        return next.handle(request).pipe(
            catchError((error: HttpErrorResponse) => {
                // Handle specific status codes
                if (error.status === 401) {
                    // Auto logout if 401 response returned from api
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('token');
                    this.router.navigate(['/login']);
                }

                // Special handling for user already exists errors
                if (error.status === 409 && request.url.includes('/register')) {
                    // Log the error but preserve it in its original form
                    console.error(`User registration conflict: ${error.status} - ${error.error?.message || error.message}`);

                    // Make sure we don't transform the error so the component gets the original message
                    return throwError(() => error);
                }

                // Log a minimal error message for debugging
                console.error(`API Error: ${error.status} - ${error.message}`);

                // Pass the error along
                return throwError(() => error);
            })
        );
    }
} 