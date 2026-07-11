import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { ShopService, Category, Product } from '../services/shop.service';
import { MatIcon } from "@angular/material/icon";
import { defaultServerConditions } from 'vite';
@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [MatIcon]
})
export default class HomeComponent implements OnInit, OnDestroy {
  private shopService = inject(ShopService);

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
}