import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FavoritesService, FavoriteItem } from '../services/favorites.service';
import { CartService } from '../services/cart.service';
import { NotificationService } from '../services/notification.service';

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="wishlist">
      <h1 class="page-title">My Favorites <span class="count">({{ fav.count() }})</span></h1>

      @if (fav.count() === 0) {
        <div class="empty-state">
          <div class="empty-state__icon">💜</div>
          <h2>No favorites yet</h2>
          <p>Tap the heart on any product to save it here.</p>
          <button class="btn-primary" routerLink="/shops">Discover products</button>
        </div>
      } @else {
        <div class="grid">
          @for (item of fav.items(); track item.id) {
            <article class="card">
              <div class="card__media" (click)="open(item)">
                <img [src]="item.image" [alt]="item.name" />
                @if (item.stock === 0) { <div class="card__sold">Out of stock</div> }
                <button class="card__remove" (click)="remove(item, $event)" aria-label="Remove">
                  <svg viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
              </div>
              <div class="card__body">
                <h3 class="card__title" (click)="open(item)">{{ item.name }}</h3>
                <div class="card__foot">
                  <span class="card__price">₹{{ item.price | number:'1.0-0' }}</span>
                  <button class="card__add" [disabled]="item.stock === 0" (click)="addToCart(item, $event)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    :host, :host *, :host *::before, :host *::after { box-sizing: border-box; }
    .wishlist { max-width: 1200px; margin: 0 auto; padding: 1.5rem 1rem 6rem; min-height: 100dvh; }
    .page-title { font-size: 1.5rem; font-weight: 800; margin: 0 0 1.5rem; color: var(--neutral-900); letter-spacing: -0.02em; }
    .page-title .count { color: var(--neutral-400); font-weight: 600; font-size: 1.1rem; }

    .empty-state { text-align: center; padding: 4rem 1rem; }
    .empty-state__icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .empty-state h2 { margin: 0 0 0.5rem; color: var(--neutral-800); }
    .empty-state p { color: var(--neutral-500); margin: 0 0 1.5rem; }

    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.85rem; }
    .card { background: var(--neutral-0); border: 1px solid var(--neutral-100); border-radius: var(--radius-xl); overflow: hidden; transition: transform 0.25s, box-shadow 0.25s; }
    .card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .card__media { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--neutral-50); cursor: pointer; }
    .card__media img { width: 100%; height: 100%; object-fit: cover; }
    .card__sold { position: absolute; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
    .card__remove { position: absolute; top: 0.5rem; right: 0.5rem; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .card__remove svg { width: 16px; height: 16px; }
    .card__body { padding: 0.75rem; }
    .card__title { font-size: 0.85rem; font-weight: 600; color: var(--neutral-800); margin: 0 0 0.5rem; cursor: pointer; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.35; }
    .card__foot { display: flex; align-items: center; justify-content: space-between; }
    .card__price { font-size: 1rem; font-weight: 700; color: var(--neutral-900); }
    .card__add { width: 32px; height: 32px; border-radius: 50%; border: none; background: var(--gradient-brand); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.2s; }
    .card__add svg { width: 16px; height: 16px; }
    .card__add:hover:not(:disabled) { transform: scale(1.1); }
    .card__add:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-primary { padding: 0.8rem 1.5rem; border: none; border-radius: var(--radius-full); background: var(--gradient-brand); color: #fff; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(99,102,241,0.35); }

    @media (min-width: 768px) { .grid { grid-template-columns: repeat(4, 1fr); gap: 1.25rem; } }
  `]
})
export default class WishlistPage {
  fav = inject(FavoritesService);
  private cart = inject(CartService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  open(item: FavoriteItem): void {
    this.router.navigate(['/product-details'], { queryParams: { id: item.id } });
  }

  remove(item: FavoriteItem, ev: Event): void {
    ev.stopPropagation();
    this.fav.remove(item.id);
    this.notify.info('Removed from favorites.');
  }

  addToCart(item: FavoriteItem, ev: Event): void {
    ev.stopPropagation();
    if (item.stock === 0) {
      this.notify.error('This product is out of stock.');
      return;
    }
    this.cart.add(
      { id: item.id, name: item.name, price: item.price, stock: item.stock, image_urls: [item.image] } as any,
      1,
    );
    this.notify.success(`${item.name} added to cart.`);
  }
}
