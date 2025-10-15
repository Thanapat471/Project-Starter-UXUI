import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Home } from './feutures/home/home';
import { Dashboard } from './feutures/dashboard/dashboard';
import { MenuManagement } from './feutures/menu-management/menu-management';
import { Login } from './feutures/login/login';
import { authGuard } from './core/guards/auth.guard';
import { Table } from './feutures/table/table';
import { CustomerMenuComponent } from './feutures/customer-menu/customer-menu.component';
import { QrDebugComponent } from './feutures/qr-debug/qr-debug.component';
import { SimpleLayout } from './layouts/simple-layout/simple-layout';
import { NotFound } from './feutures/not-found/not-found';
import { PaymentManagementComponent } from './feutures/payment-management/payment-management.component';
import { CounterOrderComponent } from './feutures/counter-order/counter-order';
import { Updatestatus } from './feutures/updatestatus/updatestatus';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'login', component: Login },
	{ path: 'qr-debug', component: QrDebugComponent },
	{
		path: 'features',
		component: MainLayout,
		canActivate: [authGuard],
		children: [
			{ path: 'home', component: Home },
			{ path: 'dashboard', component: Dashboard },
			{ path: 'menu', component: MenuManagement },
			{ path: 'table',component: Table },
			{ path: 'payment', component: PaymentManagementComponent },
			{ path: 'counter-order', component: CounterOrderComponent },
			{ path: 'update-status', component: Updatestatus }
		]
	},
  {
    path: 'customer',
    component: SimpleLayout,
    children: [
      { path: 'menu', component: CustomerMenuComponent }
    ]
  },
  { path: 'customer-menu', redirectTo: 'customer/menu', pathMatch: 'full' },
  { path: '**', component: NotFound }
];
