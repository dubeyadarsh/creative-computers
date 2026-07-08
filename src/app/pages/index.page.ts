import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FooterComponent } from "../components/footer/footer";
import { ShopService, Category, Product } from '../services/shop.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export default class HomePageComponent implements OnInit {
  private router = inject(Router);
  private shopService = inject(ShopService);

  isLoadingCategories = true;
  isLoadingProducts = true;

  allCategories: Category[] = [];
  homeCategories: Category[] = [];
  featuredProducts: Product[] = [];
  trendingProducts: Product[] = [];
  totalProducts = 0;

  // New: Wishlist Set to track favorite products
  wishlist = new Set<string>();

  stats = [
    { label: 'Active Users', value: '150+' },
    { label: 'Products Sold', value: '2,400+' },
    { label: 'Categories', value: '100+' },
    { label: 'Rating', value: '4.9/5' }
  ];

  reviews = [
    { name: 'Rahul S.', role: 'Software Engineer', text: 'Got my RTX 4090 delivered in 2 days. The packaging was pristine and the customer service is unmatched.', rating: 5 },
    { name: 'Priya M.', role: 'UI/UX Designer', text: 'Their custom PC builds are a work of art. My rendering times have been cut in half. Highly recommend!', rating: 5 },
    { name: 'Amit D.', role: 'Gamer', text: 'Best prices in the market for premium gear. The local AMC service gives me total peace of mind.', rating: 4 },
    { name: 'Neha K.', role: 'Content Creator', text: 'They helped me set up my entire studio network and CCTV. Flawless execution.', rating: 5 }
  ];

  ngOnInit() {
    this.loadHomeData();
  }

  loadHomeData() {
    this.shopService.getCategories().subscribe({
      next: (res) => {
        this.allCategories = res.data;
        this.homeCategories = this.allCategories.filter(c => c.show_on_home === true);
        this.isLoadingCategories = false;
      },
      error: () => this.isLoadingCategories = false
    });

    this.shopService.getProducts(1, 12).subscribe({
      next: (res) => {
        const products = res.data;
        this.trendingProducts = products.slice(0, 4);
        this.featuredProducts = products.slice(4, 12);
        if (res.meta) this.totalProducts = res.meta.total;
        this.isLoadingProducts = false;
      },
      error: () => this.isLoadingProducts = false
    });
  }

  // --- New Wishlist Methods ---
  toggleWishlist(productId: string | undefined): void {
    if (!productId) return;
    if (this.wishlist.has(productId)) {
      this.wishlist.delete(productId);
    } else {
      this.wishlist.add(productId);
    }
  }

  isWishlisted(productId: string | undefined): boolean {
    if (!productId) return false;
    return this.wishlist.has(productId);
  }

  getCategoryName(id: string): string {
    const cat = this.allCategories.find(c => c.id === id);
    return cat ? cat.name : 'Component';
  }

  getPreviewSpecs(prod: Product): string[] {
    if (!prod.attributes) return [];
    return Object.keys(prod.attributes).slice(0, 2);
  }

  shopHardware() {
    this.router.navigate(['/shops']);
  }
}