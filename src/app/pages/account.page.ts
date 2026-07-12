import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { AddressService } from '../services/address.service';
import { OrderService } from '../services/order.service';
import { AdminService } from '../services/admin.service';
import { Address, Order } from '../services/shop.types';
import { authGuard } from '../guards/auth.guard';

export const routeMeta: RouteMeta = {
  canActivate: [authGuard],
};

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="account">
      <!-- ══════════ HERO ══════════ -->
      <header class="hero">
        <span class="hero-orb orb-a"></span>
        <span class="hero-orb orb-b"></span>

        <div class="hero-top">
          <span class="hero-greeting">{{ greeting() }}</span>
          @if (isAdmin()) {
            <span class="role-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
              Admin
            </span>
          }
        </div>

        <div class="hero-identity">
          <div class="avatar-ring">
            <div class="avatar">{{ initials() }}</div>
          </div>
          <div class="identity-text">
            <h1 class="user-name">{{ profile()?.full_name || 'Welcome back' }}</h1>
            <p class="user-email">{{ profile()?.email || user()?.email }}</p>
          </div>
        </div>

        @if (!isAdmin()) {
          <div class="hero-stats">
            <button class="stat" (click)="openPanel('orders')">
              <span class="stat-num">{{ ordersCount() }}</span>
              <span class="stat-label">Orders</span>
            </button>
            <span class="stat-divider"></span>
            <button class="stat" (click)="openPanel('address')">
              <span class="stat-num">{{ addressesCount() }}</span>
              <span class="stat-label">Addresses</span>
            </button>
            <span class="stat-divider"></span>
            <button class="stat" (click)="startEditProfile()">
              <span class="stat-num"><svg class="stat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path stroke-linecap="round" stroke-linejoin="round" d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></span>
              <span class="stat-label">Edit</span>
            </button>
          </div>
        }
      </header>

      <!-- ══════════ MENU ══════════ -->
      @if (isAdmin()) {
        <p class="section-label">Store Management</p>
        <div class="menu">
          <a routerLink="/admin" class="row" style="--i:0">
            <span class="row-ico tile-indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h10"/></svg>
            </span>
            <span class="row-text"><strong>Manage Categories</strong><small>Create & edit product categories</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </a>
          <a routerLink="/admin" class="row" style="--i:1">
            <span class="row-ico tile-violet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-14L4 7m8 4v10M4 7v10l8 4"/></svg>
            </span>
            <span class="row-text"><strong>Manage Products</strong><small>Publish products & update stock</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </a>
          <button class="row" (click)="openPanel('adminOrders')" style="--i:2">
            <span class="row-ico tile-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zM3 3h2l2.4 12.3a1 1 0 001 .7h9.2a1 1 0 001-.8L21 7H6"/></svg>
            </span>
            <span class="row-text"><strong>All Orders</strong><small>View orders & update status</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
        <p class="section-label">My Account</p>
        <div class="menu">
          <button class="row" (click)="openPanel('orders')" style="--i:0">
            <span class="row-ico tile-indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </span>
            <span class="row-text"><strong>My Orders</strong><small>Track, return, or buy again</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button class="row" (click)="startEditProfile()" style="--i:1">
            <span class="row-ico tile-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </span>
            <span class="row-text"><strong>Edit Profile</strong><small>Update your name and phone</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button class="row" (click)="openPanel('address')" style="--i:2">
            <span class="row-ico tile-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
            </span>
            <span class="row-text"><strong>Addresses</strong><small>Manage your delivery addresses</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      } @else {
        <p class="section-label">My Account</p>
        <div class="menu">
          <button class="row" (click)="openPanel('orders')" style="--i:0">
            <span class="row-ico tile-indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </span>
            <span class="row-text"><strong>My Orders</strong><small>Track, return, or buy again</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button class="row" (click)="startEditProfile()" style="--i:1">
            <span class="row-ico tile-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            </span>
            <span class="row-text"><strong>Edit Profile</strong><small>Update your name and phone</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button class="row" (click)="openPanel('address')" style="--i:2">
            <span class="row-ico tile-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
            </span>
            <span class="row-text"><strong>Addresses</strong><small>Manage your delivery addresses</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
          <button class="row" (click)="openPanel('help')" style="--i:3">
            <span class="row-ico tile-slate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </span>
            <span class="row-text"><strong>Help & Support</strong><small>FAQs and contact us</small></span>
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      }

      <button class="logout" (click)="logout()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7M13 16v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        Log Out
      </button>
    </div>

    <!-- ══════════ SLIDE-UP SHEET ══════════ -->
    @if (activePanel()) {
      <div class="sheet-backdrop" (click)="closePanel()"></div>
      <div class="sheet" role="dialog">
        <span class="sheet-grip"></span>

        @if (activePanel() === 'editProfile') {
          <h3 class="sheet-title">Edit Profile</h3>
          <div class="field">
            <label>Full Name</label>
            <input class="control" [(ngModel)]="editName" name="editName" placeholder="Your name">
          </div>
          <div class="field">
            <label>Phone Number</label>
            <input class="control" [(ngModel)]="editPhone" name="editPhone" placeholder="+91 …">
          </div>
          <div class="sheet-actions">
            <button class="btn-ghost" (click)="closePanel()">Cancel</button>
            <button class="btn-primary" (click)="saveProfile()" [disabled]="isSaving()">
              {{ isSaving() ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        }

        @else if (activePanel() === 'orders') {
          <h3 class="sheet-title">My Orders</h3>
          <div class="sheet-scroll">
            @if (ordersLoading()) {
              <p class="loading-note">Loading your orders…</p>
            } @else if (orders().length === 0) {
              <div class="empty">
                <div class="empty-ico tile-indigo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </div>
                <h3>No orders yet</h3>
                <p>When you place an order it will show up here.</p>
                <a routerLink="/shops" class="btn-primary" (click)="closePanel()">Start Shopping</a>
              </div>
            } @else {
              @for (order of orders(); track order.id) {
                <div class="order-card">
                  <div class="order-head">
                    <div>
                      <span class="order-id">#{{ order.id!.slice(0, 8) }}</span>
                      <span class="order-date">{{ orderDate(order.created_at) }}</span>
                    </div>
                    <span class="order-status status-{{ order.status }}">{{ order.status | titlecase }}</span>
                  </div>
                  @if (order.status !== 'cancelled') {
                    <div class="track">
                      @for (st of trackSteps; track st.key; let i = $index) {
                        <div class="track-step" [class.done]="statusIndex(order.status) >= i">
                          <span class="track-dot"></span>
                          <span class="track-label">{{ st.label }}</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="track track--cancelled"><span>This order was cancelled.</span></div>
                  }
                  <div class="order-items">
                    @for (it of order.order_items; track it.id) {
                      <div class="order-item">
                        <img [src]="it.image_url || 'https://placehold.co/60'" [alt]="it.name" />
                        <span class="oi-name">{{ it.name }}</span>
                        <span class="oi-qty">×{{ it.qty }}</span>
                        <span class="oi-price">₹{{ it.price * it.qty | number:'1.0-0' }}</span>
                      </div>
                    }
                  </div>
                  <div class="order-foot">
                    <span>Total</span>
                    <strong>₹{{ order.total | number:'1.0-0' }}</strong>
                  </div>
                </div>
              }
            }
          </div>
        }

        @else if (activePanel() === 'address') {
          <h3 class="sheet-title">My Addresses</h3>
          <div class="sheet-scroll">
            @if (addressesLoading()) {
              <p class="loading-note">Loading addresses…</p>
            } @else {
              @if (addresses().length === 0 && !showAddressForm()) {
                <div class="empty">
                  <div class="empty-ico tile-amber">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-6-5.686-6-10a6 6 0 1112 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
                  </div>
                  <h3>No saved addresses</h3>
                  <p>Add a delivery address to speed up checkout.</p>
                </div>
              }
              @for (addr of addresses(); track addr.id) {
                <div class="addr-card">
                  <div class="addr-main">
                    <div class="addr-name">{{ addr.full_name }} @if (addr.is_default) { <span class="chip">Default</span> }</div>
                    <div class="addr-text">{{ addr.line1 }}@if (addr.line2) {, {{ addr.line2 }}}, {{ addr.city }}, {{ addr.state }} {{ addr.postal_code }}</div>
                    <div class="addr-phone">📞 {{ addr.phone }}</div>
                  </div>
                  <div class="addr-actions">
                    @if (!addr.is_default) { <button class="link-btn" (click)="makeDefault(addr.id!)">Set default</button> }
                    <button class="link-btn danger" (click)="deleteAddress(addr.id!)">Delete</button>
                  </div>
                </div>
              }

              @if (showAddressForm()) {
                <div class="addr-form">
                  <div class="af-row">
                    <input class="control" placeholder="Full name *" [(ngModel)]="addrForm.full_name" name="af_name" />
                    <input class="control" placeholder="Phone *" [(ngModel)]="addrForm.phone" name="af_phone" />
                  </div>
                  <input class="control" placeholder="Address line 1 *" [(ngModel)]="addrForm.line1" name="af_l1" />
                  <input class="control" placeholder="Address line 2" [(ngModel)]="addrForm.line2" name="af_l2" />
                  <div class="af-row">
                    <input class="control" placeholder="City *" [(ngModel)]="addrForm.city" name="af_city" />
                    <input class="control" placeholder="State" [(ngModel)]="addrForm.state" name="af_state" />
                  </div>
                  <div class="af-row">
                    <input class="control" placeholder="Postal code *" [(ngModel)]="addrForm.postal_code" name="af_pin" />
                    <input class="control" placeholder="Country" [(ngModel)]="addrForm.country" name="af_country" />
                  </div>
                  <label class="af-default"><input type="checkbox" [(ngModel)]="addrForm.is_default" name="af_def" /> Set as default</label>
                </div>
              }
            }
          </div>
          <div class="sheet-actions">
            <button class="btn-ghost" (click)="toggleAddressForm()">{{ showAddressForm() ? 'Cancel' : '+ New address' }}</button>
            @if (showAddressForm()) {
              <button class="btn-primary" (click)="saveAddress()" [disabled]="savingAddress()">{{ savingAddress() ? 'Saving…' : 'Save' }}</button>
            } @else {
              <button class="btn-primary" (click)="closePanel()">Done</button>
            }
          </div>
        }

        @else if (activePanel() === 'help') {
          <div class="empty">
            <div class="empty-ico tile-slate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3>Help & Support</h3>
            <p>Reach us at helpdesk&#64;creativecomputersmariahu.in</p>
            <button class="btn-ghost" (click)="closePanel()">Close</button>
          </div>
        }

        @else if (activePanel() === 'adminOrders') {
          <h3 class="sheet-title">All Orders</h3>
          <div class="sheet-scroll">
            @if (adminOrdersLoading()) {
              <p class="loading-note">Loading orders…</p>
            } @else if (adminOrders().length === 0) {
              <div class="empty">
                <div class="empty-ico tile-indigo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                </div>
                <h3>No orders yet</h3>
                <p>Customer orders will appear here.</p>
              </div>
            } @else {
              @for (order of adminOrders(); track order.id) {
                <div class="order-card">
                  <div class="order-head">
                    <div>
                      <span class="order-id">#{{ order.id!.slice(0, 8) }}</span>
                      <span class="order-date">{{ orderDate(order.created_at) }}</span>
                    </div>
                    <strong>₹{{ order.total | number:'1.0-0' }}</strong>
                  </div>
                  <div class="admin-ship">
                    <strong>{{ order.ship_full_name }}</strong> · {{ order.ship_phone }}<br />
                    {{ order.ship_line1 }}@if (order.ship_line2) {, {{ order.ship_line2 }}}, {{ order.ship_city }}, {{ order.ship_state }} {{ order.ship_postal }}
                  </div>
                  <div class="order-items">
                    @for (it of order.order_items; track it.id) {
                      <div class="order-item">
                        <img [src]="it.image_url || 'https://placehold.co/60'" [alt]="it.name" />
                        <span class="oi-name">{{ it.name }}</span>
                        <span class="oi-qty">×{{ it.qty }}</span>
                        <span class="oi-price">₹{{ it.price * it.qty | number:'1.0-0' }}</span>
                      </div>
                    }
                  </div>
                  <div class="admin-status-row">
                    <label>Status</label>
                    <select class="control status-select"
                      [ngModel]="order.status"
                      (ngModelChange)="changeOrderStatus(order, $event)">
                      @for (opt of statusOptions; track opt) {
                        <option [value]="opt">{{ opt | titlecase }}</option>
                      }
                    </select>
                  </div>
                </div>
              }
            }
          </div>
          <div class="sheet-actions">
            <button class="btn-primary" (click)="closePanel()">Done</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    :host, :host *, :host *::before, :host *::after { box-sizing: border-box; }
    .account { max-width: 760px; margin: 0 auto; padding: 1.25rem 1rem 5rem; min-height: 100dvh; }

    /* ─── Hero ─── */
    .hero { position: relative; overflow: hidden; background: var(--gradient-card); color: #fff; border-radius: 26px; padding: 1.5rem 1.5rem 1.35rem; box-shadow: 0 24px 48px -18px rgba(15,23,42,0.55); animation: rise 0.6s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)) both; }
    .hero-orb { position: absolute; border-radius: 50%; filter: blur(38px); opacity: 0.55; pointer-events: none; }
    .orb-a { width: 190px; height: 190px; background: #6366f1; top: -70px; right: -40px; animation: float 9s ease-in-out infinite alternate; }
    .orb-b { width: 150px; height: 150px; background: #a855f7; bottom: -70px; left: -30px; animation: float 11s ease-in-out infinite alternate-reverse; }

    .hero-top { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.1rem; min-height: 26px; }
    .hero-greeting { font-size: 0.8rem; font-weight: 600; color: rgba(255,255,255,0.7); letter-spacing: 0.02em; }
    .role-badge { display: inline-flex; align-items: center; gap: 0.3rem; background: rgba(255,255,255,0.16); backdrop-filter: blur(6px); color: #fff; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; padding: 0.3rem 0.65rem; border-radius: var(--radius-full); border: 1px solid rgba(255,255,255,0.22); }
    .role-badge svg { width: 12px; height: 12px; }

    .hero-identity { position: relative; z-index: 1; display: flex; align-items: center; gap: 1rem; }
    .avatar-ring { padding: 3px; border-radius: 50%; background: linear-gradient(135deg, #818cf8, #e879f9); flex-shrink: 0; animation: pop 0.5s 0.15s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)) both; }
    .avatar { width: 60px; height: 60px; border-radius: 50%; background: #0f172a; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.35rem; font-weight: 800; letter-spacing: 0.02em; }
    .identity-text { min-width: 0; }
    .user-name { font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-email { color: rgba(255,255,255,0.65); font-size: 0.82rem; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .hero-stats { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-around; margin-top: 1.35rem; padding-top: 1.1rem; border-top: 1px solid rgba(255,255,255,0.12); }
    .stat { flex: 1; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.2rem; color: #fff; padding: 0.1rem; transition: transform 0.2s ease; }
    .stat:active { transform: scale(0.92); }
    .stat-num { font-family: var(--font-display); font-size: 1.15rem; font-weight: 800; line-height: 1; }
    .stat-ico { width: 18px; height: 18px; }
    .stat-label { font-size: 0.68rem; font-weight: 600; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-divider { width: 1px; height: 30px; background: rgba(255,255,255,0.12); }

    /* ─── Menu ─── */
    .section-label { font-size: 0.72rem; font-weight: 800; color: var(--neutral-400); text-transform: uppercase; letter-spacing: 0.08em; margin: 1.75rem 0.35rem 0.75rem; }
    .menu { display: flex; flex-direction: column; gap: 0.65rem; }
    .row { display: flex; align-items: center; gap: 1rem; width: 100%; text-align: left; text-decoration: none; background: var(--neutral-0); border: 1px solid var(--neutral-200); border-radius: 18px; padding: 0.9rem 1rem; cursor: pointer; box-shadow: 0 1px 2px rgba(15,23,42,0.04); transition: transform 0.2s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)), box-shadow 0.2s ease, border-color 0.2s ease; animation: rise 0.5s calc(0.1s + var(--i, 0) * 0.07s) ease both; }
    .row:hover { transform: translateY(-2px); box-shadow: 0 12px 22px -10px rgba(15,23,42,0.22); border-color: var(--brand-200); }
    .row:active { transform: scale(0.985); }
    .row-ico { width: 44px; height: 44px; border-radius: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .row-ico svg { width: 21px; height: 21px; }
    .row-text { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; flex: 1; }
    .row-text strong { font-size: 0.95rem; font-weight: 700; color: var(--neutral-900); }
    .row-text small { font-size: 0.78rem; color: var(--neutral-500); }
    .chevron { width: 18px; height: 18px; color: var(--neutral-300); flex-shrink: 0; transition: transform 0.2s ease, color 0.2s ease; }
    .row:hover .chevron { transform: translateX(3px); color: var(--brand-500); }

    /* Icon tiles */
    .tile-indigo { background: #eef2ff; color: #4f46e5; }
    .tile-violet { background: #f5f3ff; color: #7c3aed; }
    .tile-emerald { background: #ecfdf5; color: #059669; }
    .tile-amber { background: #fffbeb; color: #d97706; }
    .tile-slate { background: #f1f5f9; color: #475569; }

    /* ─── Logout ─── */
    .logout { display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; margin-top: 1.75rem; padding: 0.95rem; background: #fff; color: #ef4444; border: 1px solid #fee2e2; border-radius: 16px; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: background 0.2s ease, transform 0.15s ease; animation: rise 0.5s 0.45s ease both; }
    .logout svg { width: 18px; height: 18px; }
    .logout:hover { background: #fef2f2; }
    .logout:active { transform: scale(0.98); }

    /* ─── Slide-up sheet ─── */
    .sheet-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(2px); z-index: 200; animation: fade 0.25s ease both; }
    .sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 201; background: #fff; border-radius: 26px 26px 0 0; padding: 0.85rem 1.35rem calc(1.6rem + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -18px 40px -12px rgba(15,23,42,0.28); max-width: 620px; margin: 0 auto; animation: slideUp 0.34s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)) both; }
    .sheet-grip { display: block; width: 42px; height: 4px; border-radius: 99px; background: var(--neutral-200); margin: 0 auto 1.1rem; }
    .sheet-title { margin: 0 0 1.25rem; font-family: var(--font-display); font-size: 1.2rem; font-weight: 800; color: var(--neutral-900); }

    .field { display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 1rem; }
    .field label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--neutral-600); }
    .control { padding: 0.9rem 1rem; border: 1px solid var(--neutral-200); border-radius: 12px; font-size: 0.95rem; background: var(--neutral-50); font-family: inherit; transition: all 0.2s ease; }
    .control:focus { outline: none; border-color: var(--brand-400); background: #fff; box-shadow: 0 0 0 4px rgba(99,102,241,0.12); }
    .sheet-actions { display: flex; gap: 0.75rem; margin-top: 1.35rem; }
    .sheet-actions .btn-ghost, .sheet-actions .btn-primary { flex: 1; }

    .btn-primary { display: inline-flex; align-items: center; justify-content: center; background: var(--neutral-900); color: #fff; border: none; padding: 0.9rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; text-decoration: none; transition: background 0.2s ease, transform 0.15s ease; }
    .btn-primary:hover:not(:disabled) { background: var(--brand-600); }
    .btn-primary:active:not(:disabled) { transform: scale(0.98); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-ghost { display: inline-flex; align-items: center; justify-content: center; background: #fff; border: 1px solid var(--neutral-200); padding: 0.9rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; color: var(--neutral-700); transition: background 0.2s ease; }
    .btn-ghost:hover { background: var(--neutral-50); }

    /* ─── Orders & addresses ─── */
    .sheet-scroll { max-height: 55vh; overflow-y: auto; margin: 0 -0.35rem; padding: 0 0.35rem; }
    .loading-note { text-align: center; color: var(--neutral-500); font-size: 0.88rem; padding: 1.5rem 0; }

    .order-card { border: 1px solid var(--neutral-200); border-radius: 16px; padding: 1rem; margin-bottom: 0.85rem; }
    .order-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .order-id { font-weight: 800; font-size: 0.9rem; color: var(--neutral-900); }
    .order-date { font-size: 0.75rem; color: var(--neutral-500); margin-left: 0.5rem; }
    .order-status { font-size: 0.68rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.25rem 0.6rem; border-radius: var(--radius-full); }
    .status-placed { background: #eff6ff; color: #2563eb; }
    .status-confirmed { background: #eef2ff; color: #4f46e5; }
    .status-shipped { background: #fffbeb; color: #d97706; }
    .status-delivered { background: #ecfdf5; color: #059669; }
    .status-cancelled { background: #fef2f2; color: #dc2626; }
    .order-items { display: flex; flex-direction: column; gap: 0.5rem; }
    .order-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.82rem; }
    .order-item img { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; background: var(--neutral-50); }
    .oi-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--neutral-700); }
    .oi-qty { color: var(--neutral-400); }
    .oi-price { font-weight: 700; color: var(--neutral-800); }
    .order-foot { display: flex; justify-content: space-between; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px dashed var(--neutral-200); font-size: 0.9rem; }

    /* ─── Tracking stepper ─── */
    .track { display: flex; justify-content: space-between; position: relative; margin: 0.25rem 0 0.9rem; }
    .track::before { content: ''; position: absolute; top: 6px; left: 8%; right: 8%; height: 2px; background: var(--neutral-200); z-index: 0; }
    .track-step { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 0.3rem; flex: 1; }
    .track-dot { width: 13px; height: 13px; border-radius: 50%; background: var(--neutral-200); border: 2px solid var(--neutral-0, #fff); transition: background 0.25s; }
    .track-label { font-size: 0.62rem; font-weight: 600; color: var(--neutral-400); text-transform: uppercase; letter-spacing: 0.03em; }
    .track-step.done .track-dot { background: var(--brand-500, #6366f1); }
    .track-step.done .track-label { color: var(--brand-600, #4f46e5); }
    .track--cancelled { justify-content: center; font-size: 0.78rem; color: #dc2626; padding: 0.25rem 0 0.6rem; }

    /* ─── Admin order extras ─── */
    .admin-ship { font-size: 0.78rem; color: var(--neutral-600); line-height: 1.45; margin-bottom: 0.7rem; padding: 0.6rem 0.7rem; background: var(--neutral-50); border-radius: 12px; }
    .admin-status-row { display: flex; align-items: center; gap: 0.6rem; margin-top: 0.8rem; padding-top: 0.75rem; border-top: 1px dashed var(--neutral-200); }
    .admin-status-row label { font-size: 0.78rem; font-weight: 700; color: var(--neutral-600); }
    .status-select { flex: 1; max-width: 200px; padding: 0.5rem 0.7rem; font-size: 0.85rem; }

    .addr-card { border: 1px solid var(--neutral-200); border-radius: 16px; padding: 1rem; margin-bottom: 0.75rem; }
    .addr-name { font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
    .chip { font-size: 0.6rem; font-weight: 700; text-transform: uppercase; background: var(--brand-100); color: var(--brand-600); padding: 0.1rem 0.4rem; border-radius: var(--radius-sm); }
    .addr-text { font-size: 0.82rem; color: var(--neutral-600); margin-top: 0.25rem; line-height: 1.4; }
    .addr-phone { font-size: 0.78rem; color: var(--neutral-500); margin-top: 0.25rem; }
    .addr-actions { display: flex; gap: 1rem; margin-top: 0.6rem; }
    .link-btn { background: none; border: none; padding: 0; font-size: 0.78rem; font-weight: 600; color: var(--brand-600); cursor: pointer; }
    .link-btn.danger { color: #ef4444; }

    .addr-form { display: flex; flex-direction: column; gap: 0.6rem; margin-top: 0.5rem; }
    .af-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
    .af-default { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: var(--neutral-600); }
    .af-default input { accent-color: var(--brand-500); }

    .empty { text-align: center; padding: 0.5rem 0 0.75rem; }
    .empty-ico { width: 62px; height: 62px; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
    .empty-ico svg { width: 30px; height: 30px; }
    .empty h3 { margin: 0 0 0.35rem; color: var(--neutral-900); font-size: 1.05rem; }
    .empty p { margin: 0 0 1.35rem; color: var(--neutral-500); font-size: 0.88rem; }

    /* ─── Animations ─── */
    @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pop { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: scale(1); } }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes popCenter { from { opacity: 0; transform: translate(-50%, -50%) scale(0.92); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
    @keyframes float { from { transform: translate(0,0); } to { transform: translate(16px, 18px); } }

    @media (prefers-reduced-motion: reduce) {
      .hero, .row, .logout, .avatar-ring, .sheet, .sheet-backdrop, .orb-a, .orb-b { animation: none; }
    }

    /* ─── Desktop ─── */
    @media (min-width: 768px) {
      .account { padding: 2rem 1rem 3rem; }
      .hero { padding: 2rem 2rem 1.75rem; }
      .user-name { font-size: 1.6rem; }
      .avatar { width: 68px; height: 68px; font-size: 1.5rem; }
      .menu { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
      .sheet { border-radius: 22px; bottom: auto; top: 50%; left: 50%; right: auto; margin: 0; transform: translate(-50%, -50%); width: 440px; padding: 1.75rem; animation: popCenter 0.3s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1)) both; }
      .sheet-grip { display: none; }
    }
  `]
})
export default class AccountPage {
  private auth = inject(AuthService);
  private notify = inject(NotificationService);
  private addressSvc = inject(AddressService);
  private orderSvc = inject(OrderService);
  private adminSvc = inject(AdminService);

  user = this.auth.currentUser;
  profile = this.auth.userProfile;
  isAdmin = this.auth.isAdmin;

  activePanel = signal<'editProfile' | 'orders' | 'address' | 'help' | 'adminOrders' | null>(null);
  isSaving = signal(false);

  // Admin: all orders
  adminOrders = signal<Order[]>([]);
  adminOrdersLoading = signal(false);
  readonly statusOptions = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  // Customer order tracking
  readonly trackSteps = [
    { key: 'placed', label: 'Placed' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
  ];

  editName = '';
  editPhone = '';

  // Orders + addresses
  orders = signal<Order[]>([]);
  addresses = signal<Address[]>([]);
  ordersLoading = signal(false);
  addressesLoading = signal(false);
  ordersCount = signal(0);
  addressesCount = signal(0);

  showAddressForm = signal(false);
  savingAddress = signal(false);
  addrForm: Address = this.emptyAddr();

  constructor() {
    // Prefetch counts once the auth session is ready.
    queueMicrotask(() => this.refreshCounts());
  }

  private emptyAddr(): Address {
    return {
      full_name: this.profile()?.full_name ?? '',
      phone: this.profile()?.phone ?? '',
      line1: '', line2: '', city: '', state: '', postal_code: '', country: 'India', is_default: false,
    };
  }

  private async refreshCounts() {
    if (!this.auth.isLoggedIn()) return;
    try {
      const [orders, addresses] = await Promise.all([
        this.orderSvc.list(),
        this.addressSvc.list(),
      ]);
      this.orders.set(orders);
      this.addresses.set(addresses);
      this.ordersCount.set(orders.length);
      this.addressesCount.set(addresses.length);
    } catch { /* ignore */ }
  }

  greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  });

  initials = computed(() => {
    const name = this.profile()?.full_name || this.user()?.email || '?';
    return name.trim().slice(0, 2).toUpperCase();
  });

  openPanel(panel: 'orders' | 'address' | 'help' | 'adminOrders') {
    this.activePanel.set(panel);
    if (panel === 'orders') this.loadOrders();
    if (panel === 'address') this.loadAddresses();
    if (panel === 'adminOrders') this.loadAdminOrders();
  }

  statusIndex(status?: string): number {
    return this.trackSteps.findIndex((s) => s.key === status);
  }

  async loadAdminOrders() {
    this.adminOrdersLoading.set(true);
    try {
      const list = await this.adminSvc.listOrders();
      this.adminOrders.set(list);
    } catch {
      this.notify.error('Could not load orders.');
    } finally {
      this.adminOrdersLoading.set(false);
    }
  }

  async changeOrderStatus(order: Order, status: string) {
    if (!order.id || order.status === status) return;
    const previous = order.status;
    try {
      await this.adminSvc.updateOrderStatus(order.id, status);
      this.adminOrders.update((list) =>
        list.map((o) => (o.id === order.id ? { ...o, status: status as Order['status'] } : o)),
      );
      this.notify.success(`Order marked as ${status}.`);
    } catch {
      order.status = previous;
      this.notify.error('Could not update status.');
    }
  }

  closePanel() {
    this.activePanel.set(null);
    this.showAddressForm.set(false);
  }

  async loadOrders() {
    this.ordersLoading.set(true);
    try {
      const list = await this.orderSvc.list();
      this.orders.set(list);
      this.ordersCount.set(list.length);
    } catch {
      this.notify.error('Could not load your orders.');
    } finally {
      this.ordersLoading.set(false);
    }
  }

  async loadAddresses() {
    this.addressesLoading.set(true);
    try {
      const list = await this.addressSvc.list();
      this.addresses.set(list);
      this.addressesCount.set(list.length);
    } catch {
      this.notify.error('Could not load your addresses.');
    } finally {
      this.addressesLoading.set(false);
    }
  }

  toggleAddressForm() {
    this.addrForm = this.emptyAddr();
    this.showAddressForm.set(!this.showAddressForm());
  }

  async saveAddress() {
    const f = this.addrForm;
    if (!f.full_name.trim() || !f.phone.trim() || !f.line1.trim() || !f.city.trim() || !f.postal_code.trim()) {
      this.notify.error('Please fill all required fields.');
      return;
    }
    this.savingAddress.set(true);
    try {
      await this.addressSvc.create(f);
      await this.loadAddresses();
      this.showAddressForm.set(false);
      this.notify.success('Address saved.');
    } catch {
      this.notify.error('Could not save address.');
    } finally {
      this.savingAddress.set(false);
    }
  }

  async deleteAddress(id: string) {
    try {
      await this.addressSvc.remove(id);
      await this.loadAddresses();
      this.notify.success('Address removed.');
    } catch {
      this.notify.error('Could not remove address.');
    }
  }

  async makeDefault(id: string) {
    try {
      await this.addressSvc.setDefault(id);
      await this.loadAddresses();
      this.notify.success('Default address updated.');
    } catch {
      this.notify.error('Could not update default address.');
    }
  }

  orderDate(iso?: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  startEditProfile() {
    this.editName = this.profile()?.full_name ?? '';
    this.editPhone = this.profile()?.phone ?? '';
    this.activePanel.set('editProfile');
  }

  async saveProfile() {
    this.isSaving.set(true);
    const { error } = await this.auth.updateProfile({
      full_name: this.editName,
      phone: this.editPhone,
    });
    this.isSaving.set(false);
    if (error) {
      this.notify.error('Failed to update profile.');
    } else {
      this.notify.success('Profile updated!');
      this.activePanel.set(null);
    }
  }

  logout() {
    this.auth.signOut();
  }
}
