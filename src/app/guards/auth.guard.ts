import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const platformId = inject(PLATFORM_ID);
  // The Supabase session is stored client-side (localStorage). On the server
  // we can't read it, so allow the render and let the client re-check.
  if (!isPlatformBrowser(platformId)) return true;

  const authService = inject(AuthService);
  const router = inject(Router);

  const { data } = await authService.getSession();
  if (data.session) {
    return true;
  }
  return router.parseUrl('/auth');
};

export const adminGuard: CanActivateFn = async () => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true;

  const authService = inject(AuthService);
  const router = inject(Router);

  const { data } = await authService.getSession();
  if (!data.session) {
    return router.parseUrl('/auth');
  }

  if (!authService.userProfile()) {
    await authService.fetchProfile(data.session.user.id);
  }

  if (authService.isAdmin()) {
    return true;
  }
  return router.parseUrl('/account');
};
