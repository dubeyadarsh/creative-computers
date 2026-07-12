import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { ShopService } from '../../services/shop.service';
import { Product } from '../../services/shop.types';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [RouterLink, MatIconModule, FormsModule],
  templateUrl: './top-bar.html',
  styleUrls: ['./top-bar.css']
})
export class TopBarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  cart = inject(CartService);
  favorites = inject(FavoritesService);
  private router = inject(Router);
  private shop = inject(ShopService);

  searchText = '';

  // --- Autosuggest state ---
  suggestions = signal<Product[]>([]);
  showSuggestions = signal(false);
  loadingSuggestions = signal(false);
  activeIndex = signal(-1);

  private query$ = new Subject<string>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.query$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((term) => {
          this.loadingSuggestions.set(true);
          return this.shop.queryProducts({ q: term, limit: 6, sort: 'popular' });
        }),
      )
      .subscribe({
        next: (res) => {
          this.suggestions.set(res.data ?? []);
          this.activeIndex.set(-1);
          this.loadingSuggestions.set(false);
          this.showSuggestions.set(true);
        },
        error: () => {
          this.suggestions.set([]);
          this.loadingSuggestions.set(false);
        },
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onInput(): void {
    const term = this.searchText.trim();
    if (term.length < 2) {
      this.suggestions.set([]);
      this.showSuggestions.set(false);
      this.activeIndex.set(-1);
      return;
    }
    this.query$.next(term);
  }

  onFocus(): void {
    if (this.suggestions().length > 0) this.showSuggestions.set(true);
  }

  // Delay hiding so a suggestion click can register first.
  onBlur(): void {
    setTimeout(() => this.showSuggestions.set(false), 150);
  }

  moveDown(): void {
    if (!this.showSuggestions() || this.suggestions().length === 0) return;
    this.activeIndex.update((i) => (i + 1) % this.suggestions().length);
  }

  moveUp(): void {
    if (!this.showSuggestions() || this.suggestions().length === 0) return;
    this.activeIndex.update((i) =>
      i <= 0 ? this.suggestions().length - 1 : i - 1,
    );
  }

  selectHighlighted(): void {
    const idx = this.activeIndex();
    const list = this.suggestions();
    if (idx >= 0 && idx < list.length) {
      this.selectProduct(list[idx]);
    } else {
      this.search();
    }
  }

  selectProduct(product: Product): void {
    this.showSuggestions.set(false);
    this.suggestions.set([]);
    this.searchText = '';
    this.router.navigate(['/product-details'], { queryParams: { id: product.id } });
  }

  imageOf(product: Product): string {
    return product.image_urls && product.image_urls.length > 0
      ? product.image_urls[0]
      : 'https://placehold.co/80x80?text=No+Image';
  }

  search(): void {
    const q = this.searchText.trim();
    this.showSuggestions.set(false);
    this.router.navigate(['/shops'], { queryParams: q ? { q } : {} });
  }
}
