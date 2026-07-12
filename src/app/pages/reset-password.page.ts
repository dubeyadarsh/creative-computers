import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-layout">
      <div class="glow-orb orb-1"></div>
      <div class="auth-card-wrapper">
        <div class="auth-card">
          <div class="auth-header">
            <div class="brand-mark">CC</div>
            <h2 class="auth-title">Set a New Password</h2>
            <p class="auth-subtitle">Choose a strong password for your account.</p>
          </div>

          @if (errorMessage()) {
            <div class="alert alert-error">{{ errorMessage() }}</div>
          }

          <form (ngSubmit)="submit()" class="auth-form">
            <div class="form-group">
              <label>New Password</label>
              <div class="input-wrapper">
                <input [type]="show() ? 'text' : 'password'" class="luxe-input" [(ngModel)]="password" name="password" required minlength="6" placeholder="••••••••">
                <button type="button" class="pw-toggle" (click)="show.set(!show())" tabindex="-1">{{ show() ? 'Hide' : 'Show' }}</button>
              </div>
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <div class="input-wrapper">
                <input [type]="show() ? 'text' : 'password'" class="luxe-input" [(ngModel)]="confirm" name="confirm" required minlength="6" placeholder="••••••••">
              </div>
            </div>

            <button type="submit" class="btn-luxe" [disabled]="isLoading()">
              <span>{{ isLoading() ? 'Updating…' : 'Update Password' }}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout { position: relative; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 5rem 1rem; background-color: var(--neutral-50); overflow: hidden; }
    .glow-orb { position: absolute; border-radius: 50%; filter: blur(80px); z-index: 0; opacity: 0.55; width: 400px; height: 400px; background: rgba(99,102,241,0.2); top: -10%; left: -10%; }
    .auth-card-wrapper { width: 100%; max-width: 440px; position: relative; z-index: 1; }
    .auth-card { background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); padding: 2.5rem 2rem; border-radius: var(--radius-2xl); box-shadow: var(--shadow-lg); box-sizing: border-box; }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .brand-mark { width: 52px; height: 52px; margin: 0 auto 1rem; border-radius: var(--radius-lg); background: var(--gradient-brand); color: #fff; font-weight: 800; font-size: 1.25rem; display: flex; align-items: center; justify-content: center; }
    .auth-title { font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: var(--neutral-900); margin: 0 0 0.4rem; }
    .auth-subtitle { font-size: 0.9rem; color: var(--neutral-500); margin: 0; }
    .form-group { margin-bottom: 1.15rem; }
    .form-group label { display: block; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--neutral-600); margin-bottom: 0.5rem; }
    .input-wrapper { position: relative; }
    .luxe-input { width: 100%; box-sizing: border-box; padding: 0.95rem 1.1rem; background: var(--neutral-0); border: 1px solid var(--neutral-200); border-radius: var(--radius-md); font-size: 0.95rem; color: var(--neutral-900); transition: all 0.25s ease; }
    .luxe-input:focus { outline: none; border-color: var(--brand-400); box-shadow: 0 0 0 4px rgba(99,102,241,0.12); background: #fff; }
    .pw-toggle { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--brand-600); font-weight: 700; font-size: 0.75rem; cursor: pointer; }
    .btn-luxe { display: flex; align-items: center; justify-content: center; width: 100%; padding: 1rem; margin-top: 0.5rem; background: var(--neutral-900); color: #fff; font-weight: 700; border-radius: var(--radius-md); border: none; cursor: pointer; transition: all 0.25s ease; }
    .btn-luxe:hover:not(:disabled) { background: var(--brand-600); transform: translateY(-2px); }
    .btn-luxe:disabled { background: var(--neutral-200); color: var(--neutral-400); cursor: not-allowed; }
    .alert { padding: 0.9rem 1rem; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 600; margin-bottom: 1.25rem; }
    .alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }
  `]
})
export default class ResetPasswordPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  password = '';
  confirm = '';
  show = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  async submit() {
    this.errorMessage.set('');
    if (this.password !== this.confirm) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.isLoading.set(true);
    try {
      const { error } = await this.authService.updatePassword(this.password);
      if (error) throw error;
      this.notify.success('Password updated. You can now sign in.');
      this.router.navigate(['/account']);
    } catch (err: any) {
      this.errorMessage.set(err?.message || 'Could not update password. The reset link may have expired.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
