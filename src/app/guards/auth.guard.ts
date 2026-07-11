import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Allow time for Supabase session to initialize
  const session = await authService['supabase'].auth.getSession();
  
  if (session.data.session) {
    return true;
  }

  return router.parseUrl('/auth');
};