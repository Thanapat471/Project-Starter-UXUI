import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        *ngFor="let toast of toasts; trackBy: trackByToastId"
        class="toast-container animate-slide-in"
        [ngClass]="{
          'animate-slide-out': toast.removing
        }"
      >
        <div
          class="flex items-center p-4 mb-4 text-sm rounded-lg shadow-lg min-w-80 max-w-md"
          [ngClass]="{
            'bg-green-50 text-green-800 border border-green-300': toast.type === 'success',
            'bg-red-50 text-red-800 border border-red-300': toast.type === 'error',
            'bg-blue-50 text-blue-800 border border-blue-300': toast.type === 'info',
            'bg-yellow-50 text-yellow-800 border border-yellow-300': toast.type === 'warning'
          }"
          role="alert"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 mr-3">
            <svg
              *ngIf="toast.type === 'success'"
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              *ngIf="toast.type === 'error'"
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              *ngIf="toast.type === 'info'"
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            <svg
              *ngIf="toast.type === 'warning'"
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>

          <!-- Message -->
          <div class="flex-1 text-sm font-medium">
            {{ toast.message }}
          </div>

          <!-- Close button -->
          <button
            type="button"
            class="ml-3 -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-gray-200 focus:ring-2 focus:ring-gray-300"
            [ngClass]="{
              'text-green-500 hover:bg-green-200 focus:ring-green-400': toast.type === 'success',
              'text-red-500 hover:bg-red-200 focus:ring-red-400': toast.type === 'error',
              'text-blue-500 hover:bg-blue-200 focus:ring-blue-400': toast.type === 'info',
              'text-yellow-500 hover:bg-yellow-200 focus:ring-yellow-400': toast.type === 'warning'
            }"
            (click)="removeToast(toast.id)"
            aria-label="Close"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }

    .animate-slide-out {
      animation: slideOut 0.3s ease-in forwards;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }

    .toast-container {
      transition: all 0.3s ease;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly toastService = inject(ToastService);

  toasts: (Toast & { removing?: boolean })[] = [];

  ngOnInit(): void {
    this.toastService.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toasts => {
        this.toasts = toasts.map(toast => ({ ...toast, removing: false }));
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeToast(id: string): void {
    // Add removing animation
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      toast.removing = true;
      setTimeout(() => {
        this.toastService.remove(id);
      }, 300);
    }
  }

  trackByToastId(index: number, toast: Toast): string {
    return toast.id;
  }
}
