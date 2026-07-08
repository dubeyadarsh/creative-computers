import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">Your Cart</h1>
      
      <div class="cart-layout">
        <div class="cart-items">
          <div class="cart-card">
            <img src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=200&q=80" alt="Product" class="cart-img"/>
            <div class="cart-details">
              <h3 class="product-name">LuxeBook Pro 14"</h3>
              <p class="product-brand">Tech.Luxe</p>
              <div class="price-qty-row">
                <span class="price">$1,499.00</span>
                <div class="qty-selector">
                  <button>-</button>
                  <input type="number" value="1" readonly>
                  <button>+</button>
                </div>
              </div>
            </div>
            <button class="remove-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        </div>

        <div class="cart-summary">
          <h3 class="summary-title">Order Summary</h3>
          <div class="summary-row"><span class="text-muted">Subtotal</span><span class="font-bold">$1,499.00</span></div>
          <div class="summary-row"><span class="text-muted">Shipping</span><span class="font-bold">Calculated at checkout</span></div>
          <div class="summary-divider"></div>
          <div class="summary-row total"><span class="text-muted">Total</span><span class="font-black">$1,499.00</span></div>
          <button class="btn-primary checkout-btn">Proceed to Checkout</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: calc(var(--nav-top-height) + 2rem) 1.25rem 6rem; max-width: 1200px; margin: 0 auto; min-height: 100dvh; }
    .page-title { font-family: var(--font-display); font-size: var(--text-2xl); font-weight: 800; margin-bottom: 2rem; color: var(--neutral-900); }
    
    .cart-layout { display: flex; flex-direction: column; gap: 2rem; }
    
    .cart-card { display: flex; gap: 1rem; background: var(--neutral-0); border: 1px solid var(--neutral-200); border-radius: var(--radius-xl); padding: 1rem; position: relative; box-shadow: var(--shadow-card); }
    .cart-img { width: 80px; height: 80px; object-fit: contain; background: var(--neutral-50); border-radius: var(--radius-md); padding: 0.5rem; }
    .cart-details { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
    .product-name { font-size: var(--text-sm); font-weight: 700; margin: 0; }
    .product-brand { font-size: var(--text-xs); color: var(--neutral-500); margin-bottom: 0.5rem; }
    
    .price-qty-row { display: flex; justify-content: space-between; align-items: center; }
    .price { font-family: var(--font-display); font-weight: 800; font-size: var(--text-md); }
    .qty-selector { display: flex; align-items: center; background: var(--neutral-50); border-radius: var(--radius-sm); }
    .qty-selector button { width: 28px; height: 28px; border: none; background: none; cursor: pointer; font-weight: bold; }
    .qty-selector input { width: 30px; text-align: center; border: none; background: transparent; font-size: var(--text-sm); }
    
    .remove-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: var(--neutral-400); cursor: pointer; transition: color 0.2s; }
    .remove-btn:hover { color: #ef4444; }
    .remove-btn svg { width: 18px; height: 18px; }

    .cart-summary { background: var(--neutral-50); border-radius: var(--radius-xl); padding: 1.5rem; border: 1px solid var(--neutral-200); }
    .summary-title { font-family: var(--font-display); font-size: var(--text-lg); margin: 0 0 1.5rem; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: var(--text-sm); }
    .summary-divider { height: 1px; background: var(--neutral-200); margin: 1.5rem 0; }
    .total { font-size: var(--text-lg); margin-bottom: 2rem; }
    .checkout-btn { width: 100%; height: 48px; border-radius: var(--radius-md); font-size: var(--text-sm); }
    .text-muted { color: var(--neutral-500); }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }

    @media (min-width: 1024px) {
      .cart-layout { flex-direction: row; align-items: flex-start; gap: 3rem; }
      .cart-items { flex: 1; }
      .cart-summary { width: 380px; position: sticky; top: calc(var(--nav-top-height) + 2rem); }
      .cart-img { width: 100px; height: 100px; }
    }
  `]
})
export default class CartPage {}