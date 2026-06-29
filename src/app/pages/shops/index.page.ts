// shops.component.ts

import {
  Component,
  OnInit,
  ChangeDetectorRef,
  HostListener,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  stock: number;
  views: number;
  isTrending: boolean;
  image: string;          
  description: string;
  discount: number;       
}

@Component({
  selector: 'app-shops',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shops.html',
  styleUrls: ['./shops.css'],
})
export default class ShopsComponent implements OnInit, AfterViewInit, OnDestroy {
  // ─── Constants ────────────────────────────────────────────
  readonly CATEGORIES = [
    'All', 'Laptops', 'Audio', 'Cameras', 'Accessories', 'Smart Home', 'Monitors'
  ];

  readonly PAGE_SIZE = 15;

  // ─── Mock Data ────────────────────────────────────────────
  private readonly PRODUCT_NAMES = [
    'Wireless Headphones Pro', 'Smart Watch Series X', 'Mechanical Keyboard',
    '4K Action Camera', 'Noise Cancelling Earbuds', 'Smartphone Stand',
    'USB-C Hub 7-in-1', 'Portable Power Bank', 'Bluetooth Speaker',
    'Gaming Mouse', 'Laptop Sleeve 15"', 'Screen Protector Kit',
    'Wireless Charger Pad', 'Fitness Tracker', 'Smart Home Hub'
  ];
  
  private readonly BRANDS = ['Sony', 'Apple', 'Samsung', 'Logitech', 'Anker', 'Dyson'];
  
