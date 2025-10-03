import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Receipt,
  CreateReceiptRequest,
  CreateReceiptResponse
} from '../../shared/models/receipt.model';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  createReceipt(request: CreateReceiptRequest): Observable<CreateReceiptResponse> {
    return this.http.post<CreateReceiptResponse>(`${this.baseUrl}/receipts`, request);
  }

  getReceipts(): Observable<Receipt[]> {
    return this.http.get<Receipt[]>(`${this.baseUrl}/receipts`);
  }

  downloadReceiptPDF(receiptId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/receipts/${receiptId}/pdf`, {
      responseType: 'blob'
    });
  }
}
