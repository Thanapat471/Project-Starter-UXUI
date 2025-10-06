import { Component, signal, inject, DOCUMENT } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('project-starter-uxui');
  private readonly document = inject(DOCUMENT);

  constructor() {
    // Hide initial loading when Angular is ready
    this.hideInitialLoading();
  }

  private hideInitialLoading(): void {
    // รอให้ DOM พร้อมก่อนซ่อน initial loading
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.performHideInitialLoading();
      });
    } else {
      this.performHideInitialLoading();
    }
  }

  private performHideInitialLoading(): void {
    // ซ่อน initial loading จาก index.html หลังจากแอปโหลดเสร็จ
    const initialLoading = this.document.getElementById('initial-loading');
    if (initialLoading) {
      // รอให้ทุกอย่างพร้อมก่อนซ่อน loading
      const hideAfterLoad = () => {
        setTimeout(() => {
          initialLoading.style.transition = 'opacity 0.6s ease-out';
          initialLoading.style.opacity = '0';

          // ลบออกจาก DOM หลัง animation เสร็จ
          setTimeout(() => {
            if (initialLoading.parentNode) {
              initialLoading.remove();
            }
          }, 600);
        }, 800); // รอให้แอปโหลดเสร็จก่อน
      };

      if (document.readyState === 'complete') {
        hideAfterLoad();
      } else {
        window.addEventListener('load', hideAfterLoad, { once: true });
      }
    }
  }
}
