import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateOrderRequest, Order } from '../../shared/models/menu.model';

// Export types for use in components
export type OrderDto = Order;
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED';
export type { Order, CreateOrderRequest };

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  createOrder(order: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.baseUrl}/orders`, order);
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.baseUrl}/orders`);
  }

  updateOrderStatus(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.baseUrl}/orders/${id}/status`, { status });
  }

  // Counter ordering with immediate checkout
  checkout(checkoutData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/orders/checkout`, checkoutData);
  }
}
