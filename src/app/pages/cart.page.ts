import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';

import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { AddressService } from '../services/address.service';
import { OrderService } from '../services/order.service';
import { NotificationService } from '../services/notification.service';
import { Address } from '../services/shop.types';

type Step = 'cart' | 'address' | 'done';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.css'],
})
export default class CartPage {
  cart = inject(CartService);
  private auth = inject(AuthService);
  private addressSvc = inject(AddressService);
  private orderSvc = inject(OrderService);
  private notify = inject(NotificationService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private readonly FREE_SHIP_THRESHOLD = 499;

  step = signal<Step>('cart');
  isLoggedIn = computed(() => this.auth.isLoggedIn());

  addresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  showAddressForm = signal(false);
  placing = signal(false);
  lastOrderId = signal<string | null>(null);

  form: Address = this.emptyForm();

  shipping = computed(() => (this.cart.subtotal() >= this.FREE_SHIP_THRESHOLD ? 0 : 49));
  total = computed(() => this.cart.subtotal() + this.shipping());

  private emptyForm(): Address {
    return {
      full_name: this.auth.userProfile()?.full_name ?? '',
      phone: this.auth.userProfile()?.phone ?? '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      is_default: false,
    };
  }

  // ── Cart ops ──
  inc(id: string): void { this.cart.increment(id); }
  dec(id: string): void { this.cart.decrement(id); }
  remove(id: string): void { this.cart.remove(id); }

  // ── Checkout flow ──
  async proceed(): Promise<void> {
    if (this.cart.isEmpty()) return;
    if (!this.isLoggedIn()) {
      this.notify.info('Please sign in to checkout.');
      this.router.navigate(['/auth']);
      return;
    }
    await this.loadAddresses();
    this.step.set('address');
  }

  backToCart(): void { this.step.set('cart'); }

  private async loadAddresses(): Promise<void> {
    try {
      const list = await this.addressSvc.list();
      this.addresses.set(list);
      const def = list.find((a) => a.is_default) ?? list[0];
      this.selectedAddressId.set(def?.id ?? null);
      this.showAddressForm.set(list.length === 0);
    } catch {
      this.addresses.set([]);
      this.showAddressForm.set(true);
    }
  }

  selectAddress(id: string): void {
    this.selectedAddressId.set(id);
    this.showAddressForm.set(false);
  }

  toggleAddressForm(): void {
    this.form = this.emptyForm();
    this.showAddressForm.set(!this.showAddressForm());
  }

  async saveAddress(): Promise<void> {
    const f = this.form;
    if (!f.full_name.trim() || !f.phone.trim() || !f.line1.trim() || !f.city.trim() || !f.postal_code.trim()) {
      this.notify.error('Please fill all required address fields.');
      return;
    }
    try {
      const created = await this.addressSvc.create(f);
      await this.loadAddresses();
      if (created.id) this.selectedAddressId.set(created.id);
      this.showAddressForm.set(false);
      this.notify.success('Address saved.');
    } catch {
      this.notify.error('Could not save address.');
    }
  }

  async placeOrder(): Promise<void> {
    const addr = this.addresses().find((a) => a.id === this.selectedAddressId());
    if (!addr) {
      this.notify.error('Please select a delivery address.');
      return;
    }
    this.placing.set(true);
    try {
      const order = await this.orderSvc.place({
        items: this.cart.items(),
        address: addr,
        subtotal: this.cart.subtotal(),
        shipping: this.shipping(),
        total: this.total(),
        paymentMethod: 'cod',
      });
      this.lastOrderId.set(order.id ?? null);
      this.cart.clear();
      this.step.set('done');
    } catch (err: any) {
      this.notify.error(err?.message || 'Could not place your order.');
    } finally {
      this.placing.set(false);
    }
  }
}
