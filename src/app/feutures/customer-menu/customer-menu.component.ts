import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { Subject, firstValueFrom } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';
interface Category {
  id: string;
  name: string;
  menuItems: MenuItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category: Category;
  categoryName?: string; // For processed items
  image: string | null;
  imageUrl: string | null;
  isAvailable: boolean;
  options: any[];
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  options: {
    menuOptionId: number;
    selectedValue: string;
    additionalPrice: number;
  }[];
}

interface OrderRequest {
  items: OrderItem[];
  sessionId: string;
  notes?: string;
}

interface OrderResponse {
  orderId: string;
  sessionId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule],
  templateUrl: './customer-menu.component.html',
  styleUrl: './customer-menu.component.css'
})
export class CustomerMenuComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  categories = ['All'];
  selectedCategory = 'All';
  searchTerm = '';

  // Session properties
  sessionId = '';
  tableId = '';
  tableName = '';

  // Order properties
  isPlacingOrder = false;
  orderNotes = '';

  // Menu properties
  menuItems: MenuItem[] = [];
  isLoadingMenu = false;
  menuError = '';

  constructor(
    private readonly cartService: CartService,
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  get filteredItems(): MenuItem[] {
    let items = this.menuItems.filter(item => item.isAvailable !== false);

    // Filter by category
    if (this.selectedCategory !== 'All') {
      items = items.filter(item => {
        const categoryName = item.categoryName || item.category?.name || 'อื่นๆ';
        return categoryName === this.selectedCategory;
      });
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }

    return items;
  }

  private updateFilteredItems(): void {
    // This method is kept for compatibility but does nothing
    // since we're using getter approach
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    // Don't call updateFilteredItems here to prevent loops
    // Let the getter handle filtering
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.updateFilteredItems();
  }

  onSearchChange(): void {
    this.updateFilteredItems();
  }

  ngOnInit(): void {
    this.loadSessionData();
    this.loadMenu();
  }

  private loadSessionData(): void {
    // Try to get sessionId from query params first
    this.route.queryParams.subscribe(params => {
      if (params['sessionId']) {
        this.sessionId = params['sessionId'];
        localStorage.setItem('customerSessionId', this.sessionId);
      }
    });

    // If not in query params, try localStorage
    if (!this.sessionId) {
      this.sessionId = localStorage.getItem('customerSessionId') || '';
    }

    this.tableId = localStorage.getItem('customerTableId') || '';
    this.tableName = localStorage.getItem('customerTableName') || '';

    // If no session, redirect to debug page
    if (!this.sessionId) {
      console.warn('No session ID found, redirecting to debug page');
      this.router.navigate(['/qr-debug']);
    } else {
      console.log('Session loaded:', {
        sessionId: this.sessionId,
        tableId: this.tableId,
        tableName: this.tableName
      });
    }
  }

  async loadMenu(): Promise<void> {
    try {
      this.isLoadingMenu = true;
      this.menuError = '';

      const response = await firstValueFrom(
        this.http.get<any>('http://localhost:8080/api/menu')
      );

      if (Array.isArray(response)) {
        // If response is array of menu items directly
        this.menuItems = response.map(item => ({
          ...item,
          categoryName: item.category?.name || item.categoryName || 'อื่นๆ',
          imageUrl: item.imageUrl || item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
        }));

        // Extract unique categories from menu items
        const uniqueCategories = [...new Set(this.menuItems.map(item => item.categoryName).filter(Boolean))];
        this.categories = ['All', ...uniqueCategories as string[]];

      } else if (response && typeof response === 'object') {
        if ('categories' in response && Array.isArray(response.categories)) {
          // If response has categories structure
          this.categories = ['All', ...response.categories.map((cat: any) => cat.name)];
          this.menuItems = response.categories.flatMap((category: any) =>
            (category.menuItems || []).map((item: MenuItem) => ({
              ...item,
              categoryName: category.name,
              imageUrl: item.imageUrl || item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
            }))
          );
        } else if (response.data && Array.isArray(response.data)) {
          // If response has data wrapper
          this.menuItems = response.data.map((item: any) => ({
            ...item,
            categoryName: item.category?.name || item.categoryName || 'อื่นๆ',
            imageUrl: item.imageUrl || item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
          }));

          const uniqueCategories = [...new Set(this.menuItems.map(item => item.categoryName).filter(Boolean))];
          this.categories = ['All', ...uniqueCategories as string[]];
        } else {
          // Try to treat the whole response as menu items container
          const menuItems = Object.values(response).find(val => Array.isArray(val)) as any[];

          if (menuItems) {
            this.menuItems = menuItems.map(item => ({
              ...item,
              categoryName: item.category?.name || item.categoryName || 'อื่นๆ',
              imageUrl: item.imageUrl || item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZjlmOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
            }));

            const uniqueCategories = [...new Set(this.menuItems.map(item => item.categoryName).filter(Boolean))];
            this.categories = ['All', ...uniqueCategories as string[]];
          } else {
            throw new Error('No valid menu items found in response');
          }
        }
      } else {
        throw new Error('Invalid API response format: ' + typeof response);
      }

    } catch (error) {
      console.error('Error loading menu:', error);
      this.menuError = 'ไม่สามารถโหลดเมนูได้ กรุณาลองใหม่อีกครั้ง';

      // Fallback to empty data
      this.categories = ['All'];
      this.menuItems = [];
    } finally {
      this.isLoadingMenu = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addToCart(item: MenuItem): void {
    this.cartService.addToCart({
      id: parseInt(item.id), // Convert string to number for cart
      name: item.name,
      price: item.price,
      image: item.imageUrl || '/assets/images/placeholder.jpg' // Fallback image
    });
  }

  getItemQuantityInCart(itemId: string): number {
    // Get quantity from cart service directly
    return this.cartService.getItemQuantity(parseInt(itemId));
  }

  updateItemQuantity(itemId: number, newQuantity: number): void {
    if (newQuantity <= 0) {
      this.cartService.removeFromCart(itemId);
    } else {
      this.cartService.updateQuantity(itemId, newQuantity);
    }
  }

  updateItemQuantityById(itemId: string, newQuantity: number): void {
    this.updateItemQuantity(parseInt(itemId), newQuantity);
  }

  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'All': 'fas fa-th',
      'Coffee': 'fas fa-coffee',
      'Pastries': 'fas fa-cookie-bite',
      'Food': 'fas fa-utensils',
      'Desserts': 'fas fa-ice-cream'
    };
    return icons[category] || 'fas fa-circle';
  }
}
