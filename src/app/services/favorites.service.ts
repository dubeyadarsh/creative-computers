import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Product } from './shop.types';

export interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
}

const STORAGE_KEY = 'cc-favorites-v1';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  items = signal<FavoriteItem[]>(this.load());

  count = computed(() => this.items().length);
  ids = computed(() => new Set(this.items().map((i) => i.id)));

  private load(): FavoriteItem[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as FavoriteItem[]) : [];
    } catch {
      return [];
    }
  }

  private persist(): void {
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
    }
  }

  has(id: string): boolean {
    return this.items().some((i) => i.id === id);
  }

  toggle(product: Product): boolean {
    if (!product.id) return false;
    const exists = this.has(product.id);
    if (exists) {
      this.remove(product.id);
      return false;
    }
    this.items.update((list) => [
      ...list,
      {
        id: product.id!,
        name: product.name,
        price: product.price,
        image: product.image_urls?.[0] ?? 'https://placehold.co/200x200?text=No+Image',
        stock: product.stock ?? 0,
      },
    ]);
    this.persist();
    return true;
  }

  remove(id: string): void {
    this.items.update((list) => list.filter((i) => i.id !== id));
    this.persist();
  }

  clear(): void {
    this.items.set([]);
    this.persist();
  }
}
