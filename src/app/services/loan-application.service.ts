import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoanApplication } from '../models/loan-application.model';
import { EligibilityResult } from '../models/eligibility-result.model';

@Injectable({
  providedIn: 'root'
})
export class LoanApplicationService {
  private apiUrl = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) { }

  createLoanApplication(application: LoanApplication): Observable<LoanApplication> {
    return this.http.post<LoanApplication>(this.apiUrl, application);
  }

  updateApplication(application: LoanApplication): Observable<LoanApplication> {
    return this.http.put<LoanApplication>(`${this.apiUrl}/${application.id}`, application);
  }

  getApplicationById(id: string): Observable<LoanApplication> {
    return this.http.get<LoanApplication>(`${this.apiUrl}/${id}`);
  }

  getCustomerApplications(customerId: string): Observable<LoanApplication[]> {
    return this.http.get<LoanApplication[]>(`${this.apiUrl}/customer/${customerId}`);
  }

  submitApplication(id: string): Observable<LoanApplication> {
    return this.http.post<LoanApplication>(`${this.apiUrl}/${id}/submit`, {});
  }

  uploadDocument(file: File, documentType: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', documentType);

    return this.http.post<{ id: string }>(`${environment.apiUrl}/documents/upload`, formData)
      .toPromise()
      .then(response => response!.id);
  }

  checkEligibility(applicationId: string): Observable<EligibilityResult> {
    return this.http.get<EligibilityResult>(`${this.apiUrl}/${applicationId}/eligibility`);
  }
}