import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MenuItem, MenuCategory } from '../../shared/models/menu.model';

// Export types for use in components
export type MenuItemDto = MenuItem;
export interface CreateMenuItemPayload {
  name: string;
  price: number;
  categoryId: string | number;
  description?: string;
  isAvailable?: boolean;
  image?: File | null;
  options?: {
    name: string;
    type: 'SWEETNESS' | 'SIZE' | 'TEMPERATURE' | 'TOPPING' | 'OTHER';
    options: { value: string; price: number; }[];
    isRequired: boolean;
    maxSelections: number;
  }[];
}

export interface CreateCategoryPayload {
  name: string;
}

export interface UpdateCategoryPayload {
  name: string;
}

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

  createMenuItem(item: CreateMenuItemPayload): Observable<MenuItem> {
    // เริ่มด้วยการสร้าง menu item ก่อน (ไม่มี options)
    const basePayload = {
      name: item.name,
      price: item.price,
      category_id: item.categoryId,
      description: item.description || undefined,
      is_available: item.isAvailable ?? true
    };

    if (item.image instanceof File) {
      // ถ้ามีรูป ใช้ FormData
      const formData = new FormData();
      formData.append('name', item.name);
      formData.append('price', String(item.price));
      formData.append('category_id', String(item.categoryId));

      if (item.description) {
        formData.append('description', item.description);
      }

      if (typeof item.isAvailable === 'boolean') {
        formData.append('is_available', String(item.isAvailable));
      }

      formData.append('image', item.image);

      // ถ้ามี options เพิ่มเข้าไปใน FormData
      if (item.options && item.options.length > 0) {
        formData.append('options', JSON.stringify(item.options));
      }

      return this.http.post<MenuItem>(`${this.baseUrl}/menu`, formData);
    } else {
      // ไม่มีรูป ส่งเป็น JSON
      const payload = {
        ...basePayload,
        ...(item.options && item.options.length > 0 ? { options: item.options } : {})
      };

      return this.http.post<MenuItem>(`${this.baseUrl}/menu`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  updateMenuItem(id: string, item: CreateMenuItemPayload): Observable<MenuItem> {
    // ถ้ามี options ส่งเป็น JSON, ถ้าไม่มีใช้ FormData
    if (item.options && item.options.length > 0 && !item.image) {
      // ส่งเป็น JSON เมื่อมี options และไม่มีรูป
      const payload = {
        name: item.name,
        price: item.price,
        category_id: item.categoryId,
        description: item.description || undefined,
        is_available: item.isAvailable ?? true,
        options: item.options
      };

      return this.http.put<MenuItem>(`${this.baseUrl}/menu/${id}`, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // ใช้ FormData เมื่อมีรูปภาพ
      const formData = new FormData();
      formData.append('name', item.name);
      formData.append('price', String(item.price));
      formData.append('category_id', String(item.categoryId));

      if (item.description) {
        formData.append('description', item.description);
      }

      if (typeof item.isAvailable === 'boolean') {
        formData.append('is_available', String(item.isAvailable));
      }

      if (item.options && item.options.length > 0) {
        formData.append('options', JSON.stringify(item.options));
      }

      if (item.image instanceof File) {
        formData.append('image', item.image);
      }

      return this.http.put<MenuItem>(`${this.baseUrl}/menu/${id}`, formData);
    }
  }

  deleteMenuItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/menu/${id}`);
  }

  // Category management methods
  createCategory(category: CreateCategoryPayload): Observable<MenuCategory> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.post<MenuCategory>(`${this.baseUrl}/menu-categories`, category, { headers });
  }

  updateCategory(id: string, category: UpdateCategoryPayload): Observable<MenuCategory> {
    const headers = { 'Content-Type': 'application/json' };
    return this.http.patch<MenuCategory>(`${this.baseUrl}/menu-categories/${id}`, category, { headers });
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/menu-categories/${id}`);
  }
}
