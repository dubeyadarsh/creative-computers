// shop.types.ts
export interface CategoryAttribute {
  name: string;
  type: 'text' | 'number';
}

export interface Category {
  id?: string;
  name: string;
  slug?: string;
  attributes: CategoryAttribute[];
  show_on_home?: boolean;
  image_urls?: string[];
  created_at?: string;
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
  is_trending?: boolean;
  is_new_arrival?: boolean;
  is_active?: boolean;
  created_at?: string;
  // Joined category (from `categories(...)` in the API select)
  categories?: { id?: string; name: string; slug: string } | null;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'name';

export interface ProductQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  type?: 'trending' | 'new';
  sort?: ProductSort;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  includeHidden?: boolean;
}

export interface Review {
  id?: string;
  product_id: string;
  user_id?: string;
  author_name: string;
  rating: number;
  title?: string;
  body: string;
  image_urls?: string[];
  created_at?: string;
}

export interface Address {
  id?: string;
  user_id?: string;
  label?: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country?: string;
  is_default?: boolean;
  created_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string | null;
  name: string;
  price: number;
  qty: number;
  image_url?: string | null;
}

export interface Order {
  id?: string;
  user_id?: string;
  status?: 'placed' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  shipping: number;
  total: number;
  ship_full_name?: string;
  ship_phone?: string;
  ship_line1?: string;
  ship_line2?: string;
  ship_city?: string;
  ship_state?: string;
  ship_postal?: string;
  ship_country?: string;
  payment_method?: string;
  created_at?: string;
  order_items?: OrderItem[];
}

export interface ApiResponse<T> {
  status: string;
  message?: string;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    hasMore?: boolean;
  };
}