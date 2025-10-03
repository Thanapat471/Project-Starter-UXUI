import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CreateMenuItemPayload, MenuItemDto, MenuService } from '../../core/services/menu.service';

interface MenuCard {
  id: string;
  name: string;
  categoryId: string | null;
  category: string | null;
  description: string;
  price: number;
  priceLabel: string;
  statusLabel: string;
  statusClass: string;
  isAvailable: boolean;
}

interface CategoryOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-menu-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzIconModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzInputNumberModule,
    NzButtonModule
  ],
  providers: [NzMessageService],
  templateUrl: './menu-management.html',
  styleUrl: './menu-management.css'
})
export class MenuManagement {
  private readonly menuService = inject(MenuService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly addModalOpen = signal(false);
  readonly submitting = signal(false);
  readonly priceFormatter = (value: number | string | null): string => {
    if (value === null || value === undefined || value === '') {
      return '฿0';
    }
    const numeric = Number(typeof value === 'string' ? value.replace(/[฿,\s]/g, '') : value);
    const safeNumber = Number.isFinite(numeric) ? numeric : 0;
    return `฿${safeNumber.toLocaleString('th-TH', { minimumFractionDigits: 0 })}`;
  };

  readonly priceParser = (value: string): number => {
    if (!value) {
      return 0;
    }
    const cleaned = value.replace(/[฿,\s]/g, '');
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  private readonly menuItems = signal<MenuCard[]>([]);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('all');

  readonly categories = computed<CategoryOption[]>(() => {
    const map = new Map<string, string>();
    this.menuItems().forEach(item => {
      if (item.categoryId && item.category) {
        map.set(item.categoryId, item.category);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly hasCategories = computed(() => this.categories().length > 0);

  readonly filteredMenuItems = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    const category = this.selectedCategory();

    return this.menuItems().filter(item => {
      const description = item.description.toLowerCase();
      const matchesKeyword = keyword
        ? item.name.toLowerCase().includes(keyword) || description.includes(keyword)
        : true;
      const matchesCategory = category === 'all' ? true : item.categoryId === category;
      return matchesKeyword && matchesCategory;
    });
  });

  readonly addMenuForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    categoryId: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    description: ['']
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

  openCreateModal(): void {
    this.addModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.addModalOpen.set(false);
    this.addMenuForm.reset({ name: '', categoryId: '', price: 0, description: '' });
    this.addMenuForm.markAsPristine();
    this.addMenuForm.markAsUntouched();
    this.submitting.set(false);
  }

  submitCreateMenu(): void {
    if (this.addMenuForm.invalid) {
      this.addMenuForm.markAllAsTouched();
      return;
    }

    const { name, categoryId, price, description } = this.addMenuForm.value;
    const payload: CreateMenuItemPayload = {
      name: name!.trim(),
      categoryId: categoryId!,
      price: Number(price ?? 0),
      description: description?.trim() ? description.trim() : undefined,
      isAvailable: true
    };

    this.submitting.set(true);

    this.menuService
      .createMenuItem(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.message.success('เพิ่มเมนูใหม่เรียบร้อยแล้ว');
          this.closeCreateModal();
          this.fetchMenuItems();
        },
        error: error => {
          this.submitting.set(false);
          const message =
            error.status === 0
              ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
              : 'เพิ่มเมนูไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
          this.message.error(message);
        }
      });
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

    const rawCategory = typeof item.category === 'string'
      ? item.category
      : item.category?.name ?? null;
    const categoryName = this.cleanPlaceholder(rawCategory) || null;

    const rawCategoryId = item.categoryId ?? (typeof item.category === 'object' ? item.category?.id : null);
    const categoryId = rawCategoryId != null ? String(rawCategoryId) : null;

    const rawDescription = this.cleanPlaceholder(item.description);
    const name = this.cleanPlaceholder(item.name) || 'เมนู';

    return {
      id: String(item.id),
      categoryId,
      name,
      category: categoryName,
      description: rawDescription,
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

  private cleanPlaceholder(value: unknown): string {
    if (value == null) {
      return '';
    }

    const text = String(value).trim();
    if (!text) {
      return '';
    }

    const lower = text.toLowerCase();
    if (lower === 'string' || lower === 'null' || lower === 'undefined') {
      return '';
    }

    return text;
  }
}
