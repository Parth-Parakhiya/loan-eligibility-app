import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Customer, EmploymentDetails } from '../models/customer.model';
import { FinancialProfile } from '../models/financial-profile.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) { }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  updateCustomer(customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${customer.id}`, customer);
  }

  getFinancialProfile(customerId: string): Observable<FinancialProfile> {
    return this.http.get<FinancialProfile>(`${this.apiUrl}/${customerId}/financial-profile`);
  }

  updateFinancialProfile(customerId: string, profile: FinancialProfile): Observable<FinancialProfile> {
    return this.http.put<FinancialProfile>(`${this.apiUrl}/${customerId}/financial-profile`, profile);
  }
  
  updateEmploymentDetails(customerId: string, employmentDetails: EmploymentDetails[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${customerId}/employment-details`, { employmentDetails });
  }
}