import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItemOption {
  type: string; // SWEETNESS, SIZE, TEMPERATURE, TOPPING, etc.
  value: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  options: CartItemOption[];
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly CART_STORAGE_KEY = 'customerCart';

  private readonly cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  private readonly cartCount = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCount.asObservable();

  private readonly cartTotal = new BehaviorSubject<number>(0);
  public cartTotal$ = this.cartTotal.asObservable();

  constructor() {
    this.loadCartFromStorage();
  }

  addToCart(item: { id: number; name: string; price: number; image: string }, options: CartItemOption[] = []): void {
    const currentItems = this.cartItems.value;
    // Check if item with same id and same options already exists
    const existingItem = currentItems.find(cartItem =>
      cartItem.id === item.id &&
      JSON.stringify(cartItem.options) === JSON.stringify(options)
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentItems.push({
        ...item,
        quantity: 1,
        options: options
      });
    }

    this.updateCart(currentItems);
  }

  removeFromCart(itemId: number, options?: CartItemOption[]): void {
    const currentItems = this.cartItems.value;
    let filteredItems: CartItem[];

    if (options !== undefined) {
      // Remove specific item with matching ID and options
      filteredItems = currentItems.filter(item =>
        !(item.id === itemId && JSON.stringify(item.options) === JSON.stringify(options))
      );
    } else {
      // Remove all items with this ID (for backward compatibility)
      filteredItems = currentItems.filter(item => item.id !== itemId);
    }

    this.updateCart(filteredItems);
  }

  updateQuantity(itemId: number, quantity: number, options?: CartItemOption[]): void {
    const currentItems = this.cartItems.value;
    let item: CartItem | undefined;

    if (options !== undefined) {
      // Find specific item with matching ID and options
      item = currentItems.find(cartItem =>
        cartItem.id === itemId &&
        JSON.stringify(cartItem.options) === JSON.stringify(options)
      );
    } else {
      // Find first item with this ID (for backward compatibility)
      item = currentItems.find(cartItem => cartItem.id === itemId);
    }

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(itemId, options);
      } else {
        item.quantity = quantity;
        this.updateCart(currentItems);
      }
    }
  }

  clearCart(): void {
    this.updateCart([]);
  }

  clearCartStorage(): void {
    try {
      localStorage.removeItem(this.CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  }

  private updateCart(items: CartItem[]): void {
    this.cartItems.next(items);
    this.cartCount.next(items.reduce((total, item) => total + item.quantity, 0));
    this.cartTotal.next(items.reduce((total, item) => total + (item.price * item.quantity), 0));

    // Save to localStorage
    this.saveCartToStorage(items);
  }

  private saveCartToStorage(items: CartItem[]): void {
    try {
      localStorage.setItem(this.CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }

  private loadCartFromStorage(): void {
    try {
      const savedCart = localStorage.getItem(this.CART_STORAGE_KEY);
      if (savedCart) {
        const cartItems: CartItem[] = JSON.parse(savedCart);
        // Validate that the loaded data has the correct structure
        if (Array.isArray(cartItems) && this.isValidCartData(cartItems)) {
          this.cartItems.next(cartItems);
          this.cartCount.next(cartItems.reduce((total, item) => total + item.quantity, 0));
          this.cartTotal.next(cartItems.reduce((total, item) => total + (item.price * item.quantity), 0));
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      // Clear invalid data
      localStorage.removeItem(this.CART_STORAGE_KEY);
    }
  }

  private isValidCartData(items: any[]): boolean {
    return items.every(item =>
      typeof item.id === 'number' &&
      typeof item.name === 'string' &&
      typeof item.price === 'number' &&
      typeof item.quantity === 'number' &&
      Array.isArray(item.options)
    );
  }

  getCartItems(): CartItem[] {
    return this.cartItems.value;
  }

  getCartCount(): number {
    return this.cartCount.value;
  }

  getCartTotal(): number {
    return this.cartTotal.value;
  }

  getItemQuantity(itemId: number, options?: CartItemOption[]): number {
    if (options !== undefined) {
      // Get quantity of specific item with matching ID and options
      const item = this.cartItems.value.find(cartItem =>
        cartItem.id === itemId &&
        JSON.stringify(cartItem.options) === JSON.stringify(options)
      );
      return item ? item.quantity : 0;
    } else {
      // Get total quantity of all items with this ID (for backward compatibility)
      return this.cartItems.value
        .filter(cartItem => cartItem.id === itemId)
        .reduce((total, item) => total + item.quantity, 0);
    }
  }
}
