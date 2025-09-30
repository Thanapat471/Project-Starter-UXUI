import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    NzIconModule,
    NzButtonModule,
    NzBadgeModule,
    NzAvatarModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  @Input({ required: true }) collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly userName = computed(() => this.auth.getUser()?.name ?? 'Guest');

  logout(): void {
    this.auth.clearSession();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.collapsedChange.emit(!this.collapsed);
  }
}
