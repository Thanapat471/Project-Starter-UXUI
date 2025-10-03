import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Home } from './feutures/home/home';
import { Dashboard } from './feutures/dashboard/dashboard';
import { MenuManagement } from './feutures/menu-management/menu-management';
import { Login } from './feutures/login/login';
import { authGuard } from './core/guards/auth.guard';

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
			{ path: 'menu', component: MenuManagement }
		]
	}
];
