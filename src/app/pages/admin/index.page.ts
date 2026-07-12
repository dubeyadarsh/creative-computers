import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouteMeta } from '@analogjs/router';
import { ShopService, CategoryAttribute } from '../../services/shop.service';
import { NotificationService } from '../../services/notification.service';
import { Category } from 'src/app/services/shop.types';
import { adminGuard } from '../../guards/auth.guard';

export const routeMeta: RouteMeta = {
  canActivate: [adminGuard],
};

// Defined Product interface to prevent 'any' type errors during build
export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_active?: boolean;
  attributes: Record<string, any>;
  image_urls?: string[];
}

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatIconModule],
  template: `
   <div class="account-container page-container">
  
  <header class="page-header">
    <div>
      <h1 class="page-title">Admin Dashboard</h1>
      <p class="page-sub">Manage your catalog — categories, products, stock &amp; visibility.</p>
    </div>
    <a routerLink="/account" class="btn-secondary back-account">
      <mat-icon>arrow_back</mat-icon> Account
    </a>
  </header>

  <!-- Horizontal Scrolling Tabs -->
  <nav class="tab-nav">
    <button class="tab-btn" [class.active]="activeTab === 'category'" (click)="activeTab = 'category'">Manage Categories</button>
    <button class="tab-btn" [class.active]="activeTab === 'product'" (click)="activeTab = 'product'">Manage Products</button>
  </nav>

  <!-- ==========================================
       TAB 2: MANAGE CATEGORIES
       ========================================== -->
  @if (activeTab === 'category') {
    <div class="admin-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 class="section-subtitle" style="margin: 0;">{{ isEditingCategory ? 'Edit Category' : 'Create New Category' }}</h2>
        @if (isEditingCategory) {
          <button class="btn-secondary" (click)="cancelCategoryEdit()">Cancel Edit</button>
        }
      </div>
      
      <form (ngSubmit)="submitCategory()" #catForm="ngForm">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label">Category Name</label>
            <input type="text" class="form-control" [(ngModel)]="newCategory.name" name="c_name" required placeholder="e.g. Mechanical Keyboards">
          </div>
          
          <div class="form-group full-width">
            <label class="form-label">Slug (URL)</label>
            <input type="text" class="form-control" [(ngModel)]="newCategory.slug" name="c_slug" required placeholder="e.g. mechanical-keyboards">
          </div>
          
          <div class="form-group full-width">
  <label class="form-label">Category Image {{ isEditingCategory ? '(Leave blank to keep existing)' : '' }}</label>
  <label class="file-upload-wrapper">
    <mat-icon style="font-size: 2rem; width:2rem; height:2rem; color: #94a3b8; margin-bottom: 0.5rem;">cloud_upload</mat-icon>
    <div style="font-weight: 600; color: #334155;">{{ selectedCategoryFileName || 'Click to browse or drag & drop' }}</div>
    <div style="font-size: 0.8rem; color: #94a3b8;">JPEG, PNG up to 5MB</div>
<input
  type="file"
  multiple
  (change)="onCategoryFileSelected($event)"
  accept="image/*">  </label>
</div>

          <div class="form-group full-width toggle-wrapper">
            <div>
              <label class="form-label">Show on Home Page</label>
              <div style="font-size: 0.8rem; color: #64748b;">Display this category in the scrolling navbar.</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="newCategory.show_on_home" name="c_show">
              <span class="slider"></span>
            </label>
          </div>

          <div class="form-group full-width attributes-box">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="form-label">Category Attributes</label>
              <button type="button" class="btn-secondary" (click)="addCategoryAttribute()">+ Add Field</button>
            </div>
            
            @for (attr of newCategory.attributes; track $index) {
              <div class="attribute-row">
                <input type="text" class="form-control" style="flex: 2" [(ngModel)]="attr.name" name="attr_name_{{$index}}" placeholder="Attribute Name (e.g. Color)">
                <select class="form-control" style="flex: 1" [(ngModel)]="attr.type" name="attr_type_{{$index}}">
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                </select>
                <button type="button" class="btn-remove" (click)="removeCategoryAttribute($index)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>

<button type="submit" class="btn-submit" [disabled]="isSubmitting || !catForm.form.valid || (!isEditingCategory && selectedCategoryFiles.length === 0)">
          @if (isSubmitting) { <mat-icon class="spin-icon">autorenew</mat-icon> Saving... } 
          @else { {{ isEditingCategory ? 'Update Category' : 'Save Category' }} }
        </button>
      </form>

      <!-- Category List for Editing -->
      <hr style="margin: 3rem 0; border: 1px solid #e2e8f0;">
      <h3 class="form-label" style="font-size: 1.1rem; margin-bottom: 1rem;">Existing Categories</h3>
      <div class="list-container">
        @for (cat of categories; track cat.id) {
          <div class="list-item">
            <div class="li-media">
              @if (cat.image_urls && cat.image_urls.length > 0) {
                <img [src]="cat.image_urls[0]" [alt]="cat.name" />
              } @else {
                <div class="li-media--ph"><mat-icon>category</mat-icon></div>
              }
            </div>
            <div class="li-info">
              <span class="li-name">{{ cat.name }}</span>
              @if (cat.show_on_home) { <span class="badge badge-home">On Home</span> }
            </div>
            <div class="list-item-actions">
              <button class="icon-btn" title="Edit" (click)="editCategory(cat)">
                <mat-icon>edit</mat-icon>
              </button>
              <button class="icon-btn icon-btn--danger" title="Delete" (click)="deleteCategory(cat)" [disabled]="isSubmitting">
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  }

  <!-- ==========================================
       TAB 3: MANAGE PRODUCTS
       ========================================== -->
  @if (activeTab === 'product') {
    <div class="admin-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 class="section-subtitle" style="margin: 0;">{{ isEditingProduct ? 'Edit Product' : 'Create New Product' }}</h2>
        @if (isEditingProduct) {
          <button class="btn-secondary" (click)="cancelProductEdit()">Cancel Edit</button>
        }
      </div>
      
      <form (ngSubmit)="submitProduct()" #prodForm="ngForm">
        <div class="form-grid">
          
          <div class="form-group full-width">
            <label class="form-label">Product Name</label>
            <input type="text" class="form-control" [(ngModel)]="newProduct.name" name="p_name" required>
          </div>
          
          <div class="form-group full-width">
            <label class="form-label">Description</label>
            <textarea class="form-control" [(ngModel)]="newProduct.description" name="p_desc" required></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Price (₹)</label>
            <input type="number" class="form-control" [(ngModel)]="newProduct.price" name="p_price" required min="0">
          </div>

          <div class="form-group">
            <label class="form-label">Stock Quantity</label>
            <input type="number" class="form-control" [(ngModel)]="newProduct.stock" name="p_stock" required min="0">
          </div>

          <div class="form-group full-width">
            <label class="form-label">Select Category</label>
            <select class="form-control" [(ngModel)]="newProduct.category_id" name="p_cat" required (change)="onCategorySelect()">
              <option value="" disabled selected>-- Choose Category --</option>
              @for (cat of categories; track cat.id) {
                <option [value]="cat.id">{{ cat.name }}</option>
              }
            </select>
          </div>

          @if (selectedCategoryAttributes.length > 0) {
            <div class="form-group full-width attributes-box">
              <label class="form-label">Product Specifications</label>
              <div class="form-grid">
                @for (attr of selectedCategoryAttributes; track attr.name) {
                  <div class="form-group">
                    <label class="form-label">{{ attr.name }}</label>
                    <input [type]="attr.type" class="form-control" [(ngModel)]="newProduct.attributes[attr.name]" name="p_attr_{{attr.name}}" required>
                  </div>
                }
              </div>
            </div>
          }

          <div class="form-group full-width toggle-wrapper">
            <label class="form-label">Mark as Trending (Shows in Promo Carousel)</label>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="newProduct.is_trending" name="p_trend">
              <span class="slider"></span>
            </label>
          </div>

          <div class="form-group full-width toggle-wrapper">
            <label class="form-label">Mark as New Arrival</label>
            <label class="toggle-switch">
              <input type="checkbox" [(ngModel)]="newProduct.is_new_arrival" name="p_new">
              <span class="slider"></span>
            </label>
          </div>

          <!-- Image Upload -->
          <div class="form-group full-width">
            <label class="form-label">Product Image {{ isEditingProduct ? '(Leave blank to keep existing)' : '' }}</label>
            <label class="file-upload-wrapper">
              <mat-icon style="font-size: 2rem; width:2rem; height:2rem; color: #94a3b8; margin-bottom: 0.5rem;">cloud_upload</mat-icon>
              <div style="font-weight: 600; color: #334155;">{{ selectedFileName || 'Click to browse or drag & drop' }}</div>
              <div style="font-size: 0.8rem; color: #94a3b8;">JPEG, PNG up to 5MB</div>
              <input type="file" (change)="onFileSelected($event)" accept="image/*">
            </label>
          </div>
          
        </div>

        <!-- In edit mode, file is optional. In create mode, file is required. -->
        <button type="submit" class="btn-submit" [disabled]="isSubmitting || !prodForm.form.valid || (!isEditingProduct && !selectedFile)">
          @if (isSubmitting) { <mat-icon class="spin-icon">autorenew</mat-icon> Uploading... } 
          @else { {{ isEditingProduct ? 'Update Product' : 'Publish Product' }} }
        </button>
      </form>

      <!-- Product List for Editing -->
      <hr style="margin: 3rem 0; border: 1px solid #e2e8f0;">

      <div class="list-header">
        <h3 class="form-label" style="font-size: 1.1rem; margin: 0;">
          Existing Products <span class="muted-count">({{ productTotal }})</span>
        </h3>
        <div class="search-inline">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Search products…" [(ngModel)]="productSearch" (ngModelChange)="onProductSearch($event)" name="prod_search" />
          @if (productSearch) { <button type="button" class="clear-x" (click)="clearProductSearch()">✕</button> }
        </div>
      </div>

      @if (productsLoading) {
        <div class="list-container">
          @for (s of [1,2,3,4,5]; track s) {
            <div class="list-item list-item--sk">
              <div class="li-media sk-box"></div>
              <div class="li-info"><span class="sk-box sk-line"></span></div>
            </div>
          }
        </div>
      } @else if (products.length === 0) {
        <div class="empty-note">
          <mat-icon>inventory_2</mat-icon>
          <p>No products found{{ productSearch ? ' for “' + productSearch + '”' : '' }}.</p>
        </div>
      } @else {
        <div class="list-container">
          @for (prod of products; track prod.id) {
            <div class="list-item" [class.list-item--hidden]="prod.is_active === false">
              <div class="li-media">
                @if (prod.image_urls && prod.image_urls.length > 0) {
                  <img [src]="prod.image_urls[0]" [alt]="prod.name" />
                } @else {
                  <div class="li-media--ph"><mat-icon>image</mat-icon></div>
                }
              </div>
              <div class="li-info">
                <span class="li-name">{{ prod.name }}</span>
                <div class="li-meta">
                  <span class="li-price">₹{{ prod.price | number:'1.0-0' }}</span>
                  @if (prod.stock > 0) {
                    <span class="badge badge-stock">In stock · {{ prod.stock }}</span>
                  } @else {
                    <span class="badge badge-oos">Out of stock</span>
                  }
                  @if (prod.is_active === false) { <span class="badge badge-hidden">Hidden</span> }
                  @if (prod.is_trending) { <span class="badge badge-trend">Trending</span> }
                </div>
              </div>
              <div class="list-item-actions">
                <button class="icon-btn" title="Edit" (click)="editProduct(prod)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button class="icon-btn" [title]="prod.stock > 0 ? 'Mark out of stock' : 'Restock (set to 1)'" (click)="toggleStock(prod)" [disabled]="rowBusyId === prod.id">
                  <mat-icon>{{ prod.stock > 0 ? 'remove_shopping_cart' : 'add_shopping_cart' }}</mat-icon>
                </button>
                <button class="icon-btn" [title]="prod.is_active === false ? 'Show on store' : 'Hide from store'" (click)="toggleHidden(prod)" [disabled]="rowBusyId === prod.id">
                  <mat-icon>{{ prod.is_active === false ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <button class="icon-btn icon-btn--danger" title="Delete" (click)="deleteProduct(prod)" [disabled]="rowBusyId === prod.id">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (productTotalPages > 1) {
          <div class="pagination">
            <button class="page-btn" [disabled]="productPage === 1" (click)="goToProductPage(productPage - 1)">
              <mat-icon>chevron_left</mat-icon> Prev
            </button>
            <span class="page-info">Page {{ productPage }} of {{ productTotalPages }}</span>
            <button class="page-btn" [disabled]="productPage >= productTotalPages" (click)="goToProductPage(productPage + 1)">
              Next <mat-icon>chevron_right</mat-icon>
            </button>
          </div>
        }
      }
    </div>
  }
</div>
  `,
  styles: [`
   /* --- ALL PREVIOUS STYLES REMAIN --- */
.account-container { padding-top: 2rem; padding-bottom: 5rem; max-width: 1000px; margin: 0 auto; }
.page-header { margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.page-title { font-size: 2rem; font-weight: 800; color: var(--text-main, #0f172a); letter-spacing: -0.03em; }
.page-sub { color: var(--text-muted, #64748b); font-size: 0.9rem; margin-top: 0.25rem; }
.back-account { display: inline-flex; align-items: center; gap: 0.35rem; text-decoration: none; color: #334155; flex-shrink: 0; }
.back-account mat-icon { font-size: 18px; width: 18px; height: 18px; }
.tab-nav { display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 2px solid var(--border-color, #e2e8f0); overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.tab-nav::-webkit-scrollbar { display: none; }
.tab-btn { background: transparent; border: none; padding: 1rem 0.5rem; font-size: 1rem; font-weight: 600; color: var(--text-muted, #64748b); cursor: pointer; position: relative; white-space: nowrap; transition: color 0.3s ease; }
.tab-btn:hover, .tab-btn.active { color: var(--primary-color, #3b82f6); }
.tab-btn.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background: var(--primary-color, #3b82f6); border-radius: 3px 3px 0 0; }
.admin-card { background: #ffffff; border-radius: 16px; padding: 2.5rem; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04); border: 1px solid rgba(0,0,0,0.02); }
.section-subtitle { font-size: 1.4rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--text-main); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
.form-group { display: flex; flex-direction: column; gap: 0.5rem; }
.form-group.full-width { grid-column: 1 / -1; }
.form-label { font-size: 0.9rem; font-weight: 600; color: var(--text-main); }
.form-control { padding: 0.85rem 1rem; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 0.95rem; background: #f8fafc; transition: all 0.2s ease; font-family: inherit; }
.form-control:focus { outline: none; border-color: var(--primary-color, #3b82f6); background: #ffffff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
textarea.form-control { resize: vertical; min-height: 100px; }
.attributes-box { background: #f1f5f9; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.attribute-row { display: flex; gap: 1rem; align-items: center; }
.btn-remove { background: #fee2e2; color: #ef4444; border: none; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s; }
.btn-remove:hover { background: #fecaca; }
.toggle-wrapper { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
.toggle-switch { position: relative; display: inline-block; width: 50px; height: 28px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .3s; border-radius: 34px; }
.slider:before { position: absolute; content: ""; height: 22px; width: 22px; left: 3px; bottom: 3px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
input:checked + .slider { background-color: var(--primary-color, #3b82f6); }
input:checked + .slider:before { transform: translateX(22px); }
.file-upload-wrapper { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 2rem; text-align: center; background: #f8fafc; cursor: pointer; transition: border-color 0.3s; }
.file-upload-wrapper:hover { border-color: var(--primary-color); }
.file-upload-wrapper input[type="file"] { display: none; }
.btn-submit { background: var(--text-main); color: white; border: none; padding: 1rem 2rem; font-size: 1rem; font-weight: 700; border-radius: 10px; cursor: pointer; width: 100%; margin-top: 1.5rem; transition: background 0.2s, transform 0.2s; display: flex; justify-content: center; align-items: center; gap: 0.5rem; }
.btn-submit:hover { background: #000; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
.btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-danger { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-danger:hover:not(:disabled) { background: #fecaca; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.list-item-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

/* --- LIST VIEWS --- */
.list-container { display: flex; flex-direction: column; gap: 0.6rem; }
.list-item { display: flex; align-items: center; gap: 0.9rem; padding: 0.7rem 0.9rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; font-weight: 500; transition: box-shadow 0.2s, border-color 0.2s; }
.list-item:hover { box-shadow: 0 6px 18px rgba(15,23,42,0.06); border-color: #cbd5e1; }
.list-item--hidden { opacity: 0.62; background: #f8fafc; }

.li-media { width: 48px; height: 48px; border-radius: 10px; overflow: hidden; flex-shrink: 0; background: #f1f5f9; }
.li-media img { width: 100%; height: 100%; object-fit: cover; }
.li-media--ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
.li-media--ph mat-icon { font-size: 22px; width: 22px; height: 22px; }

.li-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.3rem; }
.li-name { font-weight: 700; color: var(--text-main, #0f172a); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.li-meta { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.li-price { font-weight: 700; color: #0f172a; font-size: 0.9rem; }

.badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.2rem 0.5rem; border-radius: 999px; }
.badge-stock { background: #ecfdf5; color: #059669; }
.badge-oos { background: #fef2f2; color: #dc2626; }
.badge-hidden { background: #f1f5f9; color: #64748b; }
.badge-trend { background: #fff7ed; color: #ea580c; }
.badge-home { background: #eef2ff; color: #4f46e5; }

/* Icon action buttons */
.icon-btn { width: 38px; height: 38px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; color: #475569; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.18s; }
.icon-btn:hover:not(:disabled) { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; transform: translateY(-1px); }
.icon-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.icon-btn mat-icon { font-size: 19px; width: 19px; height: 19px; }
.icon-btn--danger { color: #dc2626; }
.icon-btn--danger:hover:not(:disabled) { background: #fee2e2; color: #b91c1c; border-color: #fecaca; }

/* List header + inline search */
.list-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; }
.muted-count { color: #94a3b8; font-weight: 600; }
.search-inline { display: flex; align-items: center; gap: 0.4rem; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 999px; padding: 0.35rem 0.85rem; min-width: 220px; }
.search-inline mat-icon { color: #94a3b8; font-size: 20px; width: 20px; height: 20px; }
.search-inline input { border: none; background: transparent; outline: none; font-size: 0.9rem; font-family: inherit; flex: 1; min-width: 0; }
.clear-x { border: none; background: none; color: #94a3b8; cursor: pointer; font-size: 0.85rem; }

/* Pagination */
.pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
.page-btn { display: inline-flex; align-items: center; gap: 0.2rem; padding: 0.5rem 1rem; border: 1px solid #cbd5e1; border-radius: 10px; background: #fff; font-weight: 600; color: #334155; cursor: pointer; transition: all 0.18s; }
.page-btn:hover:not(:disabled) { background: #f1f5f9; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
.page-info { font-size: 0.88rem; font-weight: 600; color: #64748b; }

/* Empty + skeleton */
.empty-note { text-align: center; padding: 2.5rem 1rem; color: #94a3b8; }
.empty-note mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 0.5rem; }
.list-item--sk { pointer-events: none; }
.sk-box { background: linear-gradient(90deg,#eef2f6 25%,#f6f8fa 50%,#eef2f6 75%); background-size: 200% 100%; animation: sk 1.3s ease-in-out infinite; }
.sk-line { height: 14px; width: 55%; border-radius: 6px; }
@keyframes sk { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 768px) {
  .account-container { padding: 1rem; }
  .admin-card { padding: 1.5rem; border-radius: 12px; }
  .form-grid { grid-template-columns: 1fr; gap: 1rem; }
  .page-title { font-size: 1.5rem; }
  .attribute-row { flex-direction: column; align-items: stretch; background: #fff; padding: 1rem; border-radius: 8px; }
  .btn-remove { width: 100%; }
  .tab-nav { padding-bottom: 5px; }
  .tab-btn { font-size: 0.9rem; padding: 0.75rem 0.5rem; }
}
  `]
})
export default class AccountPage implements OnInit {
  private shopService = inject(ShopService);
  private notify = inject(NotificationService);
  
