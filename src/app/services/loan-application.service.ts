import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoanApplication } from '../models/loan-application.model';
import { EligibilityResult } from '../models/eligibility-result.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoanApplicationService {
  private apiUrl = `${environment.apiUrl}/loan-applications`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  createLoanApplication(application: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.authService.token}`
    });

    return this.http.post<any>(this.apiUrl, application, { headers });
  }

  updateApplication(application: LoanApplication): Observable<LoanApplication> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.token}`
    });

    return this.http.put<LoanApplication>(`${this.apiUrl}/${application.id}`, application, { headers });
  }

  getApplicationById(id: string): Observable<LoanApplication> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });

    return this.http.get<LoanApplication>(`${this.apiUrl}/${id}`, { headers });
  }

  getCustomerApplications(customerId: string): Observable<LoanApplication[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });

    return this.http.get<LoanApplication[]>(`${this.apiUrl}/customer/${customerId}`, { headers });
  }

  submitApplication(id: string): Observable<LoanApplication> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authService.token}`
    });

    return this.http.post<LoanApplication>(`${this.apiUrl}/${id}/submit`, {}, { headers });
  }

  uploadDocument(file: File, documentType: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });

    return this.http.post<{ id: string }>(`${environment.apiUrl}/documents/upload`, formData, { headers })
      .toPromise()
      .then(response => response!.id);
  }

  checkEligibility(applicationId: string): Observable<EligibilityResult> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.token}`
    });

    return this.http.get<EligibilityResult>(`${this.apiUrl}/${applicationId}/eligibility`, { headers });
  }

  // Save draft to local storage
  saveDraftToLocalStorage(application: any): void {
    localStorage.setItem('loanApplicationDraft', JSON.stringify(application));
  }

  // Get draft from local storage
  getDraftFromLocalStorage(): any {
    const draft = localStorage.getItem('loanApplicationDraft');
    return draft ? JSON.parse(draft) : null;
  }

  // Clear draft from local storage
  clearDraftFromLocalStorage(): void {
    localStorage.removeItem('loanApplicationDraft');
  }
}