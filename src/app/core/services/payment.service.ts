import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PromptPayPaymentRequest,
  PromptPayPaymentResponse,
  CashPaymentRequest,
  CashPaymentResponse,
  ConfirmPaymentResponse,
  CheckoutRequest,
  CheckoutResponse,
  Payment
} from '../../shared/models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  // PromptPay Payment
  createPromptPayPayment(request: PromptPayPaymentRequest): Observable<PromptPayPaymentResponse> {
    return this.http.post<PromptPayPaymentResponse>(`${this.baseUrl}/payments/promptpay`, request);
  }

  // Cash Payment
  createCashPayment(request: CashPaymentRequest): Observable<CashPaymentResponse> {
    return this.http.post<CashPaymentResponse>(`${this.baseUrl}/payments/cash`, request);
  }

  // Confirm Payment (no body required, only payment ID in URL)
  confirmPayment(paymentId: number): Observable<ConfirmPaymentResponse> {
    return this.http.post<ConfirmPaymentResponse>(`${this.baseUrl}/payments/${paymentId}/confirm`, {});
  }

  // Get Payment Status
  getPaymentStatus(paymentId: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.baseUrl}/payments/${paymentId}/status`);
  }

  // Get Table Pending Orders
  getTablePendingOrders(tableId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/payments/table/${tableId}/pending`);
  }

  // Get All Tables with Pending Orders
  getAllTablesPendingOrders(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/payments/tables/pending`);
  }

  // Counter Checkout (One-step ordering + payment)
  checkout(request: CheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.baseUrl}/orders/checkout`, request);
  }
}
