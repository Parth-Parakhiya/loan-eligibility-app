import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoanApplicationComponent } from './components/loan-application/loan-application.component';
import { EligibilityResultsComponent } from './components/eligibility-results/eligibility-results.component';
import { ApplicationStatusComponent } from './components/application-status/application-status.component';
import { ProductCatalogComponent } from './components/product-catalog/product-catalog.component';
import { AuthGuard } from './guards/auth.guard';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'apply', component: LoanApplicationComponent, canActivate: [AuthGuard] },
  { path: 'results/:applicationId', component: EligibilityResultsComponent, canActivate: [AuthGuard] },
  { path: 'status', component: ApplicationStatusComponent, canActivate: [AuthGuard] },
  { path: 'status/:id', component: ApplicationStatusComponent, canActivate: [AuthGuard] },
  { path: 'products', component: ProductCatalogComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }