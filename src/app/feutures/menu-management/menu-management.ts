import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MenuItemDto, MenuService } from '../../core/services/menu.service';

interface MenuCard {
  id: string;
  name: string;
  category: string | null;
  description: string;
  price: number;
  priceLabel: string;
  statusLabel: string;
  statusClass: string;
  isAvailable: boolean;
}

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './menu-management.html',
  styleUrl: './menu-management.css'
})
export class MenuManagement {
  private readonly menuService = inject(MenuService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private readonly menuItems = signal<MenuCard[]>([]);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('all');

  readonly categories = computed(() => {
    const items = this.menuItems();
    const unique = new Set<string>();
    items.forEach(item => {
      if (item.category) {
        unique.add(item.category);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredMenuItems = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();

    return this.menuItems().filter(item => {
      const description = item.description.toLowerCase();
      const matchesKeyword = keyword
        ? item.name.toLowerCase().includes(keyword) || description.includes(keyword)
        : true;
      const matchesCategory = category === 'all' ? true : (item.category ?? '') === category;
      return matchesKeyword && matchesCategory;
    });
  });

  constructor() {
    this.fetchMenuItems();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onSelectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  reload(): void {
    this.fetchMenuItems();
  }

  trackByMenuId(_index: number, item: MenuCard): string {
    return item.id;
  }

  private fetchMenuItems(): void {
    this.loading.set(true);
    this.error.set(null);

    this.menuService
      .getMenuItems()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          const mapped = response.map(item => this.mapMenuItem(item));
          this.menuItems.set(mapped);
          this.loading.set(false);
        },
        error: error => {
          const message =
            error.status === 0
              ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
              : 'เกิดข้อผิดพลาดในการดึงข้อมูลเมนู';
          this.error.set(message);
          this.loading.set(false);
        }
      });
  }

  private mapMenuItem(item: MenuItemDto): MenuCard {
    const normalizedStatus = (item.status ?? (item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'))
      ?.toString()
      .toUpperCase();

    const isAvailable = normalizedStatus === 'AVAILABLE' || normalizedStatus === 'ACTIVE' || item.isAvailable === true;

    const priceValue = typeof item.price === 'number' ? item.price : Number(item.price ?? 0);
    const price = Number.isFinite(priceValue) ? priceValue : 0;

    const categoryName = typeof item.category === 'string'
      ? item.category
      : item.category?.name ?? null;

    return {
      id: String(item.id),
      name: item.name?.trim() || '',
      category: categoryName?.trim() ?? null,
      description: item.description?.trim() || '',
      price,
      priceLabel: this.formatCurrency(price),
      statusLabel: isAvailable ? 'เปิดขาย' : 'ปิดขาย',
      statusClass: isAvailable ? 'status--available' : 'status--unavailable',
      isAvailable
    };
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0
    }).format(amount ?? 0);
  }
}
