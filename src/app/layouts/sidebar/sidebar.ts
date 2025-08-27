import { Component } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [PanelMenuModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  items = [
    {
      label: 'Home',
      icon: 'pi pi-home',
      routerLink: ['/features/home']
    },
    {
      label: 'Dashboard',
      icon: 'pi pi-chart-bar',
      routerLink: ['/features/dashboard']
    }
  ];
}
