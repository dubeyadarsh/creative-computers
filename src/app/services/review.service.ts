import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Review } from './shop.types';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private auth = inject(AuthService);

  async list(productId: string): Promise<Review[]> {
    const { data, error } = await this.auth.client
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Review[]) ?? [];
  }

  async add(input: {
    productId: string;
    rating: number;
    title?: string;
    body: string;
    files?: File[];
  }): Promise<Review> {
    const userId = this.auth.userId;
    if (!userId) throw new Error('You must be logged in to write a review.');

    // Upload any attached photos to the public review-images bucket.
    const imageUrls: string[] = [];
    for (const file of input.files ?? []) {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: upErr } = await this.auth.client.storage
        .from('review-images')
        .upload(path, file, { contentType: file.type || 'image/jpeg' });
      if (upErr) throw upErr;
      const { data } = this.auth.client.storage.from('review-images').getPublicUrl(path);
      imageUrls.push(data.publicUrl);
    }

    const authorName =
      this.auth.userProfile()?.full_name ||
      this.auth.currentUser()?.email?.split('@')[0] ||
      'Anonymous';

    const payload = {
      product_id: input.productId,
      user_id: userId,
      author_name: authorName,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body,
      image_urls: imageUrls,
    };

    const { data, error } = await this.auth.client
      .from('reviews')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as Review;
  }
}
