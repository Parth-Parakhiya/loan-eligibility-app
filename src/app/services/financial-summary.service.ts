import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreditScore {
    score: number;
    systemGeneratedCreditScore: number;
    lastUpdated: string;
    range: string;
}

export interface FinancialSummary {
    monthlyIncome: number;
    monthlyExpenses: number;
    creditScore: CreditScore;
}

@Injectable({
    providedIn: 'root'
})
export class FinancialSummaryService {
    private apiUrl = `${environment.apiUrl}/financial-summary`;

    constructor(private http: HttpClient) { }

    getFinancialSummary(): Observable<FinancialSummary> {
        return this.http.get<FinancialSummary>(this.apiUrl);
    }
} 