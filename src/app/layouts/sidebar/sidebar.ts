import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';

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

  readonly items: SidebarItem[] = [
    {
      label: 'หน้าแรก',
      icon: 'home',
      route: '/features/home'
    },
    {
      label: 'แดชบอร์ด',
      icon: 'dashboard',
      route: '/features/dashboard'
    }
  ];
}
