import { Component, OnDestroy, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';
import { ToastComponent } from '../../shared/components/toast/toast.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Navbar, Sidebar, ToastComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnDestroy {
  private readonly mobileQuery = '(max-width: 860px)';
  private readonly tabletQuery = '(max-width: 1024px)';
  private readonly smallMobileQuery = '(max-width: 480px)';
  private readonly resizeListener = typeof window !== 'undefined' ? () => this.handleViewportChange() : undefined;

  readonly isMobile = signal(this.isMobileViewport());
  readonly isTablet = signal(this.isTabletViewport());
  readonly isSmallMobile = signal(this.isSmallMobileViewport());
  readonly desktopSidebarCollapsed = signal(false);
  readonly sidebarMobileOpen = signal(false);
  readonly navbarCollapsed = computed(() =>
    this.isMobile() ? !this.sidebarMobileOpen() : this.desktopSidebarCollapsed()
  );

  constructor() {
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.addEventListener('resize', this.resizeListener);
      this.handleViewportChange();
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  handleSidebarToggle(nextCollapsed: boolean): void {
    if (this.isMobile()) {
      this.sidebarMobileOpen.set(!nextCollapsed);
    } else {
      this.desktopSidebarCollapsed.set(nextCollapsed);
    }
  }

  closeMobileSidebar(): void {
    if (this.isMobile()) {
      this.sidebarMobileOpen.set(false);
    }
  }

  private handleViewportChange(): void {
    const mobile = this.isMobileViewport();
    const tablet = this.isTabletViewport();
    const smallMobile = this.isSmallMobileViewport();
    const wasMobile = this.isMobile();

    this.isMobile.set(mobile);
    this.isTablet.set(tablet);
    this.isSmallMobile.set(smallMobile);

    if (mobile) {
      this.sidebarMobileOpen.set(false);
    }

    if (!mobile && wasMobile) {
      this.desktopSidebarCollapsed.set(false);
    }
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' ? window.matchMedia(this.mobileQuery).matches : false;
  }

  private isTabletViewport(): boolean {
    return typeof window !== 'undefined' ? window.matchMedia(this.tabletQuery).matches : false;
  }

  private isSmallMobileViewport(): boolean {
    return typeof window !== 'undefined' ? window.matchMedia(this.smallMobileQuery).matches : false;
  }
}
