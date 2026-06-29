import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css'],
})
export default class ProductDetailComponent implements OnInit {
  
  // ─── Main Product Data ───
  product = {
    id: 101,
    brand: 'Tech.Luxe',
    name: 'Quantum Pro 15" Creator Laptop',
    price: 1299.00,
    originalPrice: 1499.00,
    rating: 4.8,
    reviews: 124,
    stock: 12,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', // Main
      'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80', // Side
      'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80', // Close up
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80'  // Lifestyle
    ],
    shortDesc: 'Engineered for creators. Featuring a stunning 4K OLED display, 32GB RAM, and a dedicated RTX 4070 GPU packed into a sleek, aerospace-grade aluminum chassis.',
    specs: [
      { label: 'Processor', value: 'Intel Core i9-13900H' },
      { label: 'Graphics', value: 'NVIDIA RTX 4070 8GB' },
      { label: 'Display', value: '15.6" 4K OLED, 120Hz' },
      { label: 'Memory', value: '32GB LPDDR5' },
      { label: 'Storage', value: '1TB NVMe Gen4 SSD' },
      { label: 'Weight', value: '1.8 kg (3.9 lbs)' }
    ]
  };

  // ─── Component State ───
  mainImage: string = '';
  quantity: number = 1;
  activeTab: 'description' | 'specs' | 'reviews' = 'description';

  // ─── Dynamic Sections Data ───
  bundleProducts = [
    { id: 201, name: 'Ergonomic Laptop Stand', price: 45.00, image: 'https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?auto=format&fit=crop&w=300&q=80' },
    { id: 202, name: 'Pro Wireless Mouse', price: 79.00, image: 'https://images.unsplash.com/photo-1527814050087-379381547949?auto=format&fit=crop&w=300&q=80' }
  ];

  recommended = [
    { id: 301, name: 'Ultra-Wide 34" Monitor', price: 499.00, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80' },
    { id: 302, name: 'Mechanical Auth Keyboard', price: 129.00, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=400&q=80' },
    { id: 303, name: '100W GaN Fast Charger', price: 59.00, image: 'https://images.unsplash.com/photo-1586280915668-3f5f3e481c95?auto=format&fit=crop&w=400&q=80' },
    { id: 304, name: 'Premium Leather Sleeve', price: 39.00, image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=400&q=80' }
  ];

  reviews = [
    { author: 'Michael R.', rating: 5, date: 'October 12, 2025', text: 'Absolutely phenomenal machine. It handles 4K video rendering like an absolute dream.' },
    { author: 'Sarah J.', rating: 4, date: 'September 28, 2025', text: 'Beautiful display and amazing build quality. The battery life is okay, but expected for this much power.' }
  ];

  ngOnInit() {
    this.mainImage = this.product.images[0];
  }

  setMainImage(img: string) {
    this.mainImage = img;
  }

  incrementQty() {
    if (this.quantity < this.product.stock) this.quantity++;
  }

  decrementQty() {
    if (this.quantity > 1) this.quantity--;
  }

  getBundleTotal() {
    const extras = this.bundleProducts.reduce((sum, p) => sum + p.price, 0);
    return this.product.price + extras;
  }

  addToCart() {
    // Implement Add to Cart logic
    alert(`Added ${this.quantity}x ${this.product.name} to cart.`);
  }

  addBundleToCart() {
    alert('Added Bundle to cart.');
  }
}