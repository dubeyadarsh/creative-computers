import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ShopService, Category, Product } from '../../services/shop.service';

interface Toast { id: number; message: string; type: 'success' | 'error'; }

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-container">
      <div class="toast-container">
        @for (toast of toasts; track toast.id) {
          <div class="toast" [ngClass]="toast.type">{{ toast.message }}</div>
        }
      </div>

      <div class="admin-header-area">
        <div class="admin-top-bar">
          <a routerLink="/account" class="back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"></path></svg>
            Back
          </a>
          <h1 class="page-title">Store Admin</h1>
          <div style="width: 60px;"></div>
        </div>
        <div class="segmented-control">
          <button [class.active]="activeView === 'categories'" (click)="activeView = 'categories'">1. Categories</button>
          <button [class.active]="activeView === 'products'" (click)="activeView = 'products'">2. Products</button>
        </div>
      </div>

      <div class="admin-content">
        
        @if (activeView === 'categories') {
          <div class="fade-in">
            <div class="card add-card" [class.edit-mode]="editingCategoryId">
              <div class="header-with-action">
                <h3>{{ editingCategoryId ? 'Edit Category' : 'Create Dynamic Category' }}</h3>
                @if (editingCategoryId) { <button type="button" class="btn-ghost-sm text-red" (click)="cancelCategoryEdit()">Cancel Edit</button> }
              </div>
              
              <form (ngSubmit)="submitCategory(categoryForm)" #categoryForm="ngForm">
                <div class="form-group">
                  <label>Category Name</label>
                  <input type="text" name="catName" [(ngModel)]="newCategory.name" required placeholder="e.g. Monitors">
                </div>

                <div class="form-group mt-2">
                  <label class="checkbox-label">
                    <input type="checkbox" name="showOnHome" [(ngModel)]="newCategory.show_on_home">
                    <span>Pin to Home Page Categories</span>
                  </label>
                </div>

                <div class="schema-builder mt-4">
                  <label>Custom Attributes</label>
                  @for (attr of newCategory.attributes; track $index) {
                    <div class="attribute-row">
                      <input type="text" [name]="'attrName'+$index" [(ngModel)]="attr.name" placeholder="Field Name" required>
                      <select [name]="'attrType'+$index" [(ngModel)]="attr.type">
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                      </select>
                      <button type="button" class="btn-icon text-red" (click)="removeAttribute($index)">✕</button>
                    </div>
                  }
                  <button type="button" class="btn-ghost mt-2" (click)="addAttribute()">+ Add Custom Field</button>
                </div>

                <button type="submit" class="btn-primary full-btn mt-6" [disabled]="!categoryForm.valid || isSubmitting">
                  {{ isSubmitting ? 'Saving...' : (editingCategoryId ? 'Update Category' : 'Save Category') }}
                </button>
              </form>
            </div>

            <h3 class="section-heading mt-6">Existing Categories</h3>
            <div class="list-grid">
               @for (cat of categories; track cat.id) {
                 <div class="list-item flex-col items-start" [class.highlight-row]="editingCategoryId === cat.id">
                    <div class="w-full flex-between">
                      <span class="fw-bold">{{ cat.name }} @if(cat.show_on_home){<span class="badge-home">★ Home</span>}</span>
                      <button class="btn-ghost-sm" (click)="editCategory(cat)">Edit</button>
                    </div>
                    <div class="schema-tags mt-2">
                      @for (attr of cat.attributes; track attr.name) {
                        <span class="badge">{{ attr.name }} ({{ attr.type }})</span>
                      }
                    </div>
                 </div>
               }
            </div>
          </div>
        }

        @if (activeView === 'products') {
          <div class="fade-in">
            <div class="card add-card" [class.edit-mode]="editingProductId">
              <div class="header-with-action">
                <h3>{{ editingProductId ? 'Edit Product' : 'Add Product' }}</h3>
                @if (editingProductId) { <button type="button" class="btn-ghost-sm text-red" (click)="cancelProductEdit(productForm)">Cancel Edit</button> }
              </div>
              
              <form (ngSubmit)="submitProduct(productForm)" #productForm="ngForm" class="responsive-grid">
                
                <div class="form-group full-width">
                  <label>1. Select Category</label>
                  <select name="category_id" [(ngModel)]="newProduct.category_id" (change)="onCategorySelect()" required class="highlight-select">
                    <option value="" disabled selected>-- Choose Category --</option>
                    @for (cat of categories; track cat.id) { <option [value]="cat.id">{{ cat.name }}</option> }
                  </select>
                </div>
                
                <div class="form-divider full-width">Base Details</div>

                <div class="form-group"><label>Product Name</label><input type="text" name="name" [(ngModel)]="newProduct.name" required></div>
                <div class="form-group"><label>Price ($)</label><input type="number" name="price" [(ngModel)]="newProduct.price" required></div>
                <div class="form-group"><label>Stock Qty</label><input type="number" name="stock" [(ngModel)]="newProduct.stock" required></div>

                <div class="form-group full-width mt-4 mb-4">
                  <label>Product Images</label>
                  
                  @if (existingImageUrls.length > 0) {
                    <div class="preview-grid mb-2">
                      <div class="full-width"><span class="text-xs text-muted">Currently Saved Images:</span></div>
                      @for (url of existingImageUrls; track $index) {
                        <div class="preview-card">
                          <img [src]="url" alt="Existing">
                          <button type="button" class="remove-btn" (click)="removeExistingImage($index)">✕</button>
                        </div>
                      }
                    </div>
                  }

                  <div class="file-upload-wrapper">
                    <input type="file" multiple accept="image/*" (change)="onFilesSelected($event)" id="fileInput" class="hidden-input">
                    <label for="fileInput" class="upload-dropzone">
                      <span class="icon">📸</span><span>Browse to add new images</span>
                    </label>
                  </div>

                  @if (imagePreviews.length > 0) {
                    <div class="preview-grid mt-4">
                      <div class="full-width"><span class="text-xs text-muted">New Images to Upload:</span></div>
                      @for (preview of imagePreviews; track $index) {
                        <div class="preview-card new-upload">
                          <img [src]="preview" alt="Preview">
                          <button type="button" class="remove-btn" (click)="removePreview($index)">✕</button>
                        </div>
                      }
                    </div>
                  }
                </div>
                
                <div class="form-group full-width"><label>Description</label><textarea rows="3" name="description" [(ngModel)]="newProduct.description"></textarea></div>

                @if (selectedCategorySchema && selectedCategorySchema.attributes?.length) {
                  <div class="form-divider full-width custom-section">Category Specific Details</div>
                  @for (attr of selectedCategorySchema.attributes; track attr.name) {
                    <div class="form-group">
                      <label>{{ attr.name }}</label>
                      <input [type]="attr.type" [name]="'attr_' + attr.name" [(ngModel)]="newProduct.attributes[attr.name]" required>
                    </div>
                  }
                }

                <div class="form-group full-width mt-6">
                  <button type="submit" class="btn-primary full-btn" [disabled]="!productForm.valid || isSubmitting">
                    {{ isSubmitting ? 'Processing...' : (editingProductId ? 'Update Product' : 'Save Product') }}
                  </button>
                </div>
              </form>
            </div>

            <div class="header-with-action mt-6">
              <h3 class="section-heading" style="margin:0;">Existing Products</h3>
              <span class="text-xs text-muted">Total: {{ totalProducts }}</span>
            </div>

            <div class="list-grid mt-4">
               @if(products.length === 0 && !isLoadingProducts) {
                 <div class="empty-state text-muted text-sm text-center p-4 border rounded">No products found.</div>
               }
               @for (prod of products; track prod.id) {
                 <div class="list-item w-full flex-between" [class.highlight-row]="editingProductId === prod.id">
                    <div style="display: flex; gap: 12px; align-items: center;">
                      <img [src]="prod.image_urls?.[0] || 'assets/placeholder.jpg'" style="width:40px; height:40px; object-fit:cover; border-radius: 6px; background: #f1f5f9;">
                      <div class="flex-col items-start">
                        <span class="fw-bold" style="font-size: 13px;">{{ prod.name }}</span>
                        <span class="text-xs text-muted">&#36;{{ prod.price }} • Stock: {{ prod.stock }}</span>
                      </div>
                    </div>
                    <button class="btn-ghost-sm" (click)="editProduct(prod)">Edit</button>
                 </div>
               }
            </div>

            @if (totalPages > 1) {
              <div class="pagination-bar mt-4">
                <button class="btn-ghost-sm" (click)="changePage(currentPage - 1)" [disabled]="currentPage === 1">Previous</button>
                <span class="text-sm fw-bold">Page {{ currentPage }} of {{ totalPages }}</span>
                <button class="btn-ghost-sm" (click)="changePage(currentPage + 1)" [disabled]="currentPage === totalPages">Next</button>
              </div>
            }

          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-container { min-height: 100dvh; background: var(--neutral-50); padding-bottom: 6rem; position: relative; }
    .toast-container { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; flex-direction: column; gap: 0.5rem; }
    .toast { padding: 1rem 1.5rem; border-radius: var(--radius-md); color: white; font-weight: 600; font-size: 14px; box-shadow: var(--shadow-lg); animation: slideIn 0.3s ease forwards; }
    .toast.success { background: #10b981; }
    .toast.error { background: #ef4444; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .admin-header-area { position: sticky; top: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); z-index: 100; border-bottom: 1px solid var(--neutral-200); padding: env(safe-area-inset-top) 1rem 1rem; }
    .admin-top-bar { display: flex; align-items: center; justify-content: space-between; height: 60px; }
    .back-btn { display: flex; align-items: center; gap: 4px; color: var(--neutral-600); font-weight: 600; text-decoration: none; width: 60px; }
    .back-btn svg { width: 20px; height: 20px; }
    .page-title { font-family: var(--font-display); font-size: var(--text-lg); margin: 0; }

    .segmented-control { display: flex; background: var(--neutral-100); padding: 4px; border-radius: var(--radius-lg); margin-top: 0.5rem; }
    .segmented-control button { flex: 1; padding: 8px 0; border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 600; color: var(--neutral-600); transition: all 0.2s; border: none; }
    .segmented-control button.active { background: var(--neutral-0); color: var(--brand-600); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

    .admin-content { padding: 1.5rem 1rem; max-width: 800px; margin: 0 auto; }
    .card { background: white; padding: 1.5rem; border-radius: var(--radius-xl); border: 1px solid var(--neutral-200); box-shadow: var(--shadow-card); transition: border-color 0.3s; }
    .card.edit-mode { border: 2px solid var(--brand-400); box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1); }
    
    .header-with-action { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--neutral-100); padding-bottom: 1rem; }
    .header-with-action h3 { margin: 0; font-family: var(--font-display); }
    .highlight-row { background: var(--brand-50) !important; border-color: var(--brand-200) !important; }

    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem;}
    label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--neutral-500); letter-spacing: 0.05em; }
    input, select, textarea { padding: 12px 14px; border: 1px solid var(--neutral-200); border-radius: var(--radius-md); background: var(--neutral-50); font-size: 15px; width: 100%; box-sizing: border-box; }
    input:focus, select:focus, textarea:focus { outline: none; border-color: var(--brand-400); background: white; }
    
    .checkbox-label { display: flex; align-items: center; flex-direction: row; gap: 8px; font-size: 14px; text-transform: none; color: var(--neutral-900); cursor: pointer; font-weight: 600; background: var(--neutral-50); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--neutral-200);}
    .checkbox-label input { width: 18px; height: 18px; margin: 0; accent-color: var(--brand-600); cursor: pointer; }

    .highlight-select { border: 2px solid var(--brand-200); background: var(--brand-50); font-weight: 600; color: var(--brand-700); }
    .form-divider { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--brand-500); border-bottom: 1px solid var(--neutral-200); padding-bottom: 0.5rem; margin: 1rem 0; letter-spacing: 0.05em;}
    .custom-section { color: #8b5cf6; border-bottom-color: #ede9fe; }

    .schema-builder { background: var(--neutral-50); padding: 1rem; border-radius: var(--radius-lg); border: 1px dashed var(--neutral-300); }
    .attribute-row { display: grid; grid-template-columns: 1fr 100px 40px; gap: 8px; margin-bottom: 8px; align-items: center; }
    
    .btn-icon { background: none; border: none; font-size: 18px; cursor: pointer; padding: 0; display: flex; align-items: center; justify-content: center; }
    .btn-ghost-sm { background: transparent; border: 1px solid var(--neutral-300); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--neutral-700); }
    .btn-ghost-sm:hover:not(:disabled) { background: var(--neutral-100); }
    .btn-ghost-sm:disabled { opacity: 0.5; cursor: not-allowed; }
    .text-red { color: #ef4444 !important; border-color: #fca5a5 !important;}
    .btn-ghost { background: transparent; border: 1px solid var(--brand-200); color: var(--brand-600); padding: 8px; border-radius: var(--radius-md); font-weight: 600; width: 100%; cursor: pointer; }

    .full-btn { width: 100%; height: 48px; font-size: 15px; border: none; border-radius: var(--radius-md); cursor: pointer;}
    .btn-primary { background: var(--gradient-brand); color: white; font-weight: 600; }
    
    .list-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border-radius: var(--radius-md); border: 1px solid var(--neutral-200); box-shadow: var(--shadow-sm); }
    .flex-col { display: flex; flex-direction: column; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; width: 100%;}
    .items-start { align-items: flex-start; }
    .fw-bold { font-weight: 600; font-size: var(--text-sm); display: flex; align-items: center; gap: 8px;}
    .w-full { width: 100%; }
    
    .schema-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .badge { font-size: 10px; background: var(--neutral-100); padding: 4px 8px; border-radius: 4px; color: var(--neutral-600); font-weight: 600;}
    .badge-home { font-size: 10px; background: #FEF3C7; color: #B45309; padding: 3px 6px; border-radius: 4px; font-weight: 800;}

    .hidden-input { display: none; }
    .upload-dropzone { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; border: 2px dashed var(--brand-300); background: var(--brand-50); border-radius: var(--radius-lg); cursor: pointer; color: var(--brand-600); font-weight: 600; transition: all 0.2s; }
    .upload-dropzone:hover { background: var(--brand-100); border-color: var(--brand-400); }
    .upload-dropzone .icon { font-size: 20px; margin-bottom: 4px; }

    .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(70px, 1fr)); gap: 8px; width: 100%; }
    .preview-card { position: relative; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--neutral-200); aspect-ratio: 1; }
    .preview-card.new-upload { border: 2px solid var(--brand-400); }
    .preview-card img { width: 100%; height: 100%; object-fit: cover; }
    .preview-card .remove-btn { position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

    /* Pagination */
    .pagination-bar { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border-radius: var(--radius-md); border: 1px solid var(--neutral-200); box-shadow: var(--shadow-sm); }
    .p-4 { padding: 1rem; } .border { border: 1px solid var(--neutral-200); } .rounded { border-radius: var(--radius-md); } .text-center { text-align: center; }

    .mt-2 { margin-top: 0.5rem; }
    .mt-4 { margin-top: 1rem; }
    .mt-6 { margin-top: 1.5rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .text-muted { color: var(--neutral-500); }
    .text-xs { font-size: 11px; }
    .text-sm { font-size: 13px; }
    .fade-in { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (min-width: 768px) {
      .admin-content { padding: 2.5rem 2rem; }
      .card { padding: 2rem; }
      .responsive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; }
      .form-group { margin-bottom: 0; }
      .full-width { grid-column: 1 / -1; }
      .list-grid { display: grid; grid-template-columns: 1fr 1fr; }
    }
  `]
})
export default class AdminDashboard implements OnInit {
  private shopService = inject(ShopService);

  activeView: 'categories' | 'products' = 'categories';
  isSubmitting = false;

  categories: Category[] = [];
  
  // Pagination State
  products: Product[] = [];
  isLoadingProducts = false;
  currentPage = 1;
  itemsPerPage = 10;
  totalProducts = 0;
  totalPages = 1;

  selectedCategorySchema: Category | null = null;
  editingCategoryId: string | null = null;
  editingProductId: string | null = null;

  newCategory: Category = { name: '', attributes: [], show_on_home: false };
  newProduct: Product = { name: '', price: null as any, category_id: '', description: '', stock: 1, uploaded_by: 'admin_adarsh', attributes: {} };

  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  existingImageUrls: string[] = [];

  toasts: Toast[] = [];
  private toastIdCounter = 0;

  ngOnInit() {
    this.loadCategories();
    this.loadProducts(this.currentPage);
  }

  showToast(message: string, type: 'success' | 'error') {
    const id = this.toastIdCounter++;
    this.toasts.push({ id, message, type });
    setTimeout(() => { this.toasts = this.toasts.filter(t => t.id !== id); }, 3000);
  }

  loadCategories() {
    this.shopService.getCategories().subscribe({
      next: (res) => this.categories = res.data,
      error: () => this.showToast('Failed to load categories', 'error')
    });
  }

  // --- SERVER PAGINATION METHODS ---
  loadProducts(page: number) {
    this.isLoadingProducts = true;
    this.shopService.getProducts(page, this.itemsPerPage).subscribe({
      next: (res) => {
        this.products = res.data;
        if (res.meta) {
          this.totalProducts = res.meta.total;
          this.currentPage = res.meta.page;
          this.totalPages = Math.ceil(this.totalProducts / this.itemsPerPage) || 1;
        }
        this.isLoadingProducts = false;
      },
      error: () => {
        this.showToast('Failed to load products', 'error');
        this.isLoadingProducts = false;
      }
    });
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.loadProducts(newPage);
    }
  }

  // ================= CATEGORY LOGIC =================
  addAttribute() { this.newCategory.attributes.push({ name: '', type: 'text' }); }
  removeAttribute(index: number) { this.newCategory.attributes.splice(index, 1); }

  editCategory(cat: Category) {
    this.editingCategoryId = cat.id!;
    this.newCategory = JSON.parse(JSON.stringify(cat)); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelCategoryEdit() {
    this.editingCategoryId = null;
    this.newCategory = { name: '', attributes: [], show_on_home: false };
  }

  submitCategory(form: NgForm) {
    if (!this.newCategory.name) return;
    this.isSubmitting = true;
    
    this.newCategory.attributes = this.newCategory.attributes.filter(attr => attr.name.trim() !== '');

    if (this.editingCategoryId) {
      this.shopService.updateCategory(this.editingCategoryId, this.newCategory).subscribe({
        next: () => {
          this.showToast('Category updated successfully!', 'success');
          this.cancelCategoryEdit();
          form.resetForm();
          this.loadCategories();
          this.isSubmitting = false;
        },
        error: (err) => { this.showToast(err.error?.statusMessage || 'Error updating', 'error'); this.isSubmitting = false; }
      });
    } else {
      this.shopService.createCategory(this.newCategory).subscribe({
        next: () => {
          this.showToast('Category created successfully!', 'success');
          this.cancelCategoryEdit();
          form.resetForm();
          this.loadCategories();
          this.isSubmitting = false;
        },
        error: (err) => { this.showToast(err.error?.statusMessage || 'Error creating', 'error'); this.isSubmitting = false; }
      });
    }
  }

  // ================= PRODUCT LOGIC =================
  onCategorySelect() {
    this.selectedCategorySchema = this.categories.find(c => c.id === this.newProduct.category_id) || null;
    if (!this.editingProductId) this.newProduct.attributes = {}; 
  }

  editProduct(prod: Product) {
    this.editingProductId = prod.id!;
    this.newProduct = JSON.parse(JSON.stringify(prod));
    this.selectedCategorySchema = this.categories.find(c => c.id === prod.category_id) || null;
    
    this.existingImageUrls = prod.image_urls ? [...prod.image_urls] : [];
    this.selectedFiles = [];
    this.imagePreviews = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelProductEdit(form?: NgForm) {
    this.editingProductId = null;
    if (form) form.resetForm();
    this.newProduct = { name: '', price: null as any, category_id: '', description: '', stock: 1, uploaded_by: 'admin_adarsh', attributes: {} };
    this.existingImageUrls = [];
    this.selectedFiles = [];
    this.imagePreviews = [];
    this.selectedCategorySchema = null;
  }

  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        this.selectedFiles.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => this.imagePreviews.push(e.target.result);
        reader.readAsDataURL(file);
      });
    }
  }

  removePreview(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  removeExistingImage(index: number) {
    this.existingImageUrls.splice(index, 1);
  }

  submitProduct(form: NgForm) {
    this.isSubmitting = true;
    
    try {
      const formData = new FormData();
      formData.append('name', this.newProduct.name);
      formData.append('price', this.newProduct.price.toString());
      formData.append('stock', this.newProduct.stock.toString());
      formData.append('category_id', this.newProduct.category_id);
      formData.append('description', this.newProduct.description || '');
      formData.append('uploaded_by', this.newProduct.uploaded_by);
      formData.append('attributes', JSON.stringify(this.newProduct.attributes || {}));
      
      formData.append('existing_images', JSON.stringify(this.existingImageUrls));

      if (this.selectedFiles && this.selectedFiles.length > 0) {
        this.selectedFiles.forEach((file) => formData.append('images', file));
      }

      if (this.editingProductId) {
        this.shopService.updateProduct(this.editingProductId, formData).subscribe({
          next: () => {
            this.showToast('Product updated successfully!', 'success');
            this.cancelProductEdit(form);
            this.loadProducts(this.currentPage); // Stay on current page
            this.isSubmitting = false;
          },
          error: (err) => { this.showToast(err.error?.statusMessage || 'Update failed', 'error'); this.isSubmitting = false; }
        });
      } else {
        this.shopService.createProduct(formData).subscribe({
          next: () => {
            this.showToast('Product created successfully!', 'success');
            const cat = this.newProduct.category_id; 
            this.cancelProductEdit(form);
            this.newProduct.category_id = cat; 
            this.loadProducts(1); // Jump to page 1 to see new product
            this.isSubmitting = false;
          },
          error: (err) => { this.showToast(err.error?.statusMessage || 'Upload failed', 'error'); this.isSubmitting = false; }
        });
      }
    } catch (err: any) {
      this.showToast('Failed to prepare product data', 'error');
      this.isSubmitting = false; 
    }
  }
}