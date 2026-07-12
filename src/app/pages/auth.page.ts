import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

type AuthMode = 'login' | 'register' | 'otp' | 'forgot';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-layout">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>

      <div class="auth-card-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="brand-mark">CC</div>
            <h2 class="auth-title">{{ title() }}</h2>
            <p class="auth-subtitle">{{ subtitle() }}</p>
          </div>

          @if (errorMessage()) {
            <div class="alert alert-error">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              {{ errorMessage() }}
            </div>
          }

          <!-- ─────────── OTP VERIFY ─────────── -->
          @if (mode() === 'otp') {
            <form (ngSubmit)="verifyOtp()" class="auth-form">
              <div class="form-group">
                <label>Verification Code</label>
                <div class="input-wrapper">
                  <input type="text" inputmode="numeric" maxlength="6" class="luxe-input otp-input"
                    [(ngModel)]="otpCode" name="otp" required placeholder="000000" autocomplete="one-time-code">
                </div>
                <p class="hint">Enter the 6-digit code we sent to <strong>{{ email }}</strong>.</p>
              </div>

              <button type="submit" class="btn-luxe" [disabled]="isLoading()">
                <span>{{ isLoading() ? 'Verifying…' : 'Verify & Continue' }}</span>
              </button>

              <p class="auth-footer">
                Didn't get it?
                <button type="button" class="btn-link" (click)="resendOtp()" [disabled]="isLoading()">Resend code</button>
              </p>
              <p class="auth-footer">
                <button type="button" class="btn-link" (click)="setMode('login')">Back to sign in</button>
              </p>
            </form>
          }

          <!-- ─────────── FORGOT PASSWORD ─────────── -->
          @else if (mode() === 'forgot') {
            <form (ngSubmit)="sendReset()" class="auth-form">
              <div class="form-group">
                <label>Email Address</label>
                <div class="input-wrapper">
                  <input type="email" class="luxe-input" [(ngModel)]="email" name="email" required placeholder="hello@creative.computers">
                </div>
              </div>

              <button type="submit" class="btn-luxe" [disabled]="isLoading()">
                <span>{{ isLoading() ? 'Sending…' : 'Send Reset Link' }}</span>
              </button>

              <p class="auth-footer">
                <button type="button" class="btn-link" (click)="setMode('login')">Back to sign in</button>
              </p>
            </form>
          }

          <!-- ─────────── LOGIN / REGISTER ─────────── -->
          @else {
            <form (ngSubmit)="onSubmit()" class="auth-form">
              @if (mode() === 'register') {
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

              @if (mode() === 'register') {
                <div class="form-group">
                  <label>Phone Number</label>
                  <div class="input-wrapper">
                    <input type="tel" class="luxe-input" [(ngModel)]="phone" name="phone" required placeholder="+91 98765 43210">
                  </div>
                </div>
              }

              <div class="form-group">
                <div class="flex-between">
                  <label>Password</label>
                  @if (mode() === 'login') {
                    <button type="button" class="forgot-link" (click)="setMode('forgot')">Forgot Password?</button>
                  }
                </div>
                <div class="input-wrapper">
                  <input [type]="showPassword() ? 'text' : 'password'" class="luxe-input" [(ngModel)]="password" name="password" required placeholder="••••••••" minlength="6">
                  <button type="button" class="pw-toggle" (click)="showPassword.set(!showPassword())" tabindex="-1">
                    {{ showPassword() ? 'Hide' : 'Show' }}
                  </button>
                </div>
                @if (mode() === 'register') {
                  <p class="hint">At least 6 characters.</p>
                }
              </div>

              <button type="submit" class="btn-luxe" [disabled]="isLoading()">
                <span>{{ isLoading() ? 'Processing…' : (mode() === 'login' ? 'Sign In' : 'Create Account') }}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="btn-arrow"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </form>

            <div class="divider-with-text"><span>Or continue with</span></div>

            <button type="button" class="btn-google" (click)="loginWithGoogle()">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <p class="auth-footer">
              {{ mode() === 'login' ? "Don't have an account?" : 'Already have an account?' }}
              <button type="button" class="btn-link" (click)="setMode(mode() === 'login' ? 'register' : 'login')">
                {{ mode() === 'login' ? 'Sign Up' : 'Sign In' }}
              </button>
            </p>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout { position: relative; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 5rem 1rem 6rem; background-color: var(--neutral-50); overflow: hidden; }
    .glow-orb { position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0; opacity: 0.55; animation: float 10s infinite alternate ease-in-out; }
    .orb-1 { width: 380px; height: 380px; background: rgba(99, 102, 241, 0.22); top: -10%; left: -10%; }
    .orb-2 { width: 460px; height: 460px; background: rgba(168, 85, 247, 0.16); bottom: -20%; right: -10%; animation-delay: -5s; }
    @keyframes float { 0% { transform: translate(0,0) scale(1);} 100% { transform: translate(30px,30px) scale(1.1);} }

    .auth-card-wrapper { width: 100%; max-width: 440px; position: relative; z-index: 1; }
    .auth-card { background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 2.5rem 2rem; border-radius: var(--radius-2xl); box-shadow: var(--shadow-lg), 0 0 0 1px rgba(255,255,255,0.6) inset; box-sizing: border-box; }

    .auth-header { text-align: center; margin-bottom: 2rem; }
    .brand-mark { width: 52px; height: 52px; margin: 0 auto 1rem; border-radius: var(--radius-lg); background: var(--gradient-brand); color: #fff; font-family: var(--font-display); font-weight: 800; font-size: 1.25rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px -6px rgba(99,102,241,0.5); }
    .auth-title { font-family: var(--font-display); font-size: 1.65rem; font-weight: 800; color: var(--neutral-900); letter-spacing: -0.03em; margin: 0 0 0.4rem; }
    .auth-subtitle { font-size: 0.9rem; color: var(--neutral-500); line-height: 1.5; margin: 0; }

    .form-group { margin-bottom: 1.15rem; }
    .form-group label { display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--neutral-600); margin-bottom: 0.5rem; }
    .input-wrapper { position: relative; }
    .luxe-input { width: 100%; box-sizing: border-box; padding: 0.95rem 1.1rem; background: var(--neutral-0); border: 1px solid var(--neutral-200); border-radius: var(--radius-md); font-size: 0.95rem; font-family: var(--font-body); color: var(--neutral-900); transition: all 0.25s ease; }
    .luxe-input:focus { outline: none; border-color: var(--brand-400); box-shadow: 0 0 0 4px rgba(99,102,241,0.12); background: #fff; }
    .luxe-input::placeholder { color: var(--neutral-400); }
    .otp-input { text-align: center; letter-spacing: 0.5em; font-size: 1.4rem; font-weight: 700; padding-left: 0.5em; }
    .pw-toggle { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--brand-600); font-weight: 700; font-size: 0.75rem; cursor: pointer; }
    .hint { font-size: 0.75rem; color: var(--neutral-500); margin: 0.5rem 0 0; }

    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .forgot-link { background: none; border: none; font-size: 0.72rem; font-weight: 700; color: var(--brand-600); cursor: pointer; text-transform: uppercase; letter-spacing: 0.04em; }
    .forgot-link:hover { color: var(--brand-800); }

    .btn-luxe { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; padding: 1rem; margin-top: 0.5rem; background: var(--neutral-900); color: #fff; font-family: var(--font-display); font-size: 0.95rem; font-weight: 700; border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.25s ease; box-shadow: 0 8px 16px -4px rgba(15,23,42,0.2); }
    .btn-luxe:hover:not(:disabled) { background: var(--brand-600); transform: translateY(-2px); box-shadow: 0 12px 20px -4px rgba(99,102,241,0.35); }
    .btn-luxe:disabled { background: var(--neutral-200); color: var(--neutral-400); cursor: not-allowed; box-shadow: none; }
    .btn-arrow { width: 18px; height: 18px; transition: transform 0.25s; }
    .btn-luxe:hover:not(:disabled) .btn-arrow { transform: translateX(4px); }

    .divider-with-text { display: flex; align-items: center; text-align: center; margin: 1.75rem 0; color: var(--neutral-400); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .divider-with-text::before, .divider-with-text::after { content: ''; flex: 1; border-bottom: 1px solid var(--neutral-200); }
    .divider-with-text span { padding: 0 1rem; }

    .btn-google { display: flex; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; box-sizing: border-box; background: #fff; border: 1px solid var(--neutral-200); color: var(--neutral-900); font-weight: 700; font-family: var(--font-display); font-size: 0.95rem; padding: 1rem; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s ease; box-shadow: var(--shadow-sm); }
    .btn-google:hover { background: var(--neutral-50); box-shadow: var(--shadow-md); border-color: var(--neutral-300); transform: translateY(-1px); }

    .auth-footer { margin-top: 1.5rem; text-align: center; font-size: 0.85rem; color: var(--neutral-500); }
    .btn-link { background: none; border: none; color: var(--brand-600); font-weight: 800; font-family: inherit; font-size: 0.85rem; cursor: pointer; padding: 0 0 0 0.25rem; }
    .btn-link:hover:not(:disabled) { color: var(--brand-800); text-decoration: underline; }
    .btn-link:disabled { color: var(--neutral-400); cursor: not-allowed; }

    .alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.9rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 600; margin-bottom: 1.25rem; }
    .alert svg { width: 18px; height: 18px; flex-shrink: 0; }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }

    @media (max-width: 480px) { .auth-card { padding: 2rem 1.25rem; } }
  `]
})
export default class AuthPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  mode = signal<AuthMode>('login');
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  email = '';
  password = '';
  fullName = '';
  phone = '';
  otpCode = '';

  title = computed(() => ({
    login: 'Welcome Back',
    register: 'Create Account',
    otp: 'Verify Your Email',
    forgot: 'Reset Password',
  }[this.mode()]));

  subtitle = computed(() => ({
    login: 'Sign in to access your account.',
    register: 'Join the Creative Computers community.',
    otp: 'One quick step to secure your account.',
    forgot: "Enter your email and we'll send you a reset link.",
  }[this.mode()]));

  setMode(mode: AuthMode) {
    this.mode.set(mode);
    this.errorMessage.set('');
  }

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      if (this.mode() === 'login') {
        const { error } = await this.authService.signIn(this.email, this.password);
        if (error) throw error;
        this.notify.success('Signed in successfully!');
        this.router.navigate(['/account']);
      } else {
        const { data, error } = await this.authService.signUp(
          this.email, this.password, this.fullName, this.phone,
        );
        if (error) throw error;
        // If email confirmation is required, session is null → go to OTP step.
        if (!data.session) {
          this.setMode('otp');
          this.notify.info('We emailed you a 6-digit verification code.');
        } else {
          this.notify.success('Account created!');
          this.router.navigate(['/account']);
        }
      }
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Something went wrong. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyOtp() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const { error } = await this.authService.verifyEmailOtp(this.email, this.otpCode.trim());
      if (error) throw error;
      this.notify.success('Email verified! Welcome aboard.');
      this.router.navigate(['/account']);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Invalid or expired code.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async resendOtp() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const { error } = await this.authService.resendSignupOtp(this.email);
      if (error) throw error;
      this.notify.info('A new code is on its way.');
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Could not resend the code.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async sendReset() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const { error } = await this.authService.sendPasswordReset(this.email);
      if (error) throw error;
      this.notify.success('Reset link sent — check your inbox.');
      this.setMode('login');
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Could not send reset link.');
    } finally {
      this.isLoading.set(false);
    }
  }

  loginWithGoogle() {
    this.authService.signInWithGoogle();
  }
}
