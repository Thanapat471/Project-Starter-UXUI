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
  CashPaymentResponse,
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

  private showPaymentSuccess(response: CashPaymentResponse) {
    const changeAmount = response.payment.changeAmount;
    let message = 'Payment successful!';

    if (changeAmount > 0) {
      message += `\nChange: ฿${changeAmount}`;
    }

    alert(message);

    // Auto-close table session after successful payment
    this.autoCloseTableSession();

    this.router.navigate(['/features/dashboard']);
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

          if (response.payment.changeAmount > 0) {
            alert(`Checkout successful!\nChange: ฿${response.payment.changeAmount}`);
          } else {
            alert('Checkout successful!');
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
          alert('Checkout failed. Please try again.');
        }
      });
  }

  goBack() {
    this.router.navigate(['/features/dashboard']);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
