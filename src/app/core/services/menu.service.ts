import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AuthService } from './auth.service';

export type MenuItemStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_STOCK' | string;

export interface MenuCategoryDto {
  id: string | number;
  name?: string | null;
}

export interface MenuItemDto {
  id: string | number;
  name?: string | null;
  category?: string | MenuCategoryDto | null;
  categoryId?: string | number | null;
  description?: string | null;
  price?: number | string | null;
  status?: MenuItemStatus | null;
  isAvailable?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = 'http://localhost:8080/api/menu';

  getMenuItems(): Observable<MenuItemDto[]> {
    const token = this.authService.getToken();
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;

    return this.http.get<MenuItemDto[]>(this.baseUrl, { headers });
  }

  createMenuItem(payload: CreateMenuItemPayload): Observable<MenuItemDto> {
    const token = this.authService.getToken();
    const headers = token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        })
      : undefined;

    return this.http.post<MenuItemDto>(this.baseUrl, payload, { headers });
  }
}
export interface CreateMenuItemPayload {
  name: string;
  categoryId: string;
  price: number;
  description?: string | null;
  isAvailable?: boolean;
}
