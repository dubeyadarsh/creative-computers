import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: 'user' | 'admin';
  avatar_url: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private supabase: SupabaseClient;

  // Reactive auth state
  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);
  userProfile = signal<Profile | null>(null);
  isReady = signal(false);

  isLoggedIn = computed(() => !!this.currentSession());
  isAdmin = computed(() => this.userProfile()?.role === 'admin');

  // Exposed so user-scoped data services (addresses, orders, reviews) can
  // reuse the authenticated browser client (RLS is enforced per-user).
  get client(): SupabaseClient {
    return this.supabase;
  }
  get userId(): string | null {
    return this.currentUser()?.id ?? null;
  }

  constructor() {
    const supabaseUrl = import.meta.env['VITE_PUBLIC_SUPABASE_URL'] || '';
    const supabaseKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || '';

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        // Persist the session in localStorage and auto-refresh the token so
        // the user stays logged in (session length is capped in the Supabase
        // dashboard — see supabase/auth_schema.sql notes / SETUP).
        persistSession: this.isBrowser,
        autoRefreshToken: this.isBrowser,
        detectSessionInUrl: this.isBrowser,
        storageKey: 'sc-tech-auth',
      },
    });

    if (this.isBrowser) {
      this.initializeAuth();
    } else {
      this.isReady.set(true);
    }
  }

  private async initializeAuth() {
    const { data } = await this.supabase.auth.getSession();
    await this.applySession(data.session);
    this.isReady.set(true);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.applySession(session);
    });
  }

  private async applySession(session: Session | null) {
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);
    if (session?.user) {
      await this.fetchProfile(session.user.id);
    } else {
      this.userProfile.set(null);
    }
  }

  async fetchProfile(userId: string) {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    this.userProfile.set((data as Profile) ?? null);
  }

  // ─── Registration (email + phone + password), verified via email OTP ───
  async signUp(email: string, password: string, fullName: string, phone: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: this.isBrowser ? `${window.location.origin}/account` : undefined,
      },
    });
  }

  // Verify the 6-digit code emailed after sign-up.
  async verifyEmailOtp(email: string, token: string) {
    return this.supabase.auth.verifyOtp({ email, token, type: 'signup' });
  }

  async resendSignupOtp(email: string) {
    return this.supabase.auth.resend({ type: 'signup', email });
  }

  // ─── Login ───
  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: this.isBrowser ? `${window.location.origin}/account` : undefined,
      },
    });
  }

  // ─── Forgot / reset password ───
  async sendPasswordReset(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: this.isBrowser ? `${window.location.origin}/reset-password` : undefined,
    });
  }

  async updatePassword(newPassword: string) {
    return this.supabase.auth.updateUser({ password: newPassword });
  }

  // ─── Profile ───
  async updateProfile(updates: Partial<Pick<Profile, 'full_name' | 'phone' | 'avatar_url'>>) {
    const user = this.currentUser();
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);
    if (!error) await this.fetchProfile(user.id);
    return { error };
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.userProfile.set(null);
    this.router.navigate(['/auth']);
  }

  async getSession() {
    return this.supabase.auth.getSession();
  }

  async getAuthToken(): Promise<string | null> {
    const session = this.currentSession();
    return session?.access_token ?? null;
  }
}