  // Real High-Quality Images instead of emojis
  private readonly IMAGES = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', // Headphones
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=600&q=80', // Watch
    'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80', // Keyboard
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80', // Camera
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80', // Earbuds
    'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?auto=format&fit=crop&w=600&q=80', // Stand
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80', // Laptop / Hub
    'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80', // Power Bank
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80', // Speaker
    'https://images.unsplash.com/photo-1527814050087-379381547949?auto=format&fit=crop&w=600&q=80', // Mouse
    'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80', // Laptop Sleeve
    'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=600&q=80', // Screen/Phone
    'https://images.unsplash.com/photo-1586280915668-3f5f3e481c95?auto=format&fit=crop&w=600&q=80', // Charger
    'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b0?auto=format&fit=crop&w=600&q=80', // Fitness Tracker
    'https://images.unsplash.com/photo-1558089687-f282ffcbc126?auto=format&fit=crop&w=600&q=80'  // Smart Hub
  ];

  // ─── State ──────────────────────────────────────────────
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  displayedProducts: Product[] = [];

  page = 0;
  hasMore = true;
  isLoading = false;

  selectedCategory = 'All';
  searchQuery = '';
  sortBy: 'relevance' | 'popular' | 'rating' | 'price-asc' | 'price-desc' = 'relevance';

  filters = {
    priceMin: 0,
    priceMax: 1500,
    rating: 0,
    stock: 'all', 
  };

  wishlist = new Set<number>();
  cart: Product[] = [];

  // ─── UI State ────────────────────────────────────────────
  showFilters = false;
  showQuickView = false;
  quickViewProduct: Product | null = null;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  constructor(private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.generateMockProducts();
    this.applyFiltersAndSort();
  }

  ngAfterViewInit(): void {}
  ngOnDestroy(): void {}

  // ─── Mock Data Generation (Limited to 15) ──────────────
  private generateMockProducts(): void {
    const products: Product[] = [];
    // FIX: Only generate 15 products
    for (let i = 0; i < 15; i++) {
      const cat = this.CATEGORIES[Math.floor(Math.random() * (this.CATEGORIES.length - 1)) + 1];
      const name = this.PRODUCT_NAMES[i];
      const brand = this.BRANDS[Math.floor(Math.random() * this.BRANDS.length)];
      const price = Math.round((Math.random() * 280 + 20) * 100) / 100;
      const rating = Math.round((Math.random() * 1.5 + 3.5) * 10) / 10;
      const reviews = Math.floor(Math.random() * 800 + 20);
      const stock = Math.random() > 0.15 ? Math.floor(Math.random() * 50 + 1) : 0;
      const views = Math.floor(Math.random() * 5000 + 100);
      const isTrending = Math.random() > 0.6;
      const discount = Math.random() > 0.7 ? Math.round(Math.random() * 30 + 5) : 0;

      products.push({
        id: i + 1,
        name,
        brand,
        category: cat,
        price,
        rating: Math.min(rating, 5),
        reviews,
        stock,
        views,
        isTrending,
        image: this.IMAGES[i], // Direct URL assignment
        description: `Premium ${cat.toLowerCase()} product from ${brand}. High-quality materials and exceptional performance perfectly suited for modern professionals.`,
        discount,
      });
    }
    this.allProducts = products;
  }

  // ─── Core Filtering / Sorting ───────────────────────────
  applyFiltersAndSort(): void {
    let result = [...this.allProducts];

    if (this.selectedCategory !== 'All') {
      result = result.filter((p) => p.category === this.selectedCategory);
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    const min = this.filters.priceMin || 0;
    const max = this.filters.priceMax || 1500;
    result = result.filter((p) => p.price >= min && p.price <= max);

    const ratingThreshold = this.filters.rating || 0;
    if (ratingThreshold > 0) result = result.filter((p) => p.rating >= ratingThreshold);

    const stockFilter = this.filters.stock;
    if (stockFilter === 'in') result = result.filter((p) => p.stock > 5);
    else if (stockFilter === 'low') result = result.filter((p) => p.stock > 0 && p.stock <= 5);
    else if (stockFilter === 'out') result = result.filter((p) => p.stock === 0);

    const sort = this.sortBy;
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') result.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    else if (sort === 'popular') result.sort((a, b) => b.views - a.views);
    else {
      result.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || b.rating - a.rating);
    }

    this.filteredProducts = result;
    this.page = 0;
    this.hasMore = true;
    this.displayedProducts = [];
    this.loadMore();
  }

  loadMore(): void {
    if (this.isLoading || !this.hasMore) return;
    this.isLoading = true;
    setTimeout(() => {
      const start = this.page * this.PAGE_SIZE;
      const end = Math.min(start + this.PAGE_SIZE, this.filteredProducts.length);
      const slice = this.filteredProducts.slice(start, end);

      if (slice.length === 0) {
        this.hasMore = false;
      } else {
        this.displayedProducts.push(...slice);
        this.page++;
        if (this.displayedProducts.length >= this.filteredProducts.length) {
          this.hasMore = false;
        }
      }
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 300);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    this.applyFiltersAndSort();
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.applyFiltersAndSort();
  }

  clearSearch(): void {
    this.searchQuery = '';
    if (this.searchInput) this.searchInput.nativeElement.value = '';
    this.applyFiltersAndSort();
  }

  toggleSort(): void {
    const options: (typeof this.sortBy)[] = ['relevance', 'popular', 'rating', 'price-asc', 'price-desc'];
    const nextIdx = (options.indexOf(this.sortBy) + 1) % options.length;
    this.sortBy = options[nextIdx];
    this.applyFiltersAndSort();
  }

  toggleWishlist(productId: number): void {
    if (this.wishlist.has(productId)) this.wishlist.delete(productId);
    else this.wishlist.add(productId);
  }

  addToCart(productId: number): void {
    const product = this.allProducts.find((p) => p.id === productId);
    if (product) this.cart.push(product);
  }

  openQuickView(product: Product): void {
    this.quickViewProduct = product;
    this.showQuickView = true;
    document.body.style.overflow = 'hidden';
  }

  closeQuickView(): void {
    this.showQuickView = false;
    this.quickViewProduct = null;
    document.body.style.overflow = '';
  }

  openFilters(): void {
    this.showFilters = true;
    document.body.style.overflow = 'hidden';
  }

  closeFilters(): void {
    this.showFilters = false;
    document.body.style.overflow = '';
  }

  applyFiltersFromDrawer(): void {
    this.applyFiltersAndSort();
    this.closeFilters();
  }

  resetFilters(): void {
    this.filters = { priceMin: 0, priceMax: 1500, rating: 0, stock: 'all' };
    this.applyFiltersAndSort();
    this.closeFilters();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event?: Event): void {
    if (this.hasMore && !this.isLoading) {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const scrollTop = window.scrollY || window.pageYOffset;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        this.loadMore();
      }
    }
  }

  getStockBadge(stock: number): { label: string; cls: string } {
    if (stock === 0) return { label: 'Out of Stock', cls: 'out-of-stock' };
    if (stock <= 5) return { label: 'Low Stock', cls: 'low-stock' };
    return { label: 'In Stock', cls: 'in-stock' };
  }

  formatPrice(price: number): string {
    return '$' + price.toFixed(2);
  }

  isWishlisted(id: number): boolean { return this.wishlist.has(id); }
  isInCart(id: number): boolean { return this.cart.some((p) => p.id === id); }

  getFinalPrice(product: Product): number {
    return product.discount > 0
      ? Math.round((product.price * (1 - product.discount / 100)) * 100) / 100
      : product.price;
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filters.rating > 0) count++;
    if (this.filters.stock !== 'all') count++;
    if (this.filters.priceMin > 0 || this.filters.priceMax < 1500) count++;
    return count;
  }

goToProduct(productId: number): void {
    // Failsafe: Ensure the body is never locked when navigating away
    document.body.style.overflow = '';
    
    //cgec
    // Navigate to the product details page
    this.router.navigate(['/product-details']); 
  }
}