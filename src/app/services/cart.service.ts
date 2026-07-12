import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from './shop.types';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  qty: number;
}

const STORAGE_KEY = 'cc-cart-v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  items = signal<CartItem[]>(this.load());

  count = computed(() => this.items().reduce((n, i) => n + i.qty, 0));
  subtotal = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
  isEmpty = computed(() => this.items().length === 0);

  private load(): CartItem[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
    }
  }

  add(product: Product, qty = 1): void {
    if (!product.id) return;
    const stock = product.stock ?? 0;
    this.items.update((list) => {
      const existing = list.find((i) => i.id === product.id);
      if (existing) {
        return list.map((i) =>
          i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, stock || i.qty + qty) } : i,
        );
      }
      return [
        ...list,
        {
          id: product.id!,
          name: product.name,
          price: product.price,
          image: product.image_urls?.[0] ?? 'https://placehold.co/200x200?text=No+Image',
          stock,
          qty: Math.min(qty, stock || qty),
        },
      ];
    });
    this.persist();
  }

  setQty(id: string, qty: number): void {
    if (qty <= 0) {
      this.remove(id);
      return;
    }
    this.items.update((list) =>
      list.map((i) => (i.id === id ? { ...i, qty: i.stock ? Math.min(qty, i.stock) : qty } : i)),
    );
    this.persist();
  }

  increment(id: string): void {
    const item = this.items().find((i) => i.id === id);
    if (item) this.setQty(id, item.qty + 1);
  }

  decrement(id: string): void {
    const item = this.items().find((i) => i.id === id);
    if (item) this.setQty(id, item.qty - 1);
  }

  remove(id: string): void {
    this.items.update((list) => list.filter((i) => i.id !== id));
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }

  has(id: string): boolean {
    return this.items().some((i) => i.id === id);
  }
}
