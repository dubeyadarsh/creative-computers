import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { ShopService} from '../services/shop.service';
import { MatIcon } from "@angular/material/icon";
import { Category, Product } from '../services/shop.types';
import { CartService } from '../services/cart.service';
import { FavoritesService } from '../services/favorites.service';
import { NotificationService } from '../services/notification.service';
import { HttpClient } from '@angular/common/http';
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [MatIcon, RouterModule, CommonModule, FormsModule]
})
export default class HomeComponent implements OnInit, OnDestroy {
  private shopService = inject(ShopService);
  private router = inject(Router);
  private cart = inject(CartService);
  private favorites = inject(FavoritesService);
  private notify = inject(NotificationService);
  private http = inject(HttpClient);

  // Contact form
  contact = { name: '', email: '', subject: '', message: '' };
  contactSending = signal(false);

  // ==========================================
  // DATA STATE
  // ==========================================
  isLoading: boolean = true;
  categories: Category[] = [];
  trendingProducts: Product[] = [];
  justArrivedProducts: Product[] = [];

  // ==========================================
  // UI STATE (Mobile & Carousel)
  // ==========================================
  isCategoryMenuOpen: boolean = false;
  
  currentSlide = signal(0);
  private slideInterval: any;
  private readonly TOTAL_SLIDES = 3;

  ngOnInit(): void {
    this.fetchBackendData();
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  fetchBackendData(): void {
    this.isLoading = true;

    forkJoin({
      categoriesRes: this.shopService.getCategories(),
      trendingRes: this.shopService.getTrendingProducts(),
      newArrivalsRes: this.shopService.getNewArrivals()
    })
    .pipe(
      finalize(() => this.isLoading = false) 
    )
    .subscribe({
      next: (response) => {
        // MUST append .data to unwrap the array from your ApiResponse object
        this.categories = response.categoriesRes.data; 
        this.trendingProducts = response.trendingRes.data;
        this.justArrivedProducts = response.newArrivalsRes.data;
      },
      error: (err) => {
        console.error('Failed to fetch home page data:', err);
      }
    });
  }

  // ==========================================
  // MOBILE MENU LOGIC
  // ==========================================
  toggleCategoryMenu(): void {
    this.isCategoryMenuOpen = !this.isCategoryMenuOpen;
  }

  // ==========================================
  // CAROUSEL LOGIC
  // ==========================================
  startCarousel(): void {
    this.slideInterval = setInterval(() => {
      this.currentSlide.update(index => (index + 1) % this.TOTAL_SLIDES);
    }, 5000);
  }

  stopCarousel(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  goToSlide(index: number): void {
    this.currentSlide.set(index);
    this.stopCarousel();
    this.startCarousel();
  }

  // ==========================================
  // PRODUCT INTERACTIONS
  // ==========================================
  goToProduct(product: Product): void {
    this.router.navigate(['/product-details'], { queryParams: { id: product.id } });
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    if ((product.stock ?? 0) === 0) {
      this.notify.error('This product is out of stock.');
      return;
    }
    this.cart.add(product, 1);
    this.notify.success(`${product.name} added to cart.`);
  }

  toggleFavorite(product: Product, event: Event): void {
    event.stopPropagation();
    const added = this.favorites.toggle(product);
    this.notify.info(added ? 'Added to favorites.' : 'Removed from favorites.');
  }

  isFavorite(product: Product): boolean {
    return product.id ? this.favorites.has(product.id) : false;
  }

  // ==========================================
  // CATEGORY NAVIGATION
  // ==========================================
  goToShops(): void {
    this.router.navigate(['/shops']);
  }

  goToCategory(categoryId?: string): void {
    if (!categoryId) {
      this.router.navigate(['/shops']);
      return;
    }
    this.router.navigate(['/shops'], { queryParams: { category: categoryId } });
  }

  // ==========================================
  // CONTACT FORM
  // ==========================================
  submitContact(): void {
    const { name, email, message } = this.contact;
    if (!name.trim() || !email.trim() || !message.trim()) {
      this.notify.error('Please fill in your name, email and message.');
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      this.notify.error('Please enter a valid email address.');
      return;
    }

    this.contactSending.set(true);
    this.http.post('/api/v1/contact', this.contact).pipe(
      finalize(() => this.contactSending.set(false)),
    ).subscribe({
      next: () => {
        this.notify.success('Thanks! Your message has been sent. We\'ll be in touch soon.');
        this.contact = { name: '', email: '', subject: '', message: '' };
      },
      error: () => this.notify.error('Could not send your message. Please try again later.'),
    });
  }
}