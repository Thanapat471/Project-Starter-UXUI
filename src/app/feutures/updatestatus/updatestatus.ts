import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdersService } from '../../core/services/orders.service';
import { ToastService } from '../../core/services/toast.service';

type StatusFlow = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'CANCELLED';

// Match the actual API response structure
interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  menuItem: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  options: {
    id: number;
    menuOptionId: number;
    optionName: string;
    optionType: string;
    selectedValue: string;
    additionalPrice: number;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface OrderResponse {
  id: string;
  status: StatusFlow;
  totalAmount: number;
  source: 'COUNTER' | 'TABLE_QR';
  notes: string | null;
  table: {
    id: string;
    code: string;
    name: string;
  } | null;
  sessionId?: string;
  orderItems?: OrderItem[];
  createdAt: string;
  updatedAt: string;
  isUpdating?: boolean;
}

@Component({
  selector: 'app-updatestatus',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './updatestatus.html',
  styleUrl: './updatestatus.css'
})
export class Updatestatus implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly orders = signal<OrderResponse[]>([]);
  readonly selectedFilter = signal<'ALL' | StatusFlow>('ALL');

  // Status configuration
  readonly statusConfig = {
    PENDING: {
      label: 'รอทำ',
      icon: 'clock-circle',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      next: 'IN_PROGRESS' as StatusFlow
    },
    IN_PROGRESS: {
      label: 'กำลังทำ',
      icon: 'fire',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      next: 'READY' as StatusFlow
    },
    READY: {
      label: 'เสร็จพร้อมเสิร์ฟ',
      icon: 'check-circle',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      next: 'SERVED' as StatusFlow
    },
    SERVED: {
      label: 'เสิร์ฟแล้ว',
      icon: 'check',
      color: '#6b7280',
      bgColor: 'rgba(107, 114, 128, 0.1)',
      next: null
    },
    CANCELLED: {
      label: 'ยกเลิก',
      icon: 'close-circle',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
      next: null
    }
  };

  readonly filteredOrders = computed(() => {
    const filter = this.selectedFilter();
    const allOrders = this.orders();

    if (filter === 'ALL') {
      return allOrders;
    }

    return allOrders.filter(order => order.status === filter);
  });

  readonly statusCounts = computed(() => {
    const allOrders = this.orders();
    return {
      ALL: allOrders.length,
      PENDING: allOrders.filter(o => o.status === 'PENDING').length,
      IN_PROGRESS: allOrders.filter(o => o.status === 'IN_PROGRESS').length,
      READY: allOrders.filter(o => o.status === 'READY').length,
      SERVED: allOrders.filter(o => o.status === 'SERVED').length,
      CANCELLED: 0 // Backend doesn't support CANCELLED yet
    };
  });

  ngOnInit(): void {
    this.loadOrders();

    // Auto refresh every 30 seconds
    setInterval(() => {
      this.loadOrders(true);
    }, 30000);
  }

  loadOrders(silent = false): void {
    if (!silent) {
      this.loading.set(true);
    }

    this.ordersService.getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders: any[]) => {
          // Map the response to our OrderResponse type
          const mappedOrders: OrderResponse[] = orders.map(o => ({
            id: String(o.id),
            status: o.status,
            totalAmount: o.totalAmount,
            source: o.source,
            notes: o.notes,
            table: o.table,
            sessionId: o.sessionId,
            orderItems: o.orderItems,
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
            isUpdating: false
          }));
          this.orders.set(mappedOrders);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Failed to load orders:', error);
          this.toast.error('ไม่สามารถโหลดรายการออเดอร์ได้');
          this.loading.set(false);
        }
      });
  }

  updateStatus(order: OrderResponse): void {
    const currentStatus = order.status;
    const config = this.statusConfig[currentStatus];

    if (!config.next) {
      this.toast.info('ออเดอร์นี้เสร็จสิ้นแล้ว');
      return;
    }

    // Mark as updating
    const updatedOrders = this.orders().map(o =>
      o.id === order.id ? { ...o, isUpdating: true } : o
    );
    this.orders.set(updatedOrders);

    this.ordersService.updateOrderStatus(Number(order.id), config.next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedOrder: any) => {
          // Reload orders to get fresh data
          this.loadOrders(true);
          
          const nextStatus = config.next;
          if (nextStatus) {
            const nextLabel = this.statusConfig[nextStatus].label;
            this.toast.success(`เปลี่ยนสถานะเป็น "${nextLabel}" เรียบร้อยแล้ว`);
          }
        },
        error: (error) => {
          console.error('Failed to update status:', error);
          this.toast.error('ไม่สามารถเปลี่ยนสถานะได้');

          // Remove updating state
          const revertOrders = this.orders().map(o =>
            o.id === order.id ? { ...o, isUpdating: false } : o
          );
          this.orders.set(revertOrders);
        }
      });
  }  setFilter(filter: 'ALL' | StatusFlow): void {
    this.selectedFilter.set(filter);
  }

  getStatusConfig(status: string) {
    return this.statusConfig[status as StatusFlow] || this.statusConfig.PENDING;
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByOrderId(_index: number, order: OrderResponse): string {
    return order.id;
  }
}

