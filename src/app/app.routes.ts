import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Home } from './feutures/home/home';
import { Dashboard } from './feutures/dashboard/dashboard';
import { Login } from './feutures/login/login';

export const routes: Routes = [
	{ path: '', redirectTo: 'login', pathMatch: 'full' },
	{ path: 'login', component: Login },
	{
		path: 'features',
		component: MainLayout,
		children: [
			{ path: 'home', component: Home },
			{ path: 'dashboard', component: Dashboard }
		]
	}
];
