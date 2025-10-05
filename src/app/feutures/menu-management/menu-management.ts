import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CreateMenuItemPayload, MenuItemDto, MenuService, MenuCategory } from '../../core/services/menu.service';

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
  imageUrl: string | null;
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
  providers: [NzMessageService, NzModalService],
  templateUrl: './menu-management.html',
  styleUrl: './menu-management.css'
})
export class MenuManagement {
  private readonly menuService = inject(MenuService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly message = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly maxImageSizeBytes = 5 * 1024 * 1024;

  @ViewChild('imageInput') private imageInputRef?: ElementRef<HTMLInputElement>;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly addModalOpen = signal(false);
  readonly submitting = signal(false);
  readonly editingMenuId = signal<string | null>(null);
  readonly editingMenu = signal<MenuCard | null>(null);
  readonly editingImageUrl = signal<string | null>(null);
  readonly categoriesLoading = signal(false);
  readonly categoriesError = signal<string | null>(null);
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
  readonly categories = signal<CategoryOption[]>([]);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('all');
  readonly selectedImageName = signal('');

  readonly hasCategories = computed(() => this.categories().length > 0);
  readonly isEditing = computed(() => this.editingMenuId() !== null);

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
    description: [''],
    image: [null as File | null]
  });

  constructor() {
    this.fetchMenuItems();
    this.fetchCategories();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  onSelectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  reload(): void {
    this.fetchMenuItems();
    this.fetchCategories();
  }

  trackByMenuId(_index: number, item: MenuCard): string {
    return item.id;
  }

  openCreateModal(): void {
    this.prepareCreateForm();
    this.addModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.addModalOpen.set(false);
    this.clearSelectedImage();
    this.addMenuForm.reset({ name: '', categoryId: '', price: 0, description: '', image: null });
    this.addMenuForm.markAsPristine();
    this.addMenuForm.markAsUntouched();
    this.submitting.set(false);
    this.editingMenuId.set(null);
    this.editingMenu.set(null);
    this.editingImageUrl.set(null);
  }

  submitCreateMenu(): void {
    if (this.addMenuForm.invalid) {
      this.addMenuForm.markAllAsTouched();
      return;
    }

    const { name, categoryId, price, description, image } = this.addMenuForm.value;
    const editingId = this.editingMenuId();
    const payload: CreateMenuItemPayload = {
      name: name!.trim(),
      categoryId: categoryId!,
      price: Number(price ?? 0),
      description: description?.trim() ? description.trim() : undefined,
      isAvailable: editingId ? this.editingMenu()?.isAvailable ?? true : true
    };

    if (image instanceof File) {
      payload.image = image;
    }

    this.submitting.set(true);

    const request$ = editingId
      ? this.menuService.updateMenuItem(editingId, payload)
      : this.menuService.createMenuItem(payload);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.message.success(editingId ? 'บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว' : 'เพิ่มเมนูใหม่เรียบร้อยแล้ว');
          this.closeCreateModal();
          this.fetchMenuItems();
        },
        error: error => {
          this.submitting.set(false);
          const message =
            error.status === 0
              ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
              : editingId
                ? 'แก้ไขเมนูไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
                : 'เพิ่มเมนูไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
          this.message.error(message);
        }
      });
  }

  onSelectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    if (!file) {
      this.clearSelectedImage(input);
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.message.warning('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      this.clearSelectedImage(input);
      return;
    }

    if (file.size > this.maxImageSizeBytes) {
      this.message.warning('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB');
      this.clearSelectedImage(input);
      return;
    }

    this.addMenuForm.patchValue({ image: file });
    this.selectedImageName.set(file.name);
    if (this.isEditing()) {
      this.editingImageUrl.set(null);
    }
  }

  clearSelectedImage(input?: HTMLInputElement | null): void {
    const target = input ?? this.imageInputRef?.nativeElement ?? null;
    if (target) {
      target.value = '';
    }

    this.addMenuForm.patchValue({ image: null }, { emitEvent: false });
    this.selectedImageName.set('');
    if (this.isEditing()) {
      this.editingImageUrl.set(this.editingMenu()?.imageUrl ?? null);
    }
  }

  editMenu(menu: MenuCard): void {
    this.editingMenuId.set(menu.id);
    this.editingMenu.set(menu);
    this.editingImageUrl.set(menu.imageUrl);
    this.clearSelectedImage();
    this.addMenuForm.reset({
      name: menu.name,
      categoryId: menu.categoryId ?? '',
      price: menu.price,
      description: menu.description,
      image: null
    });
    this.addMenuForm.markAsPristine();
    this.addMenuForm.markAsUntouched();
    this.addModalOpen.set(true);
  }

  confirmDeleteMenu(menu: MenuCard): void {
    this.modal.confirm({
      nzTitle: 'ยืนยันการลบเมนู',
      nzContent: `คุณต้องการลบเมนู "${menu.name}" หรือไม่?`,
      nzOkText: 'ลบ',
      nzCancelText: 'ยกเลิก',
      nzOkDanger: true,
      nzOnOk: () =>
        firstValueFrom(
          this.menuService.deleteMenuItem(menu.id).pipe(
            catchError(error => {
              const message =
                error.status === 0
                  ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
                  : 'ลบเมนูไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
              this.message.error(message);
              return throwError(() => error);
            })
          )
        ).then(() => {
          this.message.success(`ลบเมนู "${menu.name}" แล้ว`);
          if (this.editingMenuId() === menu.id) {
            this.closeCreateModal();
          }
          this.fetchMenuItems();
        })
    });
  }

  private prepareCreateForm(): void {
    this.editingMenuId.set(null);
    this.editingMenu.set(null);
    this.editingImageUrl.set(null);
    this.clearSelectedImage();
    this.addMenuForm.reset({ name: '', categoryId: '', price: 0, description: '', image: null });
    this.addMenuForm.markAsPristine();
    this.addMenuForm.markAsUntouched();
    this.submitting.set(false);
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

  private fetchCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesError.set(null);

    this.menuService
      .getMenuCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: MenuCategory[]) => {
          const mapped = response.map(category => ({
            id: String(category.id),
            name: category.name || 'ไม่ระบุชื่อ'
          }));
          this.categories.set(mapped);
          this.categoriesLoading.set(false);
        },
        error: (error: any) => {
          const message =
            error.status === 0
              ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
              : 'เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่';
          this.categoriesError.set(message);
          this.categoriesLoading.set(false);
          console.error('Failed to fetch categories:', error);
        }
      });
  }

  private mapMenuItem(item: MenuItemDto): MenuCard {
    const rawStatus = (item as MenuItemDto & { status?: unknown }).status;
    const normalizedStatus = rawStatus != null
      ? String(rawStatus).trim().toUpperCase()
      : null;

    const isAvailable = normalizedStatus != null
      ? normalizedStatus === 'AVAILABLE' || normalizedStatus === 'ACTIVE'
      : item.isAvailable === true;

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

    const rawImage = this.cleanPlaceholder((item as MenuItemDto & { image?: string; imageUrl?: string }).imageUrl
      ?? (item as MenuItemDto & { image?: string }).image)
      || null;
    const imageUrl = rawImage ? this.normalizeImageUrl(rawImage) : null;

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
      isAvailable,
      imageUrl
    };
  }

  private normalizeImageUrl(path: string): string {
    const trimmed = path.trim();
    if (!trimmed) {
      return '';
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('//')) {
      return `${window.location.protocol}${trimmed}`;
    }

    if (trimmed.startsWith('/')) {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return origin ? `${origin}${trimmed}` : trimmed;
    }

    return trimmed;
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
