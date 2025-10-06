import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { OrdersService } from '../../core/services/orders.service';
import { ReceiptService } from '../../core/services/receipt.service';
import { TableService } from '../../core/services/table.service';
import {
  PromptPayPaymentResponse,
  CheckoutRequest
} from '../../shared/models/payment.model';
import { Order } from '../../shared/models/menu.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-payment-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          this.processingPayment = false;
        },
        error: (error) => {
          console.error('Failed to generate PromptPay:', error);
          this.processingPayment = false;
          alert('Failed to generate PromptPay QR Code');
        }
      });
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
          this.showPaymentSuccess(response);
        },
        error: (error) => {
          console.error('Failed to process cash payment:', error);
          this.processingPayment = false;
          alert('Failed to process cash payment');
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

        // Show detailed confirmation message
        const payment = response.payment;
        const orders = response.orders;

        let message = `Payment confirmed successfully!\n`;
        message += `Payment ID: ${payment.id}\n`;
        message += `Amount: ฿${payment.amount}\n`;
        message += `Status: ${payment.status}\n`;

        if (orders && orders.length > 0) {
          message += `\nOrders updated (${orders.length}):\n`;
          orders.forEach((order: any) => {
            message += `- Order ${order.id}: ${order.status}\n`;
          });
        }

        // Auto-download receipt if available
        if (response.receipt?.id) {
          message += `\nReceipt: ${response.receipt.receiptNumber}`;

          // Delay auto-download to ensure it happens after alert is dismissed
          setTimeout(() => {
            if (response.receipt) {
              this.autoDownloadReceipt(response.receipt.id, response.receipt.receiptNumber);
            }
          }, 500);
        }

        alert(message);

        // Auto-close table session after successful payment
        this.autoCloseTableSession();

        this.router.navigate(['/features/dashboard']);
      },
      error: (error) => {
        console.error('Failed to confirm payment:', error);
        this.processingPayment = false;
        alert('Failed to confirm payment. Please try again.');
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

        // Show detailed confirmation message
        const payment = response.payment;
        const orders = response.orders;

        let message = `Payment confirmed successfully!\n`;
        message += `Payment ID: ${payment.id}\n`;
        message += `Amount: ฿${payment.amount}\n`;
        message += `Status: ${payment.status}\n`;
        message += `Table ID: ${payment.tableId}\n`;

        if (orders && orders.length > 0) {
          message += `\nOrders updated (${orders.length}):\n`;
          orders.forEach((order: any) => {
            message += `- Order ${order.id}: ${order.status}\n`;
          });
        }

        // Auto-download receipt if available
        if (response.receipt?.id) {
          message += `\nReceipt: ${response.receipt.receiptNumber}`;

          // Delay auto-download to ensure it happens after alert is dismissed
          setTimeout(() => {
            if (response.receipt) {
              this.autoDownloadReceipt(response.receipt.id, response.receipt.receiptNumber);
            }
          }, 500);
        }

        alert(message);

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

        let errorMessage = 'Failed to confirm payment.';
        if (error.error?.message) {
          errorMessage += `\nError: ${error.error.message}`;
        }

        alert(errorMessage);
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
    let message = 'Payment successful!';

    if (changeAmount > 0) {
      message += `\nChange: ฿${changeAmount}`;
    }

    // Auto-download receipt if available
    if (response.receipt?.id) {
      message += `\nReceipt: ${response.receipt.receiptNumber}`;

      // Delay auto-download to ensure it happens after alert is dismissed
      setTimeout(() => {
        this.autoDownloadReceipt(response.receipt!.id, response.receipt!.receiptNumber);
      }, 500);
    }

    alert(message);

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
            alert('ไฟล์ใบเสร็จว่าง กรุณาติดต่อผู้ดูแลระบบ');
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
              alert(`ไม่สามารถดาวน์โหลดใบเสร็จ ${receiptNumber} ได้ กรุณาดาวน์โหลดจากหน้าประวัติ`);
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
          alert('เกิดข้อผิดพลาดในการดาวน์โหลดใบเสร็จ กรุณาลองใหม่อีกครั้ง');
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

          let message = 'Checkout successful!';
          if (response.payment.changeAmount > 0) {
            message += `\nChange: ฿${response.payment.changeAmount}`;
          }

          // Auto-download receipt if available
          if (response.receipt?.id) {
            message += `\nReceipt: ${response.receipt.receiptNumber}`;

            // Delay auto-download to ensure it happens after alert is dismissed
            setTimeout(() => {
              if (response.receipt) {
                this.autoDownloadReceipt(response.receipt.id, response.receipt.receiptNumber);
              }
            }, 500);
          }

          alert(message);

          // Auto-close table session if this was a table-based checkout
          if (this.sessionId) {
            this.autoCloseTableSession();
          }

          this.router.navigate(['/features/dashboard']);
        },
        error: (error) => {
          console.error('Checkout failed:', error);
          this.processingPayment = false;
          alert('Checkout failed. Please try again.');
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
  }
}
