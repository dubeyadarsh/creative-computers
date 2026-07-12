import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Category, Product, ApiResponse, ProductQuery } from './shop.types';
export interface CategoryAttribute {
  name: string;
  type: 'text' | 'number';
}


@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private http = inject(HttpClient);
  private apiBase = '/api/v1';

  // --- Categories ---
  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.apiBase}/categories`);
  }

  createCategory(formData: FormData) {
    // Let the HttpClient automatically set the multipart/form-data boundary
    return this.http.post(`${this.apiBase}/categories`, formData);
  }

  updateCategory(id: string, formData: FormData): Observable<ApiResponse<Category>> {
  return this.http.put<ApiResponse<Category>>(`${this.apiBase}/categories?id=${id}`, formData);
}

  deleteCategory(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiBase}/categories?id=${id}`);
  }

  // --- Products ---
  // Flexible catalog query used by the Shops page (supports sort/search/filters/pagination).
  queryProducts(params: ProductQuery = {}): Observable<ApiResponse<Product[]>> {
    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 1))
      .set('limit', String(params.limit ?? 12))
      .set('sort', params.sort ?? 'newest');

    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.minPrice != null) httpParams = httpParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) httpParams = httpParams.set('maxPrice', String(params.maxPrice));
    if (params.inStock) httpParams = httpParams.set('inStock', 'true');
    if (params.includeHidden) httpParams = httpParams.set('includeHidden', 'true');

    return this.http.get<ApiResponse<Product[]>>(`${this.apiBase}/products`, { params: httpParams });
  }

  // Kept for existing callers (admin list).
  getProducts(page: number = 1, limit: number = 10, categoryId?: string): Observable<ApiResponse<Product[]>> {
    return this.queryProducts({ page, limit, categoryId });
  }

  // Single product for the details page.
  getProduct(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.apiBase}/products?id=${id}`);
  }

  createProduct(productData: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiBase}/products`, productData);
  }

  // NEW: Update Product
  updateProduct(id: string, productData: FormData): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiBase}/products?id=${id}`, productData);
  }

  // Lightweight partial update (hide/show, stock, flags) — JSON body.
  patchProduct(id: string, body: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.apiBase}/products?id=${id}`, body);
  }

  deleteProduct(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiBase}/products?id=${id}`);
  }
  // Update these two methods in ShopService
  getTrendingProducts(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiBase}/products?type=trending`);
  }

  getNewArrivals(): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.apiBase}/products?type=new`);
  }
}