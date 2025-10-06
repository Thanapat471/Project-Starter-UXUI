import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly _isLoading = signal(false);
  private readonly _isInitialLoad = signal(true);
  private readonly _loadingMessage = signal('กำลังโหลดข้อมูล');
  private readonly _loadingSubtitle = signal('โปรดรอสักครู่...');

  // Readonly signals for components to subscribe to
  readonly isLoading = this._isLoading.asReadonly();
  readonly isInitialLoad = this._isInitialLoad.asReadonly();
  readonly loadingMessage = this._loadingMessage.asReadonly();
  readonly loadingSubtitle = this._loadingSubtitle.asReadonly();

  constructor() {
    // Check if this is a page refresh/reload
    this.checkInitialLoad();
  }

  private checkInitialLoad(): void {
    // ไม่แสดง Angular loading เพิ่มเติม ให้ initial loading ทำงานเพียงอย่างเดียว
    // เพียงแค่ set ค่าเริ่มต้น
    this._isInitialLoad.set(false);
    this._isLoading.set(false);
  }

  showLoading(message?: string, subtitle?: string): void {
    if (message) this._loadingMessage.set(message);
    if (subtitle) this._loadingSubtitle.set(subtitle);
    this._isLoading.set(true);
  }

  hideLoading(): void {
    this._isLoading.set(false);
    this._isInitialLoad.set(false);
    // Reset to default messages
    this._loadingMessage.set('กำลังโหลดข้อมูล');
    this._loadingSubtitle.set('โปรดรอสักครู่...');
  }

  // Method to manually trigger loading (if needed for other scenarios)
  setLoading(loading: boolean, message?: string, subtitle?: string): void {
    if (message) this._loadingMessage.set(message);
    if (subtitle) this._loadingSubtitle.set(subtitle);
    this._isLoading.set(loading);
  }
}
