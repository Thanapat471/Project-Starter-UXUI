import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../core/services/cart.service';
import { Subject, takeUntil } from 'rxjs';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-menu.component.html',
  styleUrl: './customer-menu.component.css'
})
export class CustomerMenuComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  categories = ['All', 'Coffee', 'Pastries', 'Food', 'Desserts'];
  selectedCategory = 'All';
  
  // Cart properties
  cartItems: CartItem[] = [];
  cartCount = 0;
  cartTotal = 0;
  showCartModal = false;

  constructor(private cartService: CartService) {}

  menuItems: MenuItem[] = [
    {
      id: 1,
      name: 'Artisanal Latte',
      description: 'Rich espresso with steamed milk and beautiful latte art',
      price: 120,
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&h=300&fit=crop',
      category: 'Coffee'
    },
    {
      id: 2,
      name: 'Chocolate Croissant',
      description: 'Fresh baked croissant filled with premium dark chocolate',
      price: 80,
      image: 'https://images.unsplash.com/photo-1555507036-ab794f575c56?w=400&h=300&fit=crop',
      category: 'Pastries'
    },
    {
      id: 3,
      name: 'Gourmet Club Sandwich',
      description: 'Triple-layer sandwich with premium meats and fresh vegetables',
      price: 180,
      image: 'https://images.unsplash.com/photo-1553909489-cd47e0ef937f?w=400&h=300&fit=crop',
      category: 'Food'
    },
    {
      id: 4,
      name: 'Chocolate Brownie',
      description: 'Rich chocolate brownie served with vanilla ice cream',
      price: 95,
      image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop',
      category: 'Desserts'
    },
    {
      id: 5,
      name: 'Cappuccino',
      description: 'Classic Italian coffee with perfectly frothed milk',
      price: 100,
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop',
      category: 'Coffee'
    },
    {
      id: 6,
      name: 'Blueberry Muffin',
      description: 'Freshly baked muffin loaded with juicy blueberries',
      price: 65,
      image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&h=300&fit=crop',
      category: 'Pastries'
    }
  ];

  get filteredItems(): MenuItem[] {
    if (this.selectedCategory === 'All') {
      return this.menuItems;
    }
    return this.menuItems.filter(item => item.category === this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  ngOnInit(): void {
    // Subscribe to cart updates
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => this.cartItems = items);

    this.cartService.cartCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.cartCount = count);

    this.cartService.cartTotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(total => this.cartTotal = total);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addToCart(item: MenuItem): void {
    this.cartService.addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image
    });
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

  // Cart modal methods
  openCartModal(): void {
    this.showCartModal = true;
  }

  closeCartModal(): void {
    this.showCartModal = false;
  }

  updateCartItemQuantity(itemId: number, quantity: number): void {
    this.cartService.updateQuantity(itemId, quantity);
  }

  removeCartItem(itemId: number): void {
    this.cartService.removeFromCart(itemId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }
}
