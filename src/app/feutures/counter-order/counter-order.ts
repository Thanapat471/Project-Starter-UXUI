import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { MenuService, MenuItem, MenuCategory } from '../../core/services/menu.service';
import { PaymentService } from '../../core/services/payment.service';
import { OrdersService } from '../../core/services/orders.service';
import { ReceiptService } from '../../core/services/receipt.service';
import { CheckoutRequest, CheckoutResponse } from '../../shared/models/payment.model';
import { HttpClientModule } from '@angular/common/http';
import { takeUntil } from 'rxjs/operators';

interface MenuOption {
  type: string;
  value: string;
}

interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
  options: MenuOption[];
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
    NzSpinModule,
    NzDrawerModule,
    NzRadioModule,
    NzInputNumberModule
  ],
  templateUrl: './counter-order.html',
  styleUrls: ['./counter-order.css']
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

  // Payment related properties
  paymentMethod = signal<'CASH' | 'PROMPTPAY'>('CASH');
  paidAmount = signal<number>(0);
  processingPayment = signal<boolean>(false);
  showQRCode = signal<boolean>(false);
  promptPayData = signal<any>(null);

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private menuService: MenuService,
    private paymentService: PaymentService,
    private ordersService: OrdersService,
    private receiptService: ReceiptService,
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
    this.destroy$.next();
    this.destroy$.complete();
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

  // ตัวอย่างการเพิ่มสินค้าพร้อม options ตามตัวอย่าง Request Body
  addToCartWithOptions(menuItem: MenuItem) {
    // ตัวอย่าง options สำหรับเครื่องดื่ม (ตาม Request Body)
    const options: MenuOption[] = [
      { type: 'SWEETNESS', value: 'หวานปกติ' },
      { type: 'SIZE', value: 'เล็ก' },
      { type: 'TEMPERATURE', value: 'เย็น' }
    ];

    this.addToCart(menuItem, options);
  }

  addToCart(menuItem: MenuItem, options: MenuOption[] = []) {
    const currentCart = this.cart();
    // สร้าง unique key จาก menuItemId และ options เพื่อแยกรายการที่มี options ต่างกัน
    const optionsKey = options.map(opt => `${opt.type}:${opt.value}`).sort().join('|');
    const existingItem = currentCart.find(item => 
      item.menuItemId === parseInt(menuItem.id) &&
      item.options.map(opt => `${opt.type}:${opt.value}`).sort().join('|') === optionsKey
    );

    if (existingItem) {
      const updatedCart = currentCart.map(item => 
        item.menuItemId === parseInt(menuItem.id) &&
        item.options.map(opt => `${opt.type}:${opt.value}`).sort().join('|') === optionsKey
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      );
      this.cart.set(updatedCart);
    } else {
      const newItem: CartItem = {
        menuItemId: parseInt(menuItem.id),
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        total: menuItem.price,
        options: options
      };
      this.cart.set([...currentCart, newItem]);
    }
  }

  updateCartItemQuantity(index: number, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeFromCart(index);
      return;
    }

    const updatedCart = this.cart().map((item, i) =>
      i === index
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    );
    this.cart.set(updatedCart);
  }

  removeFromCart(index: number) {
    const updatedCart = this.cart().filter((_, i) => i !== index);
    this.cart.set(updatedCart);
  }

  // Payment Methods
  setPaymentMethod(method: 'CASH' | 'PROMPTPAY') {
    this.paymentMethod.set(method);
    this.showQRCode.set(false);
    this.promptPayData.set(null);
    if (method === 'CASH') {
      this.paidAmount.set(this.cartTotal);
    }
  }

  validateCashAmount(): boolean {
    return this.paidAmount() >= this.cartTotal;
  }

  get changeAmount(): number {
    return Math.max(0, this.paidAmount() - this.cartTotal);
  }

  processCashPayment() {
    if (!this.validateCashAmount()) {
      this.message.error('จำนวนเงินที่ได้รับต้องมากกว่าหรือเท่ากับยอดรวม');
      return;
    }

    if (this.cart().length === 0) {
      this.message.error('กรุณาเพิ่มสินค้าในตะกร้า');
      return;
    }

    this.processingPayment.set(true);
    
    const checkoutRequest: CheckoutRequest = {
      paymentMethod: 'CASH',
      paidAmount: this.paidAmount(),
      items: this.cart().map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        options: item.options && item.options.length > 0 ? item.options : undefined
      })),
      notes: 'ลูกค้าจ่ายเงินสด'
    };

    this.ordersService.checkout(checkoutRequest).subscribe({
      next: (response: CheckoutResponse) => {
        const changeAmount = this.paidAmount() - response.order.total;
        let message = `ชำระเงินสำเร็จ\nหมายเลขใบเสร็จ: ${response.receipt.receiptNumber}\nเงินทอน: ${changeAmount} บาท`;
        
        this.resetCart();
        this.processingPayment.set(false);
        
        // Show success message first
        this.message.success(message);
        
        // Auto-download receipt if available with delay
        if (response.receipt?.id) {
          setTimeout(() => {
            this.autoDownloadReceipt(response.receipt!.id, response.receipt!.receiptNumber);
          }, 500);
        }
        
        // Navigate back to dashboard immediately
        console.log('Navigating to dashboard after cash payment');
        this.router.navigate(['/features/dashboard']).catch(err => {
          console.error('Navigation error after cash payment:', err);
          // Fallback: try to go to login if dashboard fails
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        console.error('Cash payment error:', error);
        this.message.error('เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
        this.processingPayment.set(false);
      }
    });
  }

  generatePromptPay() {
    if (this.cart().length === 0) {
      this.message.error('กรุณาเพิ่มสินค้าในตะกร้า');
      return;
    }

    this.processingPayment.set(true);
    
    const checkoutRequest: CheckoutRequest = {
      paymentMethod: 'PROMPTPAY',
      items: this.cart().map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        options: item.options && item.options.length > 0 ? item.options : undefined
      })),
      notes: 'ลูกค้าจ่ายผ่าน PromptPay'
    };

    this.ordersService.checkout(checkoutRequest).subscribe({
      next: (response: CheckoutResponse) => {
        console.log('PromptPay checkout response:', response);
        console.log('PromptPay data:', response.promptpay);
        
        // ตรวจสอบว่ามีข้อมูล PromptPay หรือไม่
        if (response.promptpay && response.promptpay.qrCode) {
          this.showQRCode.set(true);
          this.processingPayment.set(false);
          this.message.success(`สร้าง QR Code สำเร็จ\nจำนวนเงิน: ${response.promptpay.amount} บาท`);
          
          // ดึงข้อมูล QR Code จาก promptpay object
          this.promptPayData.set({
            paymentId: response.promptpay.paymentId,
            qrCode: response.promptpay.qrCode,
            amount: response.promptpay.amount,
            promptpayPhone: response.promptpay.promptpayPhone,
            expiresIn: response.promptpay.expiresIn,
            transactionRef: response.payment.transactionRef
          });
        } else {
          // Fallback ถ้าไม่มีข้อมูล PromptPay
          this.processingPayment.set(false);
          this.message.error('ไม่สามารถสร้าง QR Code ได้ กรุณาลองใหม่อีกครั้ง');
        }
      },
      error: (error) => {
        console.error('PromptPay generation error:', error);
        this.message.error('เกิดข้อผิดพลาดในการสร้าง QR Code กรุณาลองใหม่อีกครั้ง');
        this.processingPayment.set(false);
      }
    });
  }

  confirmPromptPayPayment() {
    if (!this.promptPayData()) {
      this.message.error('ไม่พบข้อมูลการชำระเงิน');
      return;
    }

    this.processingPayment.set(true);
    
    // สำหรับ PromptPay ใน counter จะเป็นการยืนยันโดย staff ว่าลูกค้าชำระแล้ว
    this.paymentService.confirmPayment(this.promptPayData().paymentId).subscribe({
      next: (response) => {
        let message = `ชำระเงินผ่าน PromptPay สำเร็จ\nหมายเลขใบเสร็จ: ${response.receipt?.receiptNumber || 'N/A'}`;
        
        this.resetCart();
        this.processingPayment.set(false);
        this.showQRCode.set(false);
        this.promptPayData.set(null);
        
        // Show success message first
        this.message.success(message);
        
        // Auto-download receipt if available with delay
        if (response.receipt?.id) {
          setTimeout(() => {
            this.autoDownloadReceipt(response.receipt!.id, response.receipt!.receiptNumber);
          }, 500);
        }
        
        // Navigate back to dashboard immediately
        console.log('Navigating to dashboard after PromptPay payment');
        this.router.navigate(['/features/dashboard']).catch(err => {
          console.error('Navigation error after PromptPay payment:', err);
          // Fallback: try to go to login if dashboard fails
          this.router.navigate(['/login']);
        });
      },
      error: (error) => {
        console.error('PromptPay confirmation error:', error);
        this.message.error('เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
        this.processingPayment.set(false);
      }
    });
  }

  closeQRModal() {
    this.showQRCode.set(false);
    this.promptPayData.set(null);
    this.processingPayment.set(false);
  }

  resetCart() {
    this.cart.set([]);
    this.paidAmount.set(0);
    this.paymentMethod.set('CASH');
  }

  /**
   * Automatically download receipt PDF after payment completion
   */
  private autoDownloadReceipt(receiptId: number, receiptNumber: string) {
    if (!receiptId) {
      console.log('No receipt ID available for auto-download');
      return;
    }

    console.log(`=== Auto-downloading receipt: ${receiptNumber} (ID: ${receiptId}) ===`);
    console.log('API URL will be:', `http://localhost:8080/api/receipts/${receiptId}/pdf`);

    this.receiptService.downloadReceiptPDF(receiptId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          console.log('✅ Receipt blob received successfully:', {
            size: blob.size,
            type: blob.type,
            receiptNumber: receiptNumber
          });

          if (blob.size === 0) {
            console.error('❌ Received empty blob');
            this.message.error('ไฟล์ใบเสร็จว่าง กรุณาติดต่อผู้ดูแลระบบ');
            return;
          }

          try {
            console.log('🔄 Attempting to create download...');

            // Create blob URL
            const blobUrl = window.URL.createObjectURL(blob);
            console.log('✅ Blob URL created:', blobUrl);

            // Create download link
            const downloadLink = document.createElement('a');
            downloadLink.href = blobUrl;
            downloadLink.download = `${receiptNumber}.pdf`;
            downloadLink.style.display = 'none';
            downloadLink.target = '_blank';

            // Add explicit mime type
            downloadLink.type = 'application/pdf';

            console.log('🔄 Adding link to DOM and triggering click...');

            // Add to DOM
            document.body.appendChild(downloadLink);

            // Create and dispatch click event manually for better browser compatibility
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            });

            downloadLink.dispatchEvent(clickEvent);

            console.log('✅ Download click event dispatched');

            // Cleanup after a delay
            setTimeout(() => {
              try {
                document.body.removeChild(downloadLink);
                window.URL.revokeObjectURL(blobUrl);
                console.log('✅ Cleanup completed for:', receiptNumber);
              } catch (cleanupError) {
                console.warn('⚠️ Cleanup error (non-critical):', cleanupError);
              }
            }, 1000);

          } catch (error) {
            console.error('❌ Download creation failed:', error);

            // Fallback: Open in new tab
            try {
              console.log('🔄 Trying fallback: Open in new tab...');
              const blobUrl = window.URL.createObjectURL(blob);
              const newTab = window.open(blobUrl, '_blank');

              if (newTab) {
                console.log('✅ Opened receipt in new tab');
                // Auto-cleanup URL after 5 seconds
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);
              } else {
                throw new Error('Failed to open new tab');
              }
            } catch (fallbackError) {
              console.error('❌ All download methods failed:', fallbackError);
              this.message.error('ไม่สามารถดาวน์โหลดใบเสร็จได้ กรุณาลองใหม่อีกครั้ง');
            }
          }
        },
        error: (error) => {
          console.error('❌ Receipt download failed:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          
          let errorMessage = 'เกิดข้อผิดพลาดในการดาวน์โหลดใบเสร็จ';
          if (error.status === 404) {
            errorMessage = 'ไม่พบไฟล์ใบเสร็จ';
          } else if (error.status === 500) {
            errorMessage = 'เซิร์ฟเวอร์มีปัญหา กรุณาลองใหม่ภายหลัง';
          }
          
          this.message.error(errorMessage);
        }
      });
  }

  goBack() {
    console.log('Navigating back to dashboard');
    this.router.navigate(['/features/dashboard']).catch(err => {
      console.error('Navigation error:', err);
      // Fallback: try to go to login if dashboard fails
      this.router.navigate(['/login']);
    });
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300&h=200&fit=crop';
  }
}