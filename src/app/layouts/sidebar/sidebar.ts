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
      label: 'จัดการโต๊ะ',
      icon: 'coffee',
      route: '/features/table'
    },
    {
      label: 'จัดการเมนู',
      icon: 'coffee',
      route: '/features/home'
    },
{
      label: 'เมนูลูกค้า',
      icon: 'coffee',
      route: '/features/customer-menu'
    }

  ];

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }
}
