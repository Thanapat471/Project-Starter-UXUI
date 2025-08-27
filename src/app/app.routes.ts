import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { Home } from './feutures/home/home';
import { Dashboard } from './feutures/dashboard/dashboard';

export const routes: Routes = [
	{ path: '', redirectTo: 'features/home', pathMatch: 'full' },
	{
		path: 'features',
		component: MainLayout,
		children: [
			{ path: 'home', component: Home },
			{ path: 'dashboard', component: Dashboard }
		]
	}
];
