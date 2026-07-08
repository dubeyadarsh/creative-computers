import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CategoryAttribute {
  name: string;
  type: 'text' | 'number';
}

export interface Category {
  id?: string;
  name: string;
  slug?: string;
  attributes: CategoryAttribute[]; 
  show_on_home?: boolean; // NEW FIELD
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  image_urls?: string[];
  uploaded_by: string;
  attributes: Record<string, any>; 
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
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

  createCategory(category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.apiBase}/categories`, category);
  }

  // NEW: Update Category
  updateCategory(id: string, category: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.apiBase}/categories?id=${id}`, category);
  }

  // --- Products ---
  getProducts(page: number = 1, limit: number = 10, categoryId?: string): Observable<ApiResponse<Product[]>> {
  let url = `${this.apiBase}/products?page=${page}&limit=${limit}`;
  if (categoryId) url += `&categoryId=${categoryId}`;
  return this.http.get<ApiResponse<Product[]>>(url);
}

  createProduct(productData: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiBase}/products`, productData);
  }

  // NEW: Update Product
  updateProduct(id: string, productData: FormData): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.apiBase}/products?id=${id}`, productData);
  }
}