import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CartService, CartItem } from '../../core/services/cart.service';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ToastComponent } from '../../shared/components/toast/toast.component';

interface OrderItem {
  menuItemId: number;
  quantity: number;
  options: {
    type: string;
    value: string;
  }[];
}

interface OrderRequest {
  items: OrderItem[];
  source: string;
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
  selector: 'app-simple-layout',
  imports: [RouterOutlet, CommonModule, FormsModule, NzIconModule, ToastComponent],
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

  // Order properties
  isPlacingOrder = false;
  orderNotes = '';
  sessionId = '';
  tableId = '';
  tableName = '';

  constructor(private readonly cartService: CartService, private readonly http: HttpClient) {}

  ngOnInit() {
    this.loadSessionData();

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

  updateCartItemQuantity(item: CartItem, newQuantity: number) {
    if (newQuantity <= 0) {
      this.cartService.removeFromCart(item.id, item.options);
    } else {
      this.cartService.updateQuantity(item.id, newQuantity, item.options);
    }
  }

  removeCartItem(item: CartItem) {
    this.cartService.removeFromCart(item.id, item.options);
  }

  clearCart() {
    if (confirm('คุณต้องการล้างสินค้าทั้งหมดในตะกร้าหรือไม่?')) {
      this.cartService.clearCart();
    }
  }

  private loadSessionData(): void {
    this.sessionId = localStorage.getItem('customerSessionId') || '';
    this.tableId = localStorage.getItem('customerTableId') || '';
    this.tableName = localStorage.getItem('customerTableName') || '';
  }

  async placeOrder(): Promise<void> {
    if (!this.sessionId) {
      alert('ไม่พบ Session ID กรุณาสแกน QR Code ใหม่');
      return;
    }

    if (this.cartItems.length === 0) {
      alert('กรุณาเลือกรายการอาหารก่อนทำการสั่ง');
      return;
    }

    try {
      this.isPlacingOrder = true;

      console.log('Cart items before conversion:', this.cartItems);

      // Convert cart items to order format
      const orderItems: OrderItem[] = this.cartItems.map(item => ({
        menuItemId: item.id, // Now properly as number
        quantity: item.quantity,
        options: item.options.map(option => ({
          type: option.type,
          value: option.value
        }))
      }));

      console.log('Order items after conversion:', orderItems);

      const orderRequest: OrderRequest = {
        items: orderItems,
        source: "TABLE_QR",
        sessionId: this.sessionId,
        notes: this.orderNotes.trim() || undefined
      };

      console.log('Placing order:', orderRequest);

      const response = await firstValueFrom(
        this.http.post<OrderResponse>('http://localhost:8080/api/orders', orderRequest)
      );

      console.log('Order placed successfully:', response);

      // Clear cart and close modal
      this.cartService.clearCart();
      this.closeCartModal();
      this.orderNotes = '';

      // Show success message
      alert(`สั่งอาหารสำเร็จ! หมายเลขออร์เดอร์: ${response.orderId}`);

    } catch (error: any) {
      console.error('Error placing order:', error);

      // More specific error handling
      if (error.status === 400) {
        const errorMessage = error.error?.error || 'Bad Request';
        const missingItems = error.error?.missing || [];
        if (missingItems.length > 0) {
          alert(`ไม่พบรายการอาหารเหล่านี้ในระบบ: ${missingItems.join(', ')}\nกรุณาลองรีเฟรชหน้าและเลือกรายการใหม่`);
        } else {
          alert(`เกิดข้อผิดพลาด: ${errorMessage}`);
        }
      } else {
        alert('เกิดข้อผิดพลาดในการสั่งอาหาร กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      this.isPlacingOrder = false;
    }
  }
}
