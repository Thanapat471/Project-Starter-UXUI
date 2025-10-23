import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, NzMenuModule, NzIconModule, NzButtonModule, NzDividerModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  @Input({ required: true }) collapsed = false;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly items: SidebarItem[] = [
    {
      label: 'แดชบอร์ด',
      icon: 'appstore',
      route: '/features/dashboard'
    },
    {
      label: 'จัดการคำสั่งซื้อ',
      icon: 'shopping-cart',
      route: '/features/counter-order'
    },
    {
      label: 'จัดการเมนู',
      icon: 'coffee',
      route: '/features/menu'
    },
    {
      label: 'จัดการโต๊ะ',
      icon: 'table',
      route: '/features/table'
    },
     {
      label: 'อัปเดตสถานะ',
      icon: 'reload',
      route: '/features/update-status'
    },
    {
      label: 'ชำระเงิน',
      icon: 'dollar',
      route: '/features/payment'
    }

  ];

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
