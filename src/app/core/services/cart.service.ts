import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  public cartItems$ = this.cartItems.asObservable();

  private cartCount = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCount.asObservable();

  private cartTotal = new BehaviorSubject<number>(0);
  public cartTotal$ = this.cartTotal.asObservable();

  constructor() {}

  addToCart(item: { id: number; name: string; price: number; image: string }): void {
    const currentItems = this.cartItems.value;
    const existingItem = currentItems.find(cartItem => cartItem.id === item.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      currentItems.push({
        ...item,
        quantity: 1
      });
    }

    this.updateCart(currentItems);
  }

  removeFromCart(itemId: number): void {
    const currentItems = this.cartItems.value.filter(item => item.id !== itemId);
    this.updateCart(currentItems);
  }

  updateQuantity(itemId: number, quantity: number): void {
    const currentItems = this.cartItems.value;
    const item = currentItems.find(cartItem => cartItem.id === itemId);

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        this.updateCart(currentItems);
      }
    }
  }

  clearCart(): void {
    this.updateCart([]);
  }

  private updateCart(items: CartItem[]): void {
    this.cartItems.next(items);
    this.cartCount.next(items.reduce((total, item) => total + item.quantity, 0));
    this.cartTotal.next(items.reduce((total, item) => total + (item.price * item.quantity), 0));
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

  getItemQuantity(itemId: number): number {
    const item = this.cartItems.value.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  }
}
