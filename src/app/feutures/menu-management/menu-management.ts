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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CreateMenuItemPayload, MenuItemDto, MenuService, MenuCategory, CreateCategoryPayload, UpdateCategoryPayload } from '../../core/services/menu.service';
import { ToastService } from '../../core/services/toast.service';

interface MenuOptionValue {
  value: string;
  price: number;
}

interface MenuOptionGroup {
  name: string;
  type: 'SWEETNESS' | 'SIZE' | 'TEMPERATURE' | 'TOPPING' | 'OTHER';
  options: MenuOptionValue[];
  isRequired: boolean;
  maxSelections: number;
}

interface MenuItemWithOptions {
  name: string;
  description?: string;
  price: number;
  category_id: string | number;
  options?: MenuOptionGroup[];
}

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
  options?: MenuOptionGroup[];
}

interface CategoryOption {
  id: string;
  name: string;
}

interface MenuOptionValue {
  value: string;
  price: number;
}

interface MenuOptionGroup {
  name: string;
  type: 'SWEETNESS' | 'SIZE' | 'TEMPERATURE' | 'TOPPING' | 'OTHER';
  options: MenuOptionValue[];
  isRequired: boolean;
  maxSelections: number;
}

interface MenuItemWithOptions {
  name: string;
  description?: string;
  price: number;
  category_id: string | number;
  options?: MenuOptionGroup[];
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
    NzButtonModule,
    NzCheckboxModule,
    NzSkeletonModule
  ],
  providers: [NzModalService],
  templateUrl: './menu-management.html',
  styleUrl: './menu-management.css'
})
export class MenuManagement {
  private readonly menuService = inject(MenuService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly modal = inject(NzModalService);
  private readonly maxImageSizeBytes = 5 * 1024 * 1024;

  @ViewChild('imageInput') private imageInputRef?: ElementRef<HTMLInputElement>;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly addModalOpen = signal(false);
  readonly categoryModalOpen = signal(false);
  readonly deleteModalOpen = signal(false);
  readonly submitting = signal(false);
  readonly categorySubmitting = signal(false);
  readonly deleteSubmitting = signal(false);
  readonly editingMenuId = signal<string | null>(null);
  readonly editingCategoryId = signal<string | null>(null);
  readonly editingMenu = signal<MenuCard | null>(null);
  readonly editingImageUrl = signal<string | null>(null);
  readonly deleteTarget = signal<MenuCard | null>(null);
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
  readonly categorySearchTerm = signal('');
  readonly selectedCategory = signal('all');
  readonly selectedImageName = signal('');
  readonly selectedImagePreview = signal<string | null>(null);

  // Options management signals
  readonly hasOptions = signal(false);
  readonly currentOptions = signal<MenuOptionGroup[]>([]);
  readonly optionTypes = [
    { value: 'SWEETNESS', label: 'ระดับความหวาน' },
    { value: 'SIZE', label: 'ขนาด' },
    { value: 'TEMPERATURE', label: 'รูปแบบ/อุณหภูมิ' },
    { value: 'TOPPING', label: 'ท็อปปิ้ง' },
    { value: 'OTHER', label: 'อื่นๆ' }
  ];

  readonly hasCategories = computed(() => this.categories().length > 0);
  readonly isEditing = computed(() => this.editingMenuId() !== null);
  readonly isEditingCategory = computed(() => this.editingCategoryId() !== null);

  // Show More functionality instead of pagination
  readonly showAll = signal(false);
  readonly initialItemsToShow = 6;
  readonly loadMoreStep = 6;
  readonly itemsToShow = signal(this.initialItemsToShow);
  readonly total = computed(() => this.filteredMenuItems().length);

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

  // Displayed menu items with "Show More" logic
  readonly displayedMenuItems = computed(() => {
    const allItems = this.filteredMenuItems();
    const show = this.showAll();
    const itemsCount = this.itemsToShow();

    return show ? allItems : allItems.slice(0, itemsCount);
  });

  // Check if there are more items to show
  readonly hasMoreItems = computed(() => {
    return this.filteredMenuItems().length > this.itemsToShow();
  });

  readonly filteredCategoriesForModal = computed(() => {
    const keyword = this.categorySearchTerm().trim().toLowerCase();
    return this.categories().filter(category =>
      keyword ? category.name.toLowerCase().includes(keyword) : true
    );
  });

  readonly addMenuForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    categoryId: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    description: [''],
    image: [null as File | null],
    hasOptions: [false]
  });

  readonly categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]]
  });

  constructor() {
    this.fetchMenuItems();
    this.fetchCategories();

    // ซิงค์ hasOptions form control กับ signal
    this.addMenuForm.get('hasOptions')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        this.hasOptions.set(!!value);
        if (!value) {
          this.currentOptions.set([]);
        }
      });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.showAll.set(false); // Reset when searching
    this.itemsToShow.set(this.initialItemsToShow);
  }

  onCategorySearch(term: string): void {
    this.categorySearchTerm.set(term);
  }

  onSelectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.showAll.set(false); // Reset when changing category
    this.itemsToShow.set(this.initialItemsToShow);
  }

  // Show More functionality
  toggleShowMore(): void {
    const currentShow = this.showAll();
    if (currentShow) {
      // If currently showing all, reset to initial
      this.showAll.set(false);
      this.itemsToShow.set(this.initialItemsToShow); // Reset to initial items count
      // Scroll to top when showing less
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // If currently showing limited, load more items
      const currentItems = this.itemsToShow();
      const totalItems = this.filteredMenuItems().length;
      const newItemsCount = Math.min(currentItems + this.loadMoreStep, totalItems);

      this.itemsToShow.set(newItemsCount);

      // If we've loaded all items, set showAll to true
      if (newItemsCount >= totalItems) {
        this.showAll.set(true);
      }
    }
  }

  reload(): void {
    this.fetchMenuItems();
    this.fetchCategories();
  }

  trackByMenuId(_index: number, item: MenuCard): string {
    return item.id;
  }

  trackByCategoryId(_index: number, item: CategoryOption): string {
    return item.id;
  }

  getMenuCountByCategory(categoryId: string): number {
    return this.menuItems().filter(item => item.categoryId === categoryId).length;
  }

  // Modal scroll management - disabled to allow browser scrolling
  private preventBodyScroll(): void {
    // No-op: allow browser scroll
  }

  private restoreBodyScroll(): void {
    // No-op: allow browser scroll
  }

  openCreateModal(): void {
    this.prepareCreateForm();
    this.addModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.addModalOpen.set(false);
    this.clearSelectedImage();
    this.resetMenuForm();
  }

  // Options management methods
  onHasOptionsChange(hasOptions: boolean): void {
    this.hasOptions.set(hasOptions);
    if (!hasOptions) {
      this.currentOptions.set([]);
    }
  }

  addOptionGroup(): void {
    const newGroup: MenuOptionGroup = {
      name: 'ขนาด', // Default name from type
      type: 'SIZE',
      options: [{ value: '', price: 0 }],
      isRequired: true,
      maxSelections: 1
    };
    this.currentOptions.set([...this.currentOptions(), newGroup]);
  }

  removeOptionGroup(index: number): void {
    const options = this.currentOptions();
    options.splice(index, 1);
    this.currentOptions.set([...options]);
  }

  addOptionValue(groupIndex: number): void {
    const options = [...this.currentOptions()];
    options[groupIndex].options.push({ value: '', price: 0 });
    this.currentOptions.set(options);
  }

  removeOptionValue(groupIndex: number, valueIndex: number): void {
    const options = [...this.currentOptions()];
    options[groupIndex].options.splice(valueIndex, 1);
    this.currentOptions.set(options);
  }

  updateOptionGroup(groupIndex: number, field: string, event: any): void {
    const options = [...this.currentOptions()];
    const value = event.target ? event.target.value : event;

    if (field === 'isRequired') {
      (options[groupIndex] as any)[field] = event.target?.checked || false;
    } else if (field === 'maxSelections') {
      (options[groupIndex] as any)[field] = Number(value) || 1;
    } else if (field === 'type') {
      // Update type and automatically set name based on type
      (options[groupIndex] as any)[field] = value;
      // Map type to Thai name
      const typeNameMap: Record<string, string> = {
        'SIZE': 'ขนาด',
        'SWEETNESS': 'ความหวาน',
        'TEMPERATURE': 'อุณหภูมิ',
        'TOPPING': 'ท็อปปิ้ง'
      };
      options[groupIndex].name = typeNameMap[value] || value;
    } else {
      (options[groupIndex] as any)[field] = value;
    }

    this.currentOptions.set(options);
  }

  updateOptionValue(groupIndex: number, valueIndex: number, field: string, event: any): void {
    const options = [...this.currentOptions()];
    const value = event.target ? event.target.value : event;
    if (field === 'price') {
      (options[groupIndex].options[valueIndex] as any)[field] = Number(value) || 0;
    } else {
      (options[groupIndex].options[valueIndex] as any)[field] = value;
    }
    this.currentOptions.set(options);
  }

  resetMenuForm(): void {
    this.addMenuForm.reset({ name: '', categoryId: '', price: 0, description: '', image: null, hasOptions: false });
    this.addMenuForm.markAsPristine();
    this.addMenuForm.markAsUntouched();
    this.hasOptions.set(false);
    this.currentOptions.set([]);
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

    const { name, categoryId, price, description, image, hasOptions } = this.addMenuForm.value;
    const editingId = this.editingMenuId();
    const payload: CreateMenuItemPayload = {
      name: name!.trim(),
      categoryId: categoryId!,
      price: Number(price ?? 0),
      description: description?.trim() ? description.trim() : undefined,
      isAvailable: editingId ? this.editingMenu()?.isAvailable ?? true : true
    };

    const optionPayload = hasOptions ? this.buildOptionPayload() : [];
    if (hasOptions && optionPayload.length === 0) {
      this.toast.warning('กรุณาระบุตัวเลือกอย่างน้อยหนึ่งรายการ หรือปิดตัวเลือกเพิ่มเติม');
      return;
    }

    if (optionPayload.length > 0) {
      payload.options = optionPayload;
    }

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
          this.toast.success(editingId ? 'บันทึกการเปลี่ยนแปลงเรียบร้อยแล้ว' : 'เพิ่มเมนูใหม่เรียบร้อยแล้ว');
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
          this.toast.error(message);
        }
      });
  }

  private buildOptionPayload(): NonNullable<CreateMenuItemPayload['options']> {
    return this.currentOptions()
      .map(group => {
        const name = this.cleanPlaceholder(group?.name);
        if (!name) {
          return null;
        }

        const values = Array.isArray(group?.options)
          ? group.options
              .map(option => {
                const valueLabel = this.cleanPlaceholder(option?.value);
                if (!valueLabel) {
                  return null;
                }

                const numericPrice = Number(option?.price);
                return {
                  value: valueLabel,
                  price: Number.isFinite(numericPrice) ? numericPrice : 0
                };
              })
              .filter((value): value is { value: string; price: number } => value !== null)
          : [];

        if (values.length === 0) {
          return null;
        }

        const rawMax = Number(group?.maxSelections);
        const normalizedMax = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 1;

        return {
          name,
          type: this.normalizeOptionType(group?.type),
          options: values,
          isRequired: !!group?.isRequired,
          maxSelections: normalizedMax
        };
      })
      .filter((group): group is NonNullable<CreateMenuItemPayload['options']>[number] => group !== null);
  }

  onSelectImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    if (!file) {
      this.clearSelectedImage(input);
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toast.warning('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      this.clearSelectedImage(input);
      return;
    }

    if (file.size > this.maxImageSizeBytes) {
      this.toast.warning('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB');
      this.clearSelectedImage(input);
      return;
    }

    this.addMenuForm.patchValue({ image: file });
    this.selectedImageName.set(file.name);
    this.readPreviewFromFile(file);
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
    this.selectedImagePreview.set(null);
    if (this.isEditing()) {
      this.editingImageUrl.set(this.editingMenu()?.imageUrl ?? null);
    }
  }

  editMenu(menu: MenuCard): void {
    this.editingMenuId.set(menu.id);
    this.editingMenu.set(menu);
    this.editingImageUrl.set(menu.imageUrl);
    this.clearSelectedImage();
    const optionGroups = Array.isArray(menu.options)
      ? menu.options.map(group => ({
          ...group,
          options: group.options.map(option => ({ ...option })),
          // Ensure maxSelections is set to the actual value from backend
          maxSelections: Number.isFinite(Number(group.maxSelections)) && Number(group.maxSelections) > 0
            ? Number(group.maxSelections)
            : 1
        }))
      : [];
    const hasExistingOptions = optionGroups.length > 0;
    this.hasOptions.set(hasExistingOptions);
    this.currentOptions.set(optionGroups);
    this.addMenuForm.reset({
      name: menu.name,
      categoryId: menu.categoryId ?? '',
      price: menu.price,
      description: menu.description,
      image: null,
      hasOptions: hasExistingOptions
    });
    this.addMenuForm.markAsPristine();
    this.addMenuForm.markAsUntouched();
    this.addModalOpen.set(true);
  }

  confirmDeleteMenu(menu: MenuCard): void {
    this.deleteTarget.set(menu);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.deleteTarget.set(null);
  }

  executeDelete(): void {
    const menu = this.deleteTarget();
    if (!menu) return;

    this.deleteSubmitting.set(true);

    firstValueFrom(
      this.menuService.deleteMenuItem(menu.id).pipe(
        catchError(error => {
          const message =
            error.status === 0
              ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
              : 'ลบเมนูไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
          this.toast.error(message);
          return throwError(() => error);
        })
      )
    ).then(() => {
      this.toast.success(`ลบเมนู "${menu.name}" แล้ว`);
      if (this.editingMenuId() === menu.id) {
        this.closeCreateModal();
      }
      this.fetchMenuItems();
      this.closeDeleteModal();
    }).finally(() => {
      this.deleteSubmitting.set(false);
    });
  }

  // Category management methods
  openCategoryModal(): void {
    this.prepareCategoryForm();
    this.categoryModalOpen.set(true);
  }

  closeCategoryModal(): void {
    this.categoryModalOpen.set(false);
    this.categoryForm.reset({ name: '' });
    this.categoryForm.markAsPristine();
    this.categoryForm.markAsUntouched();
    this.categorySubmitting.set(false);
    this.editingCategoryId.set(null);
    this.categorySearchTerm.set('');
  }

  cancelEditCategory(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '' });
    this.categoryForm.markAsPristine();
    this.categoryForm.markAsUntouched();
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const { name } = this.categoryForm.value;
    const editingId = this.editingCategoryId();

    // Try different payload formats in case the API expects different field names
    const payload: CreateCategoryPayload = {
      name: name!.trim()
    };

    console.log('Sending category payload:', payload);
    console.log('API endpoint:', editingId ? `UPDATE /menu-categories/${editingId}` : 'POST /menu-categories');

    this.categorySubmitting.set(true);

    const request$ = editingId
      ? this.menuService.updateCategory(editingId, payload)
      : this.menuService.createCategory(payload);

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success(editingId ? 'แก้ไขหมวดหมู่เรียบร้อยแล้ว' : 'เพิ่มหมวดหมู่ใหม่เรียบร้อยแล้ว');
          this.closeCategoryModal();
          this.fetchCategories();
        },
        error: error => {
          this.categorySubmitting.set(false);
          console.error('Category API Error:', error);
          console.error('Error response:', error.error);
          console.error('Error status:', error.status);

          const message =
            error.status === 0
              ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
              : error.status === 400
                ? `ข้อมูลไม่ถูกต้อง: ${error.error?.message || 'กรุณาตรวจสอบข้อมูลที่กรอก'}`
                : editingId
                  ? 'แก้ไขหมวดหมู่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
                  : 'เพิ่มหมวดหมู่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
          this.toast.error(message);
        }
      });
  }

  editCategory(category: CategoryOption): void {
    this.editingCategoryId.set(category.id);
    this.categoryForm.reset({
      name: category.name
    });
    this.categoryForm.markAsPristine();
    this.categoryForm.markAsUntouched();
    this.categoryModalOpen.set(true);
  }

  confirmDeleteCategory(category: CategoryOption): void {
    this.modal.confirm({
      nzTitle: 'ยืนยันการลบหมวดหมู่',
      nzContent: `คุณต้องการลบหมวดหมู่ "${category.name}" หรือไม่? เมนูที่อยู่ในหมวดหมู่นี้จะไม่มีหมวดหมู่`,
      nzOkText: 'ลบ',
      nzCancelText: 'ยกเลิก',
      nzOkDanger: true,
      nzOnOk: () =>
        firstValueFrom(
          this.menuService.deleteCategory(category.id).pipe(
            catchError(error => {
              const message =
                error.status === 0
                  ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
                  : 'ลบหมวดหมู่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
              this.toast.error(message);
              return throwError(() => error);
            })
          )
        ).then(() => {
          this.toast.success(`ลบหมวดหมู่ "${category.name}" แล้ว`);
          this.fetchCategories();
          this.fetchMenuItems(); // Refresh menus as their categories might have changed
        })
    });
  }

  private prepareCreateForm(): void {
    this.resetMenuForm();
    this.clearSelectedImage();
  }

  private prepareCategoryForm(): void {
    this.editingCategoryId.set(null);
    this.categoryForm.reset({ name: '' });
    this.categoryForm.markAsPristine();
    this.categoryForm.markAsUntouched();
    this.categorySubmitting.set(false);
  }

  private readPreviewFromFile(file: File): void {
    this.selectedImagePreview.set(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      this.selectedImagePreview.set(typeof result === 'string' ? result : null);
    };
    reader.onerror = () => {
      this.selectedImagePreview.set(null);
    };
    reader.readAsDataURL(file);
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
          const initialCount = Math.min(this.initialItemsToShow, mapped.length || this.initialItemsToShow);
          this.itemsToShow.set(initialCount > 0 ? initialCount : this.initialItemsToShow);
          this.showAll.set(false);
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

    const options = this.mapMenuOptions(item.options);

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
      imageUrl,
      options
    };
  }

  private mapMenuOptions(options: MenuItemDto['options']): MenuOptionGroup[] | undefined {
    if (!Array.isArray(options) || options.length === 0) {
      return undefined;
    }

    const mapped = options
      .map(option => {
        const optionName = this.cleanPlaceholder(option?.name) || 'ตัวเลือก';
        const optionType = this.normalizeOptionType(option?.type);
        const values = Array.isArray(option?.options)
          ? option.options
              .map(value => ({
                value: this.cleanPlaceholder(value?.value),
                price: Number.isFinite(Number(value?.price)) ? Number(value?.price) : 0
              }))
              .filter(v => !!v.value)
          : [];

        if (values.length === 0) {
          return null;
        }

        const rawMax = Number(option?.maxSelections);
        const safeMax = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : 1;

        return {
          name: optionName,
          type: optionType,
          options: values,
          isRequired: option?.isRequired ?? false,
          maxSelections: Math.min(safeMax, values.length)
        } satisfies MenuOptionGroup;
      })
      .filter((group): group is MenuOptionGroup => group !== null);

    return mapped.length > 0 ? mapped : undefined;
  }

  private normalizeOptionType(type: unknown): MenuOptionGroup['type'] {
    const upper = typeof type === 'string' ? type.trim().toUpperCase() : '';
    const allowed: MenuOptionGroup['type'][] = ['SWEETNESS', 'SIZE', 'TEMPERATURE', 'TOPPING', 'OTHER'];
    return allowed.includes(upper as MenuOptionGroup['type']) ? (upper as MenuOptionGroup['type']) : 'OTHER';
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
