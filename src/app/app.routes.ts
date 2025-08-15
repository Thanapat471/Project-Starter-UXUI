import { Routes } from '@angular/router';
import { Home } from './feutures/home/home';
import { Dashboard } from './feutures/dashboard/dashboard';

export const routes: Routes = [
	{
		path: '',
		component: Home
	},
	{
		path: 'dashboard',
		component: Dashboard
	}
];
