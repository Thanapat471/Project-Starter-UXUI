import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { MenuService, MenuItem, MenuCategory } from '../../core/services/menu.service';
import { HttpClientModule } from '@angular/common/http';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

@Component({
  selector: 'app-counter-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzBadgeModule,
    NzSpinModule
  ],
  templateUrl: './counter-order.component.html',
  styleUrls: ['./counter-order.component.css']
})
export class CounterOrderComponent implements OnInit, OnDestroy {
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('ทั้งหมด');
  showFloatingCart = signal<boolean>(false);
  cartVisible = signal<boolean>(false);
  menuItems = signal<MenuItem[]>([]);
  categories = signal<MenuCategory[]>([]);
  loading = signal<boolean>(false);
  cart = signal<CartItem[]>([]);

  constructor(
    private router: Router,
    private menuService: MenuService,
    private message: NzMessageService
  ) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.loadMenuData();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  ngOnDestroy() {
    window.removeEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize() {
    this.showFloatingCart.set(window.innerWidth <= 480);
  }

  toggleCart() {
    this.cartVisible.set(!this.cartVisible());
  }

  private loadMenuData() {
    this.loading.set(true);
    
    // Load categories first
    this.menuService.getMenuCategories().subscribe({
      next: (categories) => {
        // Add "ทั้งหมด" to the beginning
        const allCategories = [{ id: 'all', name: 'ทั้งหมด' }, ...categories];
        this.categories.set(allCategories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.message.error('ไม่สามารถโหลดหมวดหมู่เมนูได้');
        // Set default categories as fallback
        this.categories.set([{ id: 'all', name: 'ทั้งหมด' }]);
      }
    });

    // Load menu items
    this.menuService.getMenuItems().subscribe({
      next: (items) => {
        this.menuItems.set(items.filter(item => item.isAvailable));
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading menu items:', error);
        this.message.error('ไม่สามารถโหลดเมนูได้');
        this.loading.set(false);
        // Set empty array as fallback
        this.menuItems.set([]);
      }
    });
  }

  get filteredMenuItems() {
    const items = this.menuItems();
    const search = this.searchTerm().toLowerCase();
    const selectedCat = this.selectedCategory();

    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search) || 
                           (item.description && item.description.toLowerCase().includes(search));
      const matchesCategory = selectedCat === 'ทั้งหมด' || item.category.name === selectedCat;
      return matchesSearch && matchesCategory;
    });
  }

  get cartTotal() {
    return this.cart().reduce((total, item) => total + item.total, 0);
  }

  get cartItemCount() {
    return this.cart().reduce((total, item) => total + item.quantity, 0);
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
  }

  addToCart(menuItem: MenuItem) {
    const currentCart = this.cart();
    const existingItem = currentCart.find(item => item.id === menuItem.id);

    if (existingItem) {
      const updatedCart = currentCart.map(item => 
        item.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      );
      this.cart.set(updatedCart);
    } else {
      const newItem: CartItem = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        total: menuItem.price
      };
      this.cart.set([...currentCart, newItem]);
    }
  }

  updateCartItemQuantity(itemId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const updatedCart = this.cart().map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    );
    this.cart.set(updatedCart);
  }

  removeFromCart(itemId: string) {
    const updatedCart = this.cart().filter(item => item.id !== itemId);
    this.cart.set(updatedCart);
  }

  goBack() {
    this.router.navigate(['/features/dashboard']);
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300&h=200&fit=crop';
  }
}