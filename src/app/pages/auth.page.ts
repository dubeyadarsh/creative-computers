import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-layout">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <div class="auth-card-wrapper animate-fade-in-up">
        <div class="auth-card premium-card">
          
          <!-- <div class="auth-header">
            <h2 class="auth-title">{{ isLogin() ? 'Welcome Back' : 'Create Account' }}</h2>
            <p class="auth-subtitle">
              {{ isLogin() ? 'Enter your details to access your premium workspace.' : 'Join the elite hardware community.' }}
            </p>
          </div> -->

          @if (errorMessage()) {
            <div class="alert-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {{ errorMessage() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="auth-form">
            @if (!isLogin()) {
              <div class="form-group">
                <label>Full Name</label>
                <div class="input-wrapper">
                  <input type="text" class="luxe-input" [(ngModel)]="fullName" name="fullName" required placeholder="John Doe">
                </div>
              </div>
            }

            <div class="form-group">
              <label>Email Address</label>
              <div class="input-wrapper">
                <input type="email" class="luxe-input" [(ngModel)]="email" name="email" required placeholder="hello@creative.computers">
              </div>
            </div>

            <div class="form-group">
              <div class="flex-between">
                <label>Password</label>
                @if (isLogin()) { <a href="#" class="forgot-link">Forgot Password?</a> }
              </div>
              <div class="input-wrapper">
                <input type="password" class="luxe-input" [(ngModel)]="password" name="password" required placeholder="••••••••">
              </div>
            </div>

            <button type="submit" class="btn-luxe w-full mt-4" [disabled]="isLoading()">
              <span>{{ isLoading() ? 'Processing...' : (isLogin() ? 'Sign In' : 'Create Account') }}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-arrow"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>

          <div class="divider-with-text">
            <span>Or continue with</span>
          </div>

          <button type="button" class="btn-google w-full" (click)="loginWithGoogle()">
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p class="auth-footer">
            {{ isLogin() ? "Don't have an account?" : "Already have an account?" }}
            <button type="button" class="btn-link" (click)="toggleMode()">
              {{ isLogin() ? 'Sign Up' : 'Sign In' }}
            </button>
          </p>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── Immersive Layout & Background ─── */
    .auth-layout { 
      position: relative;
      min-height: 100dvh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      padding: 6rem 1rem 2rem;
      background-color: var(--neutral-50);
      overflow: hidden;
      z-index: 1;
    }

    /* Cinematic Ambient Glows */
    .glow-orb { position: absolute; border-radius: 50%; filter: blur(80px); z-index: -1; opacity: 0.6; animation: float 10s infinite alternate ease-in-out; }
    .orb-1 { width: 400px; height: 400px; background: rgba(99, 102, 241, 0.2); top: -10%; left: -10%; }
    .orb-2 { width: 500px; height: 500px; background: rgba(168, 85, 247, 0.15); bottom: -20%; right: -10%; animation-delay: -5s; }
    
    @keyframes float {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(30px, 30px) scale(1.1); }
    }

    /* ─── Premium Card Details ─── */
    .auth-card-wrapper { width: 100%; max-width: 460px; perspective: 1000px; }
    .auth-card { 
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding: 3rem 2.5rem; 
      border-radius: var(--radius-2xl);
      box-shadow: 0 20px 40px -12px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    }

    /* ─── Typography ─── */
    .auth-header { text-align: center; margin-bottom: 2.5rem; }
    .brand-logo { font-size: 1.1rem; letter-spacing: 0.2em; display: inline-block; padding-bottom: 1.5rem;}
    .auth-title { font-size: 2rem; font-weight: 800; color: var(--neutral-900); letter-spacing: -0.03em; margin: 0 0 0.5rem; }
    .auth-subtitle { font-size: 0.95rem; color: var(--neutral-500); line-height: 1.5; margin: 0; }

    /* ─── Refined Inputs ─── */
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--neutral-600); margin-bottom: 0.5rem; }
    
    .input-wrapper { position: relative; }
    .luxe-input {
      width: 100%;
      padding: 1rem 1.25rem;
      background: var(--neutral-0);
      border: 1px solid var(--neutral-200);
      border-radius: var(--radius-md);
      font-size: 0.95rem;
      font-family: var(--font-body);
      color: var(--neutral-900);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 4px rgba(15,23,42,0.02) inset;
    }
    .luxe-input:focus {
      outline: none;
      border-color: var(--brand-400);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), 0 2px 4px rgba(15,23,42,0.02) inset;
      background: #ffffff;
    }
    .luxe-input::placeholder { color: var(--neutral-400); font-weight: 400; }

    /* ─── Action Buttons ─── */
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .forgot-link { font-size: 0.75rem; font-weight: 700; color: var(--brand-600); text-decoration: none; transition: color 0.2s; }
    .forgot-link:hover { color: var(--brand-800); }

    .btn-luxe {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      width: 100%; padding: 1.1rem; margin-top: 1.5rem;
      background: var(--neutral-900); color: white;
      font-family: var(--font-display); font-size: 0.95rem; font-weight: 700;
      border-radius: var(--radius-md); border: none; cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.2);
    }
    .btn-luxe:hover:not(:disabled) { background: var(--brand-600); transform: translateY(-2px); box-shadow: 0 12px 20px -4px rgba(99, 102, 241, 0.3); }
    .btn-luxe:active:not(:disabled) { transform: translateY(0); }
    .btn-luxe:disabled { background: var(--neutral-200); color: var(--neutral-400); cursor: not-allowed; box-shadow: none; }
    .btn-arrow { width: 18px; height: 18px; transition: transform 0.3s; }
    .btn-luxe:hover:not(:disabled) .btn-arrow { transform: translateX(4px); }

    /* ─── Google Auth ─── */
    .divider-with-text { display: flex; align-items: center; text-align: center; margin: 2rem 0; color: var(--neutral-400); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .divider-with-text::before, .divider-with-text::after { content: ''; flex: 1; border-bottom: 1px solid var(--neutral-200); }
    .divider-with-text span { padding: 0 1rem; }

    .btn-google { display: flex; align-items: center; justify-content: center; gap: 0.75rem; background: white; border: 1px solid var(--neutral-200); color: var(--neutral-900); font-weight: 700; font-family: var(--font-display); font-size: 0.95rem; padding: 1.1rem; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; box-shadow: var(--shadow-sm); width: 100%;}
    .btn-google:hover { background: var(--neutral-50); box-shadow: var(--shadow-md); border-color: var(--neutral-300); transform: translateY(-1px); }

    /* ─── Footer Link ─── */
    .auth-footer { margin-top: 2rem; text-align: center; font-size: 0.85rem; color: var(--neutral-500); }
    .btn-link { background: none; border: none; color: var(--brand-600); font-weight: 800; font-family: inherit; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 0.25rem; transition: color 0.2s; }
    .btn-link:hover { color: var(--brand-800); text-decoration: underline; }

    /* ─── Error State ─── */
    .alert-error { display: flex; align-items: center; gap: 0.5rem; background: #FEF2F2; color: #991B1B; padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; border: 1px solid #FCA5A5;}
    .alert-error svg { width: 18px; height: 18px; flex-shrink: 0; }
  `]
})
export default class AuthPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  isLogin = signal(true);
  isLoading = signal(false);
  errorMessage = signal('');

  email = '';
  password = '';
  fullName = '';

  toggleMode() {
    this.isLogin.set(!this.isLogin());
    this.errorMessage.set('');
  }

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const { error } = this.isLogin() 
        ? await this.authService.signIn(this.email, this.password)
        : await this.authService.signUp(this.email, this.password, this.fullName);

      if (error) throw error;
      
      if (!this.isLogin()) {
        this.errorMessage.set('Registration successful. Please check your email to verify.');
      } else {
        this.router.navigate(['/account']);
      }
    } catch (err: any) {
      this.errorMessage.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  loginWithGoogle() {
    this.authService.signInWithGoogle();
  }
}