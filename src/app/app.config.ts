import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideNzConfig } from 'ng-zorro-antd/core/config';
import { provideNzI18n, en_US } from 'ng-zorro-antd/i18n';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import {
  PlusCircleOutline,
  PlusOutline,
  DownloadOutline,
  SettingOutline,
  EllipsisOutline,
  CheckOutline,
  CarryOutOutline,
  TeamOutline,
  RiseOutline,
  ClockCircleOutline,
  InboxOutline,
  LoadingOutline,
  WarningOutline,
  SearchOutline,
  EditOutline,
  DeleteOutline,
  CoffeeOutline,
  TagOutline,
  LockOutline,
  UserOutline,
  InfoCircleOutline,
  ExclamationCircleOutline,
  BellOutline,
  MessageOutline,
  HomeOutline,
  DashboardOutline,
  MenuFoldOutline,
  MenuUnfoldOutline,
  AppstoreOutline,
  TableOutline,
  ShoppingCartOutline,
  CreditCardOutline,
  LogoutOutline,
  DollarOutline,
  LeftOutline,
  ArrowLeftOutline,
  MinusOutline
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
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNzI18n(en_US),
    provideNzIcons([
      PlusCircleOutline,
      PlusOutline,
      DownloadOutline,
      SettingOutline,
      EllipsisOutline,
      CheckOutline,
      CarryOutOutline,
      TeamOutline,
      RiseOutline,
      ClockCircleOutline,
      InboxOutline,
      LoadingOutline,
      WarningOutline,
      SearchOutline,
      EditOutline,
      DeleteOutline,
      CoffeeOutline,
      TagOutline,
      LockOutline,
      UserOutline,
      InfoCircleOutline,
      ExclamationCircleOutline,
      BellOutline,
      MessageOutline,
      HomeOutline,
      DashboardOutline,
      MenuFoldOutline,
      MenuUnfoldOutline,
      AppstoreOutline,
      TableOutline,
      ShoppingCartOutline,
      CreditCardOutline,
      LogoutOutline,
      DollarOutline,
      LeftOutline,
      ArrowLeftOutline,
      MinusOutline
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
