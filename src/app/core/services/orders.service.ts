import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

export type OrderStatus = 'PENDING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItemDto {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
  } | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderDto {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  source: 'COUNTER' | 'TABLE';
  notes: string | null;
  table: string | null;
  orderItems: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = 'http://localhost:8080/api/orders';

  getOrders(): Observable<OrderDto[]> {
    const token = this.authService.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.get<OrderDto[]>(this.baseUrl, { headers });
  }
}
