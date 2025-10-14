import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { OrdersService } from '../../core/services/orders.service';
import { ReceiptService } from '../../core/services/receipt.service';
import { TableService } from '../../core/services/table.service';
import { ToastService } from '../../core/services/toast.service';
import { NzIconModule } from 'ng-zorro-antd/icon';
import {
  PromptPayPaymentResponse,
  CheckoutRequest
} from '../../shared/models/payment.model';
import { Order } from '../../shared/models/menu.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-payment-management',
  standalone: true,
  imports: [CommonModule, FormsModule, NzIconModule],
  templateUrl: './payment-management.component.html',
  styleUrl: './payment-management.component.css'
})
export class PaymentManagementComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly orderService = inject(OrdersService);
  private readonly receiptService = inject(ReceiptService);
  private readonly tableService = inject(TableService);
  private readonly toastService = inject(ToastService);

  // Current order/table data
  orderId: number | null = null;
  tableId: number | null = null;
  sessionId: string | null = null;

  // Order data
  currentOrder: Order | null = null;
  pendingTables: any[] = [];

  // Payment data
  paymentMethod: 'CASH' | 'E_WALLET' = 'CASH';
  paidAmount = 0;
  promptPayData: PromptPayPaymentResponse | null = null;

  // Loading states
  loading = false;
  processingPayment = false;

  // UI state
  selectedTable: any = null;
  showQRCode = false;
  showQRModal = false;

  // QR Code countdown timer
  qrCountdownInterval: any = null;
  qrTimeRemaining = 0;
  qrTimeRemainingFormatted = '00:00';

  ngOnInit() {
    // Check route parameters
    this.route.queryParams.subscribe(params => {
      this.orderId = params['orderId'] ? Number(params['orderId']) : null;
      this.tableId = params['tableId'] ? Number(params['tableId']) : null;
      this.sessionId = params['sessionId'] || null;

      if (this.orderId) {
        this.loadOrderById();
      } else {
        this.loadPendingTables();
      }
    });
  }

  private loadOrderById() {
    if (!this.orderId) return;

    this.loading = true;
    this.orderService.getOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders: Order[]) => {
          this.currentOrder = orders.find((o: Order) => o.id === this.orderId) || null;
          this.loading = false;
          if (this.currentOrder) {
            this.paidAmount = this.currentOrder.total;
          }
        },
        error: (error: any) => {
          console.error('Failed to load order:', error);
          this.loading = false;
        }
      });
  }

  private loadPendingTables() {
    this.loading = true;
    this.paymentService.getAllTablesPendingOrders()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.pendingTables = response.tables || [];
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load pending tables:', error);
          this.loading = false;
        }
      });
  }

  selectTable(table: any) {
    this.selectedTable = table;
    this.tableId = table.tableId;
    this.sessionId = table.sessionId;

    // Calculate total amount for the table
    this.paidAmount = table.totalAmount;
  }

  generatePromptPay() {
    if (!this.validatePaymentSource()) return;

    this.processingPayment = true;

    const request = {
      orderId: this.orderId || undefined,
      tableId: this.tableId || undefined,
      sessionId: this.sessionId || undefined
    };

    this.paymentService.createPromptPayPayment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.promptPayData = response;
          this.showQRCode = true;
          this.showQRModal = true;
          this.processingPayment = false;
          this.startQRCountdown();
          this.toastService.success('QR Code PromptPay สร้างสำเร็จแล้ว');

          // Scroll to top to ensure modal is visible
          this.scrollToTop();
        },
        error: (error) => {
          console.error('Failed to generate PromptPay:', error);
          this.processingPayment = false;
          this.toastService.error('ไม่สามารถสร้าง QR Code PromptPay ได้');
        }
      });
  }

  // QR Modal Methods
  closeQRModal() {
    this.showQRModal = false;
    this.showQRCode = false;
    this.promptPayData = null;
    this.stopQRCountdown();
  }

  // QR Countdown Methods
  startQRCountdown() {
    if (this.promptPayData?.expiresIn) {
      // Parse expires in format like "15 minutes" or "900 seconds"
      const expiresText = this.promptPayData.expiresIn.toLowerCase();
      const numberRegex = /\d+/;

      if (expiresText.includes('minute')) {
        const match = numberRegex.exec(expiresText);
        const minutes = parseInt(match?.[0] || '0');
        this.qrTimeRemaining = minutes * 60;
      } else if (expiresText.includes('second')) {
        const match = numberRegex.exec(expiresText);
        this.qrTimeRemaining = parseInt(match?.[0] || '0');
      } else {
        // Default to 15 minutes
        this.qrTimeRemaining = 15 * 60;
      }

      this.updateCountdownDisplay();

      this.qrCountdownInterval = setInterval(() => {
        this.qrTimeRemaining--;
        this.updateCountdownDisplay();

        if (this.qrTimeRemaining <= 0) {
          this.stopQRCountdown();
          this.closeQRModal();
          this.toastService.warning('QR Code หมดอายุแล้ว กรุณาสร้างใหม่');
        }
      }, 1000);
    }
  }

  stopQRCountdown() {
    if (this.qrCountdownInterval) {
      clearInterval(this.qrCountdownInterval);
      this.qrCountdownInterval = null;
    }
  }

  updateCountdownDisplay() {
    const minutes = Math.floor(this.qrTimeRemaining / 60);
    const seconds = this.qrTimeRemaining % 60;
    this.qrTimeRemainingFormatted =
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  processCashPayment() {
    if (!this.validatePaymentSource() || !this.validateCashAmount()) return;

    this.processingPayment = true;

    const request = {
      orderId: this.orderId || undefined,
      tableId: this.tableId || undefined,
      sessionId: this.sessionId || undefined,
      paidAmount: this.paidAmount,
      notes: this.selectedTable ?
        `Table ${this.selectedTable.tableCode} cash payment` :
        'Counter cash payment'
    };

    this.paymentService.createCashPayment(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Cash payment successful:', response);
          this.processingPayment = false;
          this.toastService.success('ชำระเงินสดสำเร็จแล้ว');
          this.showPaymentSuccess(response);
        },
        error: (error) => {
          console.error('Failed to process cash payment:', error);
          this.processingPayment = false;
          this.toastService.error('ไม่สามารถชำระเงินสดได้');
        }
      });
  }

  confirmPromptPayPayment() {
    if (!this.promptPayData) return;

    this.processingPayment = true;

    this.paymentService.confirmPayment(this.promptPayData.paymentId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('PromptPay payment confirmed:', response);
        this.processingPayment = false;
        this.showQRCode = false;

        // Show success toast
        this.toastService.success('ชำระเงิน PromptPay สำเร็จแล้ว');

        // Auto-download receipt if available
        if (response.receipt?.id) {
          this.toastService.info(`ใบเสร็จ: ${response.receipt.receiptNumber}`);

          // Delay auto-download to ensure it happens after alert is dismissed
          setTimeout(() => {
            if (response.receipt) {
              this.autoDownloadReceipt(response.receipt.id, response.receipt.receiptNumber);
            }
          }, 500);
        }

        // Auto-close table session after successful payment
        this.autoCloseTableSession();

        this.router.navigate(['/features/dashboard']);
      },
      error: (error) => {
        console.error('Failed to confirm payment:', error);
        this.processingPayment = false;
        this.toastService.error('ไม่สามารถยืนยันการชำระเงินได้ กรุณาลองใหม่อีกครั้ง');
      }
    });
  }

  // Generic payment confirmation by payment ID
  confirmPaymentById(paymentId: number) {
    this.processingPayment = true;

    this.paymentService.confirmPayment(paymentId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('Payment confirmed:', response);
        this.processingPayment = false;

        // Show success toast with payment details
        const payment = response.payment;
        const orders = response.orders;

        this.toastService.success(`การชำระเงินสำเร็จ! จำนวนเงิน: ฿${payment.amount}`);

        if (orders && orders.length > 0) {
          this.toastService.info(`อัปเดตออเดอร์แล้ว ${orders.length} รายการ`);
        }

        // Auto-download receipt if available
        if (response.receipt?.id) {
          this.toastService.info(`ใบเสร็จ: ${response.receipt.receiptNumber}`);

          // Delay auto-download to ensure it happens after toast is dismissed
          setTimeout(() => {
            if (response.receipt) {
              this.autoDownloadReceipt(response.receipt.id, response.receipt.receiptNumber);
            }
          }, 500);
        }

        // Auto-close table session if we have sessionId
        if (this.sessionId) {
          this.autoCloseTableSession();
        }

        // Refresh pending tables list
        this.loadPendingTables();
      },
      error: (error) => {
        console.error('Failed to confirm payment:', error);
        this.processingPayment = false;

        this.toastService.error('ไม่สามารถยืนยันการชำระเงินได้');
        if (error.error?.message) {
          this.toastService.error(`ข้อผิดพลาด: ${error.error.message}`);
        }
      }
    });
  }

  private validatePaymentSource(): boolean {
    return !!(this.orderId || this.tableId || this.sessionId);
  }

  validateCashAmount(): boolean {
    const total = this.currentOrder?.total || this.selectedTable?.totalAmount || 0;
    return this.paidAmount >= total;
  }

  private showPaymentSuccess(response: any) {
    const changeAmount = response.payment.changeAmount;

    if (changeAmount > 0) {
      this.toastService.success(`ชำระเงินสำเร็จ! เงินทอน: ฿${changeAmount}`);
    } else {
      this.toastService.success('ชำระเงินสำเร็จ!');
    }

    // Auto-download receipt if available
    if (response.receipt?.id) {
      this.toastService.info(`ใบเสร็จ: ${response.receipt.receiptNumber}`);

      // Delay auto-download to ensure it happens after toast is dismissed
      setTimeout(() => {
        this.autoDownloadReceipt(response.receipt!.id, response.receipt!.receiptNumber);
      }, 500);
    }

    // Auto-close table session after successful payment
    this.autoCloseTableSession();

    this.router.navigate(['/features/dashboard']);
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
            this.toastService.error('ไฟล์ใบเสร็จว่าง กรุณาติดต่อผู้ดูแลระบบ');
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
              this.toastService.error(`ไม่สามารถดาวน์โหลดใบเสร็จ ${receiptNumber} ได้ กรุณาดาวน์โหลดจากหน้าประวัติ`);
            }
          }
        },
        error: (error) => {
          console.error('❌ Failed to fetch receipt blob:', error);
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            url: error.url
          });
          this.toastService.error('เกิดข้อผิดพลาดในการดาวน์โหลดใบเสร็จ กรุณาลองใหม่อีกครั้ง');
        }
      });
  }

  /**
   * Automatically close table session after payment completion
   * This makes the table available for new customers
   */
  private autoCloseTableSession() {
    if (!this.sessionId) {
      console.log('No session ID available for auto-close');
      return;
    }

    console.log(`Auto-closing table session: ${this.sessionId}`);

    this.tableService.closeSession(this.sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Table session closed successfully:', response);
        },
        error: (error) => {
          console.error('Failed to close table session:', error);
          // Don't show error to user as payment was successful
          // This is background cleanup
        }
      });
  }

  // Counter Checkout (one-step order + payment)
  processCounterCheckout(items: any[]) {
    if (items.length === 0) return;

    this.processingPayment = true;

    const request: CheckoutRequest = {
      items: items,
      paymentMethod: this.paymentMethod,
      paidAmount: this.paymentMethod === 'CASH' ? this.paidAmount : undefined,
      notes: 'Counter order checkout'
    };

    this.paymentService.checkout(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Checkout successful:', response);
          this.processingPayment = false;

          let message = 'ชำระเงินสำเร็จ!';
          if (response.payment.changeAmount > 0) {
            message += ` เงินทอน: ฿${response.payment.changeAmount}`;
          }

          this.toastService.success(message);

          // Auto-download receipt if available
          if (response.receipt?.id) {
            this.toastService.info(`ใบเสร็จ: ${response.receipt.receiptNumber}`);

            // Delay auto-download to ensure it happens after toast is dismissed
            setTimeout(() => {
              if (response.receipt) {
                this.autoDownloadReceipt(response.receipt.id, response.receipt.receiptNumber);
              }
            }, 500);
          }

          // Auto-close table session if this was a table-based checkout
          if (this.sessionId) {
            this.autoCloseTableSession();
          }

          this.router.navigate(['/features/dashboard']);
        },
        error: (error) => {
          console.error('Checkout failed:', error);
          this.processingPayment = false;
          this.toastService.error('ไม่สามารถชำระเงินได้ กรุณาลองใหม่อีกครั้ง');
        }
      });
  }

  goBack() {
    this.router.navigate(['/features/dashboard']);
  }

  /**
   * Test method to manually trigger receipt download for debugging
   */
  testDownloadReceipt() {
    // Use receipt ID 27 (from your network request screenshot)
    const testReceiptId = 27;
    const testReceiptNumber = 'RCP-20251006-012';

    console.log('=== Manual Test Download Started ===');
    this.autoDownloadReceipt(testReceiptId, testReceiptNumber);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopQRCountdown();
  }
}
