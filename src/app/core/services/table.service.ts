import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Table,
  CreateTableRequest,
  TableSession,
  StartSessionRequest
} from '../../shared/models/table.model';

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  getTables(): Observable<Table[]> {
    return this.http.get<Table[]>(`${this.baseUrl}/tables`);
  }

  createTable(table: CreateTableRequest): Observable<Table> {
    return this.http.post<Table>(`${this.baseUrl}/tables`, table);
  }

  updateTable(id: number, table: Partial<Table>): Observable<Table> {
    return this.http.put<Table>(`${this.baseUrl}/tables/${id}`, table);
  }

  deleteTable(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/tables/${id}`);
  }

  downloadQRCode(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/tables/${id}/qr`, {
      responseType: 'blob'
    });
  }

  // Table QR Session Management (Public APIs - no auth required)
  startSession(qrToken: string, request: StartSessionRequest): Observable<TableSession> {
    return this.http.post<TableSession>(`${this.baseUrl}/tables/session/${qrToken}`, request);
  }

  getSessionStatus(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/tables/session/${sessionId}/status`);
  }

  closeSession(sessionId: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/tables/session/${sessionId}/close`, {});
  }
}
