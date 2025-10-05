import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CartService, CartItem } from '../../core/services/cart.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-simple-layout',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './simple-layout.html',
  styleUrls: ['./simple-layout.css']
})
export class SimpleLayout implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  // Cart properties
  cartItems: CartItem[] = [];
  cartCount = 0;
  cartTotal = 0;
  showCartModal = false;

  constructor(private readonly cartService: CartService) {}

  ngOnInit() {
    // Subscribe to cart updates
    this.cartService.cartItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.cartItems = items;
        this.cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
        this.cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      });

    // Listen for custom cart open event
    window.addEventListener('openCart', () => {
      this.openCartModal();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openCartModal() {
    this.showCartModal = true;
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeCartModal() {
    this.showCartModal = false;
    document.body.style.overflow = 'auto'; // Restore scrolling
  }

  updateCartItemQuantity(itemId: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.cartService.removeFromCart(itemId);
    } else {
      this.cartService.updateQuantity(itemId, newQuantity);
    }
  }

  clearCart() {
    if (confirm('คุณต้องการล้างสินค้าทั้งหมดในตะกร้าหรือไม่?')) {
      this.cartService.clearCart();
    }
  }
}
