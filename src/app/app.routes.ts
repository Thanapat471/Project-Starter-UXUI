import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Home } from './feutures/home/home';
import { Dashboard } from './feutures/dashboard/dashboard';
import { Login } from './feutures/login/login';
import { authGuard } from './core/guards/auth.guard';
import { Table } from './feutures/table/table';
import { CustomerMenuComponent } from './feutures/customer-menu/customer-menu.component';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'login', component: Login },
	{
		path: 'features',
		component: MainLayout,
		canActivate: [authGuard],
		children: [
			{ path: 'home', component: Home },
			{ path: 'dashboard', component: Dashboard },
			{ path: 'table',component: Table },
			{ path: 'customer-menu', component: CustomerMenuComponent }
		]
	}
];
