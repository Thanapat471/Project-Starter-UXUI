import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';

import { OrderDto, OrderStatus, OrdersService } from '../../core/services/orders.service';
import { Order } from '../../shared/models/menu.model';
import { ToastService } from '../../core/services/toast.service';

interface DashboardOrder {
  id: string;
  code: string;
  status: OrderStatus;
  statusLabel: string;
  statusClass: string;
  totalAmount: number;
  tableLabel: string | null;
  hasAssignedTable: boolean;
  note: string | null;
  itemsSummary: string;
  displayTime: Date;
}

interface MetricCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: 'orange' | 'brown' | 'green' | 'coffee';
  value: number | string;
  format?: 'currency';
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, NzIconModule, NzButtonModule, NzSkeletonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  private readonly ordersService = inject(OrdersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private readonly statusMeta: Record<OrderStatus, { label: string; className: string }> = {
    PENDING: { label: 'รอดำเนินการ', className: 'status--warning' },
    IN_PROGRESS: { label: 'กำลังดำเนินการ', className: 'status--warning' },
    READY: { label: 'พร้อมเสิร์ฟ', className: 'status--success' },
    SERVED: { label: 'เสิร์ฟแล้ว', className: 'status--neutral' }
  };

  private readonly newStatusMapping: Record<string, OrderStatus> = {
    'PENDING': 'PENDING',
    'CONFIRMED': 'IN_PROGRESS',
    'PREPARING': 'IN_PROGRESS',
    'READY': 'READY',
    'DELIVERED': 'SERVED',
    'CANCELLED': 'SERVED'
  };

  private readonly tablesTotal = 8;
  private readonly menuCount = 15;

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly orders = signal<DashboardOrder[]>([]);

  private readonly defaultItemsToShow = 5;
  private readonly loadMoreStep = 5;

  readonly itemsToShow = signal(this.defaultItemsToShow);
  readonly displayedOrders = computed(() => {
    const limit = this.itemsToShow();
    return this.orders().slice(0, limit);
  });
  readonly canShowMore = computed(() => this.orders().length > this.itemsToShow());
  readonly showResetButton = computed(() => {
    const total = this.orders().length;
    return total > this.defaultItemsToShow && this.itemsToShow() >= total;
  });

  readonly ordersCount = computed(() => this.orders().length);

  readonly metrics = computed<MetricCard[]>(() => {
    const orders = this.orders();
    const tablesInUse = orders.filter(order => order.hasAssignedTable).length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    return [
      {
        id: 'orders',
        title: 'ออเดอร์ที่ใช้งาน',
        description: 'ออเดอร์ที่กำลังดำเนินการ',
        icon: 'carry-out',
        accent: 'orange',
        value: this.ordersCount()
      },
      {
        id: 'tables',
        title: 'โต๊ะที่ใช้งาน',
        description: 'โต๊ะทั้งหมด',
        icon: 'team',
        accent: 'brown',
        value: `${tablesInUse}/${this.tablesTotal}`
      },
      {
        id: 'sales',
        title: 'ยอดขายวันนี้',
        description: 'จากออเดอร์ทั้งหมด',
        icon: 'rise',
        accent: 'green',
        value: totalRevenue,
        format: 'currency'
      },
      {
        id: 'menus',
        title: 'เมนูทั้งหมด',
        description: 'รายการเมนู',
        icon: 'coffee',
        accent: 'coffee',
        value: this.menuCount
      }
    ];
  });

  constructor() {
    this.fetchOrders();
  }

  reload(): void {
    this.fetchOrders();
  }

  private fetchOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ordersService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: OrderDto[]) => {
          const mapped = response.map((order: OrderDto) => this.mapOrder(order));
          this.orders.set(mapped);
          const resetCount = Math.min(this.defaultItemsToShow, mapped.length || this.defaultItemsToShow);
          this.itemsToShow.set(resetCount > 0 ? resetCount : this.defaultItemsToShow);
          this.loading.set(false);
        },
        error: (error: any) => {
          const message =
            error.status === 0
              ? 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
              : 'เกิดข้อผิดพลาดในการดึงข้อมูลออเดอร์';
          this.error.set(message);
          this.loading.set(false);
        }
      });
  }

  private mapOrder(order: any): DashboardOrder {
    // Map new API status to existing dashboard status
    const mappedStatus = this.newStatusMapping[order.status] || 'PENDING';
    const metadata = this.statusMeta[mappedStatus];

    // Map orderItems to items summary
    const itemsSummary = order.orderItems
      ? order.orderItems
          .map((item: any) => `${item.menuItem?.name ?? 'เมนู'} x${item.quantity}`)
          .join(', ')
      : 'ไม่มีรายการเมนู';

    const hasAssignedTable = Boolean(order.table);
    const tableIdentifier = order.table?.name ?? order.table?.code ?? (order.table?.id != null ? String(order.table.id) : null);
    const tableLabel = hasAssignedTable
      ? tableIdentifier
        ? `โต๊ะ ${tableIdentifier}`
        : null
      : order.source === 'COUNTER'
        ? 'รับที่เคาน์เตอร์'
        : null;

    return {
      id: String(order.id),
      code: `#ord${order.id}`,
      status: mappedStatus,
      statusLabel: metadata.label,
      statusClass: metadata.className,
      totalAmount: order.totalAmount,
      tableLabel,
      hasAssignedTable,
      note: order.notes ?? null,
      itemsSummary: itemsSummary || 'ไม่มีรายการเมนู',
      displayTime: new Date(order.createdAt)
    };
  }

  navigateToCounterOrder(): void {
    this.router.navigate(['/features/counter-order']);
  }

  loadMoreOrders(): void {
    const nextCount = this.itemsToShow() + this.loadMoreStep;
    this.itemsToShow.set(Math.min(nextCount, this.orders().length));
  }

  resetOrdersList(): void {
    const total = this.orders().length;
    const baseline = Math.min(this.defaultItemsToShow, total || this.defaultItemsToShow);
    this.itemsToShow.set(baseline > 0 ? baseline : this.defaultItemsToShow);
  }
}