  // UI State
  activeTab: 'category' | 'product' = 'category';
  isSubmitting: boolean = false;

  // Global Data
  categories: Category[] = [];
  products: Product[] = []; // Used to populate the edit list

  // Product list pagination + search
  productPage = 1;
  readonly productPageSize = 10;
  productTotal = 0;
  productTotalPages = 1;
  productsLoading = false;
  productSearch = '';
  rowBusyId: string | null = null;
  private productSearchTimer: any = null;

  // =====================================
  // CATEGORY FORM STATE & LOGIC
  // =====================================
  isEditingCategory = false;
  currentCategoryId: string | null = null;
  
  newCategory: Partial<Category> & { attributes: CategoryAttribute[] } = this.getEmptyCategory();
  
  // State for category image files (multiple)
  selectedCategoryFiles: File[] = [];
  selectedCategoryFileName: string = '';
  existingCategoryImageUrls: string[] = []; // to preserve old images on update

  getEmptyCategory() {
    return { name: '', slug: '', show_on_home: false, attributes: [] };
  }

  addCategoryAttribute(): void {
    this.newCategory.attributes.push({ name: '', type: 'text' });
  }

  removeCategoryAttribute(index: number): void {
    this.newCategory.attributes.splice(index, 1);
  }

  onCategoryFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.selectedCategoryFiles = Array.from(input.files);
    this.selectedCategoryFileName = this.selectedCategoryFiles.map(f => f.name).join(', ');
  }

  editCategory(cat: Category): void {
    this.isEditingCategory = true;
    this.currentCategoryId = cat.id || null;
    this.newCategory = JSON.parse(JSON.stringify(cat));
    // Store existing image URLs if your Category type includes them
    this.existingCategoryImageUrls = (cat as any).image_urls || [];
    this.selectedCategoryFiles = [];
    this.selectedCategoryFileName = 'Keep existing image(s)';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelCategoryEdit(): void {
    this.isEditingCategory = false;
    this.currentCategoryId = null;
    this.newCategory = this.getEmptyCategory();
    this.selectedCategoryFiles = [];
    this.selectedCategoryFileName = '';
    this.existingCategoryImageUrls = [];
  }

  submitCategory(): void {
    // Require at least one file only when creating
    if (!this.isEditingCategory && this.selectedCategoryFiles.length === 0) {
      this.notify.error('Please upload at least one category image.');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('name', this.newCategory.name || '');
    formData.append('slug', this.newCategory.slug || '');
    formData.append('show_on_home', String(this.newCategory.show_on_home));
    formData.append('attributes', JSON.stringify(this.newCategory.attributes));

    // On update, tell backend which existing images to keep
    if (this.isEditingCategory) {
      formData.append('existing_images', JSON.stringify(this.existingCategoryImageUrls));
    }

    // Append new files
    this.selectedCategoryFiles.forEach(file => {
      formData.append('images', file);
    });

    const request = this.isEditingCategory && this.currentCategoryId
      ? this.shopService.updateCategory(this.currentCategoryId, formData)
      : this.shopService.createCategory(formData);

    request.subscribe({
      next: () => {
        this.notify.success(`Category ${this.isEditingCategory ? 'updated' : 'created'} successfully!`);
        this.isSubmitting = false;
        this.loadCategories();
        this.cancelCategoryEdit();
      },
      error: (err: any) => {
        console.error(err);
        this.notify.error(`Failed to ${this.isEditingCategory ? 'update' : 'create'} category.`);
        this.isSubmitting = false;
      }
    });
  }

  deleteCategory(cat: Category): void {
    if (!cat.id) return;

    const confirmed = confirm(`Delete category "${cat.name}"? This cannot be undone.`);
    if (!confirmed) return;

    this.isSubmitting = true;
    this.shopService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.notify.success('Category deleted successfully!');
        this.isSubmitting = false;
        // If we were editing the deleted category, reset the form.
        if (this.currentCategoryId === cat.id) {
          this.cancelCategoryEdit();
        }
        this.loadCategories();
      },
      error: (err: any) => {
        console.error(err);
        const message =
          err?.error?.statusMessage || err?.error?.message || 'Failed to delete category.';
        this.notify.error(message);
        this.isSubmitting = false;
      }
    });
  }

  // =====================================
  // PRODUCT FORM STATE & LOGIC
  // =====================================
  isEditingProduct = false;
  currentProductId: string | null = null;
  
  newProduct: Product = this.getEmptyProduct();
  selectedFile: File | null = null;
  selectedFileName: string = ''; // for display
  selectedCategoryAttributes: CategoryAttribute[] = [];

  getEmptyProduct(): Product {
    return { name: '', description: '', price: 0, stock: 1, category_id: '', is_trending: false, is_new_arrival: false, attributes: {} };
  }

  editProduct(prod: Product): void {
    this.isEditingProduct = true;
    this.currentProductId = prod.id || null;
    this.newProduct = JSON.parse(JSON.stringify(prod));
    
    // Trigger category selection to load the attributes UI
    this.onCategorySelect(); 
    
    // Ensure existing attributes populate correctly
    this.newProduct.attributes = typeof prod.attributes === 'string' ? JSON.parse(prod.attributes) : (prod.attributes || {});
    
    this.selectedFile = null;
    this.selectedFileName = 'Keep existing image'; 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelProductEdit(): void {
    this.isEditingProduct = false;
    this.currentProductId = null;
    this.newProduct = this.getEmptyProduct();
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedCategoryAttributes = [];
  }

  onCategorySelect(): void {
    const selectedCat = this.categories.find(c => c.id === this.newProduct.category_id);
    this.selectedCategoryAttributes = selectedCat?.attributes || [];
    
    // Only reset attributes if we are NOT actively setting up an edit
    if (!this.isEditingProduct) {
      this.newProduct.attributes = {};
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  submitProduct(): void {
    // File is only strictly required if we are creating a new product
    if (!this.isEditingProduct && !this.selectedFile) {
      this.notify.error('Please upload a product image.');
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('name', this.newProduct.name);
    formData.append('description', this.newProduct.description);
    formData.append('price', this.newProduct.price.toString());
    formData.append('stock', this.newProduct.stock.toString());
    formData.append('category_id', this.newProduct.category_id);
    
    formData.append('is_trending', this.newProduct.is_trending.toString());
    formData.append('is_new_arrival', this.newProduct.is_new_arrival.toString());
    formData.append('attributes', JSON.stringify(this.newProduct.attributes));
    
    // Only append file if one was selected (crucial for updates)
    if (this.selectedFile) {
      formData.append('images', this.selectedFile);
    }

    const request = this.isEditingProduct && this.currentProductId
      ? this.shopService.updateProduct(this.currentProductId, formData)
      : this.shopService.createProduct(formData);

    request.subscribe({
      next: () => {
        this.notify.success(`Product ${this.isEditingProduct ? 'updated' : 'uploaded'} successfully!`);
        this.isSubmitting = false;
        this.loadProducts();
        this.cancelProductEdit();
      },
      error: (err: any) => {
        console.error(err);
        this.notify.error(`Failed to ${this.isEditingProduct ? 'update' : 'upload'} product.`);
        this.isSubmitting = false;
      }
    });
  }

  // =====================================
  // INITIALIZATION & DATA LOADING
  // =====================================
  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.shopService.getCategories().subscribe({
      next: (res: any) => this.categories = res.data || res,
      error: (err: any) => {
        console.error('Failed to load categories', err);
        this.notify.error('Failed to load categories.');
      }
    });
  }

  loadProducts(): void {
    this.productsLoading = true;
    this.shopService
      .queryProducts({
        page: this.productPage,
        limit: this.productPageSize,
        q: this.productSearch.trim() || undefined,
        sort: 'newest',
        includeHidden: true, // admins see hidden products too
      })
      .subscribe({
        next: (res) => {
          this.products = (res.data as unknown as Product[]) || [];
          this.productTotal = res.meta?.total ?? this.products.length;
          this.productTotalPages = Math.max(1, Math.ceil(this.productTotal / this.productPageSize));
          this.productsLoading = false;
        },
        error: (err: any) => {
          console.error('Failed to load products', err);
          this.notify.error('Failed to load products.');
          this.productsLoading = false;
        },
      });
  }

  goToProductPage(page: number): void {
    if (page < 1 || page > this.productTotalPages) return;
    this.productPage = page;
    this.loadProducts();
  }

  onProductSearch(_value: string): void {
    // Debounce so we don't hammer the API on every keystroke.
    clearTimeout(this.productSearchTimer);
    this.productSearchTimer = setTimeout(() => {
      this.productPage = 1;
      this.loadProducts();
    }, 400);
  }

  clearProductSearch(): void {
    this.productSearch = '';
    this.productPage = 1;
    this.loadProducts();
  }

  toggleStock(prod: Product): void {
    if (!prod.id) return;
    const newStock = prod.stock > 0 ? 0 : 1;
    this.rowBusyId = prod.id;
    this.shopService.patchProduct(prod.id, { stock: newStock }).subscribe({
      next: () => {
        prod.stock = newStock;
        this.rowBusyId = null;
        this.notify.success(newStock === 0 ? 'Marked out of stock.' : 'Product restocked.');
      },
      error: () => {
        this.rowBusyId = null;
        this.notify.error('Could not update stock.');
      },
    });
  }

  toggleHidden(prod: Product): void {
    if (!prod.id) return;
    const nextActive = prod.is_active === false; // if currently hidden -> show
    this.rowBusyId = prod.id;
    this.shopService.patchProduct(prod.id, { is_active: nextActive }).subscribe({
      next: () => {
        prod.is_active = nextActive;
        this.rowBusyId = null;
        this.notify.success(nextActive ? 'Product is now visible.' : 'Product hidden from store.');
      },
      error: () => {
        this.rowBusyId = null;
        this.notify.error('Could not update visibility.');
      },
    });
  }

  deleteProduct(prod: Product): void {
    if (!prod.id) return;
    if (!confirm(`Delete product "${prod.name}"? This cannot be undone.`)) return;
    this.rowBusyId = prod.id;
    this.shopService.deleteProduct(prod.id).subscribe({
      next: () => {
        this.notify.success('Product deleted.');
        this.rowBusyId = null;
        if (this.currentProductId === prod.id) this.cancelProductEdit();
        // If the last item on a page was deleted, step back a page.
        if (this.products.length === 1 && this.productPage > 1) this.productPage--;
        this.loadProducts();
      },
      error: (err: any) => {
        console.error(err);
        this.rowBusyId = null;
        this.notify.error('Could not delete product.');
      },
    });
  }
}