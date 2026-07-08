import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="header-card">
        <div class="avatar">AD</div>
        <div>
          <h1 class="user-name">Adarsh Dubey</h1>
          <p class="user-email">adarsh&#64;creative.computers</p>
        </div>
      </div>

      <div class="menu-grid">
        <button class="menu-card">
          <span class="icon">📦</span>
          <div class="text-left">
            <h3>My Orders</h3>
            <p>Track, return, or buy things again</p>
          </div>
        </button>
        <button class="menu-card">
          <span class="icon">🔒</span>
          <div class="text-left">
            <h3>Security</h3>
            <p>Edit login, name, and mobile number</p>
          </div>
        </button>
        
        <button routerLink="/admin" class="menu-card admin-card">
          <span class="icon">⚡</span>
          <div class="text-left">
            <h3>Store Admin</h3>
            <p>Manage products & categories</p>
          </div>
          <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>
      
      <button class="btn-ghost logout-btn">Log Out</button>
    </div>
  `,
  styles: [`
    .page-container { padding: calc(var(--nav-top-height) + 2rem) 1.25rem 6rem; max-width: 1000px; margin: 0 auto; min-height: 100dvh;}
    
    .header-card { display: flex; align-items: center; gap: 1.5rem; background: var(--gradient-card); border-radius: var(--radius-2xl); padding: 2rem; color: white; margin-bottom: 2rem; box-shadow: var(--shadow-lg); }
    .avatar { width: 64px; height: 64px; background: var(--gradient-brand); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; font-family: var(--font-display); box-shadow: 0 0 0 4px rgba(255,255,255,0.1); }
    .user-name { font-family: var(--font-display); font-size: var(--text-2xl); margin: 0 0 0.25rem; }
    .user-email { color: var(--neutral-400); font-size: var(--text-sm); margin: 0; }

    .menu-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 3rem; }
    .menu-card { position: relative; display: flex; align-items: center; gap: 1.25rem; background: var(--neutral-0); border: 1px solid var(--neutral-200); padding: 1.5rem; border-radius: var(--radius-xl); cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); width: 100%; text-decoration: none;}
    .menu-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--brand-200); }
    
    /* Highlight the Admin Card subtly */
    .admin-card { border-color: var(--brand-200); background: var(--brand-50); }
    .admin-card .arrow { position: absolute; right: 1.5rem; width: 20px; height: 20px; color: var(--brand-500); }

    .icon { font-size: 2rem; }
    .text-left { text-align: left; }
    .text-left h3 { margin: 0 0 0.25rem; font-size: var(--text-md); color: var(--neutral-900); font-weight: 700; }
    .text-left p { margin: 0; font-size: var(--text-xs); color: var(--neutral-500); }
    .logout-btn { width: 100%; justify-content: center; color: #ef4444; border: 1px solid #fee2e2; }

    @media (min-width: 1024px) {
      .menu-grid { grid-template-columns: repeat(3, 1fr); }
      .logout-btn { width: auto; min-width: 200px; float: right; }
    }
  `]
})
export default class AccountPage {}