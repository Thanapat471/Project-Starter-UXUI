import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideNzConfig } from 'ng-zorro-antd/core/config';
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import {
  PlusCircleOutline,
  DownloadOutline,
  SettingOutline,
  EllipsisOutline,
  CheckOutline,
  CoffeeOutline,
  LockOutline,
  UserOutline,
  InfoCircleOutline,
  BellOutline,
  MessageOutline,
  HomeOutline,
  DashboardOutline,
  MenuFoldOutline,
  MenuUnfoldOutline
} from '@ant-design/icons-angular/icons';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { TranslationLoader } from './core/services/translation-loade';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideNzI18n(en_US),
    provideNzIcons([
      PlusCircleOutline,
      DownloadOutline,
      SettingOutline,
      EllipsisOutline,
      CheckOutline,
      CoffeeOutline,
      LockOutline,
      UserOutline,
      InfoCircleOutline,
      BellOutline,
      MessageOutline,
      HomeOutline,
      DashboardOutline,
      MenuFoldOutline,
      MenuUnfoldOutline
    ]),
    provideNzConfig({
      theme: {
        primaryColor: '#1890ff'
      }
    }),
    importProvidersFrom(
      HttpClientModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useClass: TranslationLoader,
          deps: [HttpClient]
        },
        fallbackLang: 'en'
      })
    )
  ]
};
