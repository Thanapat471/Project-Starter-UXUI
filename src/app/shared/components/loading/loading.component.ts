import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  template: `
    <div class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <h3 class="loading-text">{{ loadingService.loadingMessage() }}</h3>
        <p class="loading-subtitle">{{ loadingService.loadingSubtitle() }}</p>
      </div>
    </div>
  `,
  styleUrl: './loading.component.css'
})
export class LoadingComponent {
  protected readonly loadingService = inject(LoadingService);
}
