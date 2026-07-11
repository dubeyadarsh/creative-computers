import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  
  // Reactive signals for modern Angular state management
  currentUser = signal<User | null>(null);
  currentSession = signal<Session | null>(null);
  userProfile = signal<any | null>(null);

  constructor(private router: Router) {
    // Replace with your actual environment variables
    const supabaseUrl = import.meta.env['VITE_PUBLIC_SUPABASE_URL'] || '';
    const supabaseKey = import.meta.env['VITE_SUPABASE_ANON_KEY'] || '';
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initializeAuth();
  }

  private async initializeAuth() {
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user || null);
      if (session?.user) {
        this.fetchProfile(session.user.id);
      } else {
        this.userProfile.set(null);
      }
    });
  }

  async fetchProfile(userId: string) {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    this.userProfile.set(data);
  }

  async signUp(email: string, password: string, fullName: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  async signInWithGoogle() {
    return this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/account`
      }
    });
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth']);
  }
  
  // Utility for API calls requiring a token
  async getAuthToken(): Promise<string | null> {
    const session = this.currentSession();
    return session?.access_token || null;
  }
}