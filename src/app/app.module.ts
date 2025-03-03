import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoanApplicationComponent } from './components/loan-application/loan-application.component';
import { EligibilityResultsComponent } from './components/eligibility-results/eligibility-results.component';
import { ApplicationStatusComponent } from './components/application-status/application-status.component';
import { ProductCatalogComponent } from './components/product-catalog/product-catalog.component';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    DashboardComponent,
    LoanApplicationComponent,
    EligibilityResultsComponent,
    ApplicationStatusComponent,
    ProductCatalogComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }