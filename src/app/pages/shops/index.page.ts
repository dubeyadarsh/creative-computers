import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  computed,
  PLATFORM_ID,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ShopService } from '../../services/shop.service';
import { NotificationService } from '../../services/notification.service';
import { CartService } from '../../services/cart.service';
import { FavoritesService } from '../../services/favorites.service';
import { Category, Product, ProductSort } from '../../services/shop.types';

interface SortOption {
  value: ProductSort;
  label: string;
}

@Component({
  selector: 'app-shops',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './shops.html',
  styleUrls: ['./shops.css'],
})
export default class ShopsComponent implements OnInit, AfterViewInit, OnDestroy {
  private shop = inject(ShopService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private cartSvc = inject(CartService);
  private favSvc = inject(FavoritesService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('sentinel') sentinel?: ElementRef<HTMLElement>;

  readonly PAGE_SIZE = 12;
  readonly sortOptions: SortOption[] = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'popular', label: 'Trending' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
  ];

  // ── Catalog state ──
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  total = signal(0);
  page = signal(1);
  hasMore = signal(true);
  isLoading = signal(false);      // first page / full reload
  isLoadingMore = signal(false);  // subsequent pages

  // ── Active query state (mirrors URL) ──
  categoryId = signal<string | null>(null);
  type = signal<'trending' | 'new' | null>(null);
  sort = signal<ProductSort>('newest');
  q = signal('');

  // ── Filter drawer working copy ──
  showFilters = signal(false);
  showSort = signal(false);
  searchText = '';
  draftMinPrice: number | null = null;
  draftMaxPrice: number | null = null;
  draftInStock = false;
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  inStock = signal(false);

  // Recommended (popular) products shown as a horizontal rail.
  recommended = signal<Product[]>([]);

  private searchInput$ = new Subject<string>();
  private subs = new Subscription();
  private observer?: IntersectionObserver;

  activeCategoryName = computed(() => {
    const id = this.categoryId();
    if (!id) return null;
    return this.categories().find((c) => c.id === id)?.name ?? null;
  });

  heading = computed(() => {
    if (this.q()) return `Results for “${this.q()}”`;
    if (this.type() === 'trending') return 'Trending Now';
    if (this.type() === 'new') return 'New Arrivals';
    return this.activeCategoryName() ?? 'All Products';
  });

  activeFilterCount = computed(() => {
    let n = 0;
    if (this.minPrice() != null) n++;
    if (this.maxPrice() != null) n++;
    if (this.inStock()) n++;
    return n;
  });

  currentSortLabel = computed(
    () => this.sortOptions.find((o) => o.value === this.sort())?.label ?? 'Sort',
  );

  ngOnInit(): void {
    this.shop.getCategories().subscribe({
      next: (res) => this.categories.set(res.data ?? []),
      error: () => this.categories.set([]),
    });

    // Recommended rail — popular products across the store.
    this.shop.queryProducts({ limit: 12, sort: 'popular' }).subscribe({
      next: (res) => this.recommended.set(res.data ?? []),
      error: () => this.recommended.set([]),
    });

    // URL is the source of truth — react to param changes.
    this.subs.add(
      this.route.queryParamMap.subscribe((params) => {
        this.categoryId.set(params.get('category'));
        const t = params.get('type');
        this.type.set(t === 'trending' || t === 'new' ? t : null);
        this.sort.set((params.get('sort') as ProductSort) || 'newest');
        this.q.set(params.get('q') ?? '');
        this.searchText = this.q();
        this.minPrice.set(params.get('minPrice') ? Number(params.get('minPrice')) : null);
        this.maxPrice.set(params.get('maxPrice') ? Number(params.get('maxPrice')) : null);
        this.inStock.set(params.get('inStock') === 'true');
        this.reloadFirstPage();
      }),
    );

    // Debounced search → pushes to URL.
    this.subs.add(
      this.searchInput$
        .pipe(debounceTime(400), distinctUntilChanged())
        .subscribe((text) => this.updateQuery({ q: text || null })),
    );
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.sentinel) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) this.loadMore();
      },
      { rootMargin: '400px' },
    );
    this.observer.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.observer?.disconnect();
  }

  // ── Data loading ──
  private reloadFirstPage(): void {
    this.page.set(1);
    this.hasMore.set(true);
    this.isLoading.set(true);
    this.fetch(1, false);
  }

  private fetch(pageNum: number, append: boolean): void {
    this.shop
      .queryProducts({
        page: pageNum,
        limit: this.PAGE_SIZE,
        categoryId: this.categoryId() ?? undefined,
        type: this.type() ?? undefined,
        sort: this.sort(),
        q: this.q() || undefined,
        minPrice: this.minPrice() ?? undefined,
        maxPrice: this.maxPrice() ?? undefined,
        inStock: this.inStock() || undefined,
      })
      .subscribe({
        next: (res) => {
          const incoming = res.data ?? [];
          this.products.update((cur) => (append ? [...cur, ...incoming] : incoming));
          this.total.set(res.meta?.total ?? incoming.length);
          this.hasMore.set(res.meta?.hasMore ?? false);
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
        },
        error: () => {
          this.notify.error('Could not load products.');
          this.isLoading.set(false);
          this.isLoadingMore.set(false);
          this.hasMore.set(false);
        },
      });
  }

  loadMore(): void {
    if (this.isLoading() || this.isLoadingMore() || !this.hasMore()) return;
    this.isLoadingMore.set(true);
    const next = this.page() + 1;
    this.page.set(next);
    this.fetch(next, true);
  }

  // ── URL-driven filter mutations ──
  private updateQuery(params: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
      queryParamsHandling: 'merge',
    });
  }

  selectCategory(id: string | null): void {
    // Selecting a category clears the trending/new "type" scope.
    this.updateQuery({ category: id, type: null });
  }

  resetAll(): void {
    this.updateQuery({ category: null, type: null });
  }

  setSort(value: ProductSort): void {
    this.showSort.set(false);
    this.updateQuery({ sort: value });
  }

  selectType(t: 'trending' | 'new' | null): void {
    this.updateQuery({ type: t, category: null });
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value.trim());
  }

  clearSearch(): void {
    this.searchText = '';
    this.updateQuery({ q: null });
  }

  // ── Filter drawer ──
  openFilters(): void {
    this.draftMinPrice = this.minPrice();
    this.draftMaxPrice = this.maxPrice();
    this.draftInStock = this.inStock();
    this.showFilters.set(true);
    this.lockScroll(true);
  }

  closeFilters(): void {
    this.showFilters.set(false);
    this.lockScroll(false);
  }

  applyFilters(): void {
    this.updateQuery({
      minPrice: this.draftMinPrice != null ? String(this.draftMinPrice) : null,
      maxPrice: this.draftMaxPrice != null ? String(this.draftMaxPrice) : null,
      inStock: this.draftInStock ? 'true' : null,
    });
    this.closeFilters();
  }

  resetFilters(): void {
    this.draftMinPrice = null;
    this.draftMaxPrice = null;
    this.draftInStock = false;
    this.updateQuery({ minPrice: null, maxPrice: null, inStock: null });
    this.closeFilters();
  }

  private lockScroll(lock: boolean): void {
    if (this.isBrowser) document.body.style.overflow = lock ? 'hidden' : '';
  }

  // ── Card helpers ──
  toggleWishlist(product: Product, ev: Event): void {
    ev.stopPropagation();
    const added = this.favSvc.toggle(product);
    this.notify.info(added ? 'Added to favorites.' : 'Removed from favorites.');
  }

  isWishlisted(id: string): boolean {
    // touch signal for reactivity
    this.favSvc.items();
    return this.favSvc.has(id);
  }

  addToCart(product: Product, ev: Event): void {
    ev.stopPropagation();
    if ((product.stock ?? 0) === 0) {
      this.notify.error('This product is out of stock.');
      return;
    }
    this.cartSvc.add(product, 1);
    this.notify.success(`${product.name} added to cart.`);
  }

  async share(product: Product, ev: Event): Promise<void> {
    ev.stopPropagation();
    if (!this.isBrowser) return;
    const url = `${window.location.origin}/product-details?id=${product.id}`;
    const text = `Check out ${product.name} at Creative Computers — ₹${product.price}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text, url });
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
          '_blank',
          'noopener',
        );
      }
    } catch {
      /* cancelled */
    }
  }

  goToProduct(product: Product): void {
    this.lockScroll(false);
    this.router.navigate(['/product-details'], { queryParams: { id: product.id } });
  }

  imageOf(product: Product): string {
    return product.image_urls?.length
      ? product.image_urls[0]
      : 'https://placehold.co/400x400?text=No+Image';
  }

  trackById = (_: number, p: Product) => p.id;
}
