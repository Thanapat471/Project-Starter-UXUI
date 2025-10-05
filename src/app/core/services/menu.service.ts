import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem, MenuCategory } from '../../shared/models/menu.model';

// Export types for use in components
export type MenuItemDto = MenuItem;
export type CreateMenuItemPayload = Partial<MenuItem>;
export type { MenuItem, MenuCategory };

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api';

  getMenuItems(): Observable<MenuItem[]> {
    return this.http.get<MenuItem[]>(`${this.baseUrl}/menu`);
  }

  getMenuCategories(): Observable<MenuCategory[]> {
    return this.http.get<MenuCategory[]>(`${this.baseUrl}/menu-categories`);
  }

  createMenuItem(item: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${this.baseUrl}/menu`, item);
  }

  updateMenuItem(id: string, item: Partial<MenuItem>): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${this.baseUrl}/menu/${id}`, item);
  }

  deleteMenuItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/menu/${id}`);
  }
}
