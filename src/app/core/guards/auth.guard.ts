import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  const redirectUrl = state.url && state.url !== '/login' ? state.url : undefined;
  return router.createUrlTree(['/login'], redirectUrl ? { queryParams: { redirect: redirectUrl } } : undefined);
};
