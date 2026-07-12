import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { ShopService } from '../../services/shop.service';
import { NotificationService } from '../../services/notification.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { Product, Review } from '../../services/shop.types';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css'],
})
export default class ProductDetailComponent implements OnInit, OnDestroy {
  private shop = inject(ShopService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private cartSvc = inject(CartService);
  private favSvc = inject(FavoritesService);
  private reviewSvc = inject(ReviewService);
  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private readonly GST_RATE = 0.18;
  private readonly FREE_SHIP_THRESHOLD = 499;

  product = signal<Product | null>(null);
  isLoading = signal(true);
  notFound = signal(false);

  activeImageIndex = signal(0);
  quantity = signal(1);
  activeTab = signal<'description' | 'specs' | 'reviews'>('description');

  recommended = signal<Product[]>([]);
  storePicks = signal<Product[]>([]);
  bundle = signal<Product[]>([]);
  bundleSelected = signal<Set<string>>(new Set());

  reviews = signal<Review[]>([]);
  reviewsLoading = signal(false);
  showReviewForm = signal(false);
  submittingReview = signal(false);
  newReview = { rating: 5, title: '', body: '' };
  reviewFiles: File[] = [];
  reviewPreviews = signal<string[]>([]);

  private subs = new Subscription();

  isLoggedIn = computed(() => this.auth.isLoggedIn());

  images = computed(() => {
    const p = this.product();
    return p?.image_urls?.length ? p.image_urls : ['https://placehold.co/800x800?text=No+Image'];
  });
  mainImage = computed(() => this.images()[this.activeImageIndex()] ?? this.images()[0]);

  isWishlisted = computed(() => {
    const id = this.product()?.id;
    // touch favorites signal for reactivity
    this.favSvc.items();
    return id ? this.favSvc.has(id) : false;
  });

  inCart = computed(() => {
    const id = this.product()?.id;
    this.cartSvc.items();
    return id ? this.cartSvc.has(id) : false;
  });

  specs = computed(() => {
    const attrs = this.product()?.attributes ?? {};
    return Object.entries(attrs)
      .filter(([, v]) => v !== null && v !== '' && v !== undefined)
      .map(([label, value]) => ({ label, value: String(value) }));
  });

  ratingCount = computed(() => this.reviews().length);
  ratingAverage = computed(() => {
    const r = this.reviews();
    if (!r.length) return 0;
    return Math.round((r.reduce((s, x) => s + x.rating, 0) / r.length) * 10) / 10;
  });
  ratingDistribution = computed(() => {
    const dist = [0, 0, 0, 0, 0];
    for (const r of this.reviews()) dist[r.rating - 1]++;
    const total = this.reviews().length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: dist[star - 1],
      pct: Math.round((dist[star - 1] / total) * 100),
    }));
  });

  unitPrice = computed(() => this.product()?.price ?? 0);
  mrp = computed(() => {
    const attrs = this.product()?.attributes ?? {};
    const raw = (attrs['mrp'] ?? attrs['original_price'] ?? attrs['originalPrice']) as any;
    const val = raw != null ? parseFloat(String(raw)) : NaN;
    return !Number.isNaN(val) && val > this.unitPrice() ? val : null;
  });
  discountPct = computed(() => {
    const m = this.mrp();
    return m ? Math.round(((m - this.unitPrice()) / m) * 100) : 0;
  });
  subtotal = computed(() => this.unitPrice() * this.quantity());
  savings = computed(() => {
    const m = this.mrp();
    return m ? (m - this.unitPrice()) * this.quantity() : 0;
  });
  taxPortion = computed(
    () => Math.round((this.subtotal() - this.subtotal() / (1 + this.GST_RATE)) * 100) / 100,
  );
  shipping = computed(() => (this.subtotal() >= this.FREE_SHIP_THRESHOLD ? 0 : 49));
  total = computed(() => this.subtotal() + this.shipping());

  bundleTotal = computed(() => {
    const base = this.unitPrice();
    const extras = this.bundle()
      .filter((p) => this.bundleSelected().has(p.id!))
      .reduce((s, p) => s + p.price, 0);
    return base + extras;
  });

  ngOnInit(): void {
    this.subs.add(
      this.route.queryParamMap.subscribe((params) => {
        const id = params.get('id');
        if (!id) {
          this.notFound.set(true);
          this.isLoading.set(false);
          return;
        }
        this.loadProduct(id);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.revokePreviews();
  }

  private loadProduct(id: string): void {
    this.isLoading.set(true);
    this.notFound.set(false);
    this.shop.getProduct(id).subscribe({
      next: (res) => {
        const p = res.data;
        this.product.set(p);
        this.activeImageIndex.set(0);
        this.quantity.set(1);
        this.activeTab.set('description');
        this.isLoading.set(false);
        this.loadRelated(p);
        this.loadReviews(id);
        this.scrollTop();
      },
      error: () => {
        this.notFound.set(true);
        this.isLoading.set(false);
      },
    });
  }

  private loadRelated(p: Product): void {
    // Recommendations: popular products from the same category.
    this.shop.queryProducts({ categoryId: p.category_id, limit: 12, sort: 'popular' }).subscribe({
      next: (res) => this.recommended.set((res.data ?? []).filter((x) => x.id !== p.id)),
      error: () => this.recommended.set([]),
    });

    // Store picks: handpicked/trending products from across the store ("from our end").
    this.shop.queryProducts({ type: 'trending', limit: 8, sort: 'popular' }).subscribe({
      next: (res) => {
        let picks = (res.data ?? []).filter((x) => x.id !== p.id);
        if (picks.length < 3) {
          // Fall back to newest arrivals so this section always has products.
          this.shop.queryProducts({ limit: 8, sort: 'newest' }).subscribe({
            next: (r2) => {
              const extra = (r2.data ?? []).filter(
                (x) => x.id !== p.id && !picks.some((y) => y.id === x.id),
              );
              this.storePicks.set([...picks, ...extra].slice(0, 4));
            },
            error: () => this.storePicks.set(picks.slice(0, 4)),
          });
        } else {
          this.storePicks.set(picks.slice(0, 4));
        }
      },
      error: () => this.storePicks.set([]),
    });

    // Buy-along: affordable add-ons from across the store (cheapest first, shuffled).
    this.shop.queryProducts({ limit: 12, sort: 'price_asc' }).subscribe({
      next: (res) => {
        const cheap = (res.data ?? []).filter((x) => x.id !== p.id);
        const picked = this.shuffle(cheap).slice(0, 2);
        this.bundle.set(picked);
        this.bundleSelected.set(new Set(picked.map((x) => x.id!)));
      },
      error: () => this.bundle.set([]),
    });
  }

  private loadReviews(productId: string): void {
    this.reviewsLoading.set(true);
    this.reviewSvc
      .list(productId)
      .then((data) => this.reviews.set(data))
      .catch(() => this.reviews.set([]))
      .finally(() => this.reviewsLoading.set(false));
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Gallery / carousel ──
  setImage(i: number): void {
    this.activeImageIndex.set(i);
  }
  nextImage(): void {
    this.activeImageIndex.update((i) => (i + 1) % this.images().length);
  }
  prevImage(): void {
    this.activeImageIndex.update((i) => (i - 1 + this.images().length) % this.images().length);
  }

  // ── Quantity ──
  incrementQty(): void {
    const max = this.product()?.stock ?? 1;
    if (this.quantity() < max) this.quantity.update((q) => q + 1);
  }
  decrementQty(): void {
    if (this.quantity() > 1) this.quantity.update((q) => q - 1);
  }

  // ── Cart / wishlist / share ──
  addToCart(): void {
    const p = this.product();
    if (!p) return;
    if (p.stock === 0) {
      this.notify.error('This product is out of stock.');
      return;
    }
    this.cartSvc.add(p, this.quantity());
    this.notify.success(`Added ${this.quantity()}× ${p.name} to cart.`);
  }

  buyNow(): void {
    const p = this.product();
    if (!p || p.stock === 0) {
      this.notify.error('This product is out of stock.');
      return;
    }
    this.cartSvc.add(p, this.quantity());
    this.router.navigate(['/cart']);
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    const added = this.favSvc.toggle(p);
    this.notify.info(added ? 'Added to favorites.' : 'Removed from favorites.');
  }

  addBundleToCart(): void {
    const p = this.product();
    if (p) this.cartSvc.add(p, 1);
    for (const item of this.bundle()) {
      if (this.bundleSelected().has(item.id!)) this.cartSvc.add(item, 1);
    }
    this.notify.success(`Added ${this.bundleSelected().size + 1} items to cart.`);
  }

  toggleBundleItem(id: string): void {
    this.bundleSelected.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async share(): Promise<void> {
    if (!this.isBrowser) return;
    const url = window.location.href;
    const title = this.product()?.name ?? 'Check this out';
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        this.notify.success('Link copied to clipboard.');
      }
    } catch {
      /* cancelled */
    }
  }

  // ── Reviews ──
  openReviewForm(): void {
    if (!this.isLoggedIn()) {
      this.notify.info('Please sign in to write a review.');
      this.router.navigate(['/auth']);
      return;
    }
    this.showReviewForm.set(!this.showReviewForm());
  }

  onReviewFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files).slice(0, 4);
    this.reviewFiles = files;
    this.revokePreviews();
    this.reviewPreviews.set(files.map((f) => URL.createObjectURL(f)));
  }

  private revokePreviews(): void {
    if (this.isBrowser) this.reviewPreviews().forEach((u) => URL.revokeObjectURL(u));
  }

  async submitReview(): Promise<void> {
    const p = this.product();
    if (!p?.id) return;
    if (!this.newReview.body.trim()) {
      this.notify.error('Please write your review.');
      return;
    }
    this.submittingReview.set(true);
    try {
      await this.reviewSvc.add({
        productId: p.id,
        rating: this.newReview.rating,
        title: this.newReview.title.trim() || undefined,
        body: this.newReview.body.trim(),
        files: this.reviewFiles,
      });
      this.notify.success('Thanks! Your review has been posted.');
      this.newReview = { rating: 5, title: '', body: '' };
      this.reviewFiles = [];
      this.revokePreviews();
      this.reviewPreviews.set([]);
      this.showReviewForm.set(false);
      this.loadReviews(p.id);
    } catch (err: any) {
      this.notify.error(err?.message || 'Could not post your review.');
    } finally {
      this.submittingReview.set(false);
    }
  }

  // ── Navigation / helpers ──
  goToProduct(p: Product): void {
    this.router.navigate(['/product-details'], { queryParams: { id: p.id } });
  }

  imageOf(p: Product): string {
    return p.image_urls?.length ? p.image_urls[0] : 'https://placehold.co/400x400?text=No+Image';
  }

  stars(n: number): number[] {
    return Array.from({ length: Math.max(0, Math.round(n)) });
  }

  reviewDate(iso?: string): string {
    if (!iso) return 'Just now';
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  private scrollTop(): void {
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
