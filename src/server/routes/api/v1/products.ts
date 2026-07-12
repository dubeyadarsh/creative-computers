import { defineEventHandler, readMultipartFormData, readBody, getMethod, getQuery, createError } from 'h3';
import { supabase } from '../../../utils/supabase';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === 'GET') {
    const query = getQuery(event);

    // ── Single product fetch (product details page) ──
    const singleId = query['id'] as string;
    if (singleId) {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(id, name, slug)')
        .eq('id', singleId)
        .single();

      if (error) {
        throw createError({
          statusCode: error.code === 'PGRST116' ? 404 : 500,
          statusMessage: error.code === 'PGRST116' ? 'Product not found' : error.message,
        });
      }
      return { status: 'success', data };
    }

    const categoryId = query['categoryId'] as string;
    const type = query['type'] as string; // trending | new
    const sort = (query['sort'] as string) || 'newest'; // newest | price_asc | price_desc | popular | name
    const search = (query['q'] as string)?.trim();
    const minPrice = query['minPrice'] ? parseFloat(query['minPrice'] as string) : undefined;
    const maxPrice = query['maxPrice'] ? parseFloat(query['maxPrice'] as string) : undefined;
    const inStock = query['inStock'] === 'true';
    // Admin listings pass includeHidden=true to also see hidden products.
    const includeHidden = query['includeHidden'] === 'true';

    // Pagination defaults: page 1, 12 items per page
    const page = parseInt((query['page'] as string) || '1', 10);
    const limit = parseInt((query['limit'] as string) || '12', 10);

    // Calculate Supabase range (0-indexed)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build the query. `activeOnly` hides products with is_active = false on
    // the storefront. Wrapped in a helper so we can gracefully retry without
    // the is_active filter if the column hasn't been migrated in yet.
    const buildQuery = (activeOnly: boolean) => {
      let q = supabase.from('products').select('*, categories(name, slug)', { count: 'exact' });

      if (activeOnly) q = q.eq('is_active', true);
      if (categoryId) q = q.eq('category_id', categoryId);
      if (type === 'trending') q = q.eq('is_trending', true);
      else if (type === 'new') q = q.eq('is_new_arrival', true);
      if (search) q = q.ilike('name', `%${search}%`);
      if (minPrice !== undefined && !Number.isNaN(minPrice)) q = q.gte('price', minPrice);
      if (maxPrice !== undefined && !Number.isNaN(maxPrice)) q = q.lte('price', maxPrice);
      if (inStock) q = q.gt('stock', 0);

      switch (sort) {
        case 'price_asc':
          q = q.order('price', { ascending: true });
          break;
        case 'price_desc':
          q = q.order('price', { ascending: false });
          break;
        case 'popular':
          q = q.order('is_trending', { ascending: false }).order('created_at', { ascending: false });
          break;
        case 'name':
          q = q.order('name', { ascending: true });
          break;
        case 'newest':
        default:
          q = q.order('created_at', { ascending: false });
          break;
      }

      return q.range(from, to);
    };

    let { data, error, count } = await buildQuery(!includeHidden);
    // If the is_active column doesn't exist yet, retry without that filter.
    if (error && /is_active/i.test(error.message || '')) {
      ({ data, error, count } = await buildQuery(false));
    }
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });

    const total = count ?? 0;
    return {
      status: 'success',
      data,
      meta: {
        total,
        page,
        limit,
        hasMore: from + (data?.length ?? 0) < total,
      },
    };
  }

  // Handle both POST (Create) and PUT (Update)
  if (method === 'POST' || method === 'PUT') {
    try {
      const formData = await readMultipartFormData(event);
      if (!formData) throw createError({ statusCode: 400, statusMessage: 'No form data received' });

      const fields: Record<string, any> = {};
      const files: any[] = [];

      for (const part of formData) {
        if (part.name === 'images' && part.data) {
          files.push(part);
        } else if (part.name) {
          fields[part.name] = part.data.toString();
        }
      }

      // Upload New Images
      const newImageUrls: string[] = [];
      for (const file of files) {
        const fileName = `${Date.now()}-${file.filename?.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file.data, { contentType: file.type || 'image/jpeg' });
        if (uploadError) throw createError({ statusCode: 500, statusMessage: `Storage Error: ${uploadError.message}` });
        
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        newImageUrls.push(urlData.publicUrl);
      }

      const attributes = fields['attributes'] ? JSON.parse(fields['attributes']) : {};
      
      // NEW: Parse the boolean flags safely from FormData strings
      const isTrending = fields['is_trending'] === 'true';
      const isNewArrival = fields['is_new_arrival'] === 'true';

      if (method === 'POST') {
        const { data, error: dbError } = await supabase.from('products').insert([{
          name: fields['name'], 
          description: fields['description'] || '',
          price: parseFloat(fields['price']), 
          stock: parseInt(fields['stock'] || '1'),
          category_id: fields['category_id'], 
          uploaded_by: fields['uploaded_by'] || 'admin_user',
          attributes, 
          image_urls: newImageUrls,
          is_trending: isTrending,       // NEW
          is_new_arrival: isNewArrival   // NEW
        }]).select().single();

        if (dbError) throw createError({ statusCode: 500, statusMessage: dbError.message });
        return { status: 'success', message: 'Product created', data };
      } 
      
      if (method === 'PUT') {
        const query = getQuery(event);
        const id = query['id'] as string;
        
        // Merge the URLs of images they kept with the newly uploaded images
        const existingImages = fields['existing_images'] ? JSON.parse(fields['existing_images']) : [];
        const finalImageUrls = [...existingImages, ...newImageUrls];

        const { data, error: dbError } = await supabase.from('products').update({
          name: fields['name'], 
          description: fields['description'] || '',
          price: parseFloat(fields['price']), 
          stock: parseInt(fields['stock'] || '1'),
          category_id: fields['category_id'], 
          attributes, 
          image_urls: finalImageUrls,
          is_trending: isTrending,       // NEW
          is_new_arrival: isNewArrival   // NEW
        }).eq('id', id).select().single();

        if (dbError) throw createError({ statusCode: 500, statusMessage: dbError.message });
        return { status: 'success', message: 'Product updated', data };
      }

    } catch (error: any) {
      throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || error.message });
    }
  }

  // ── PATCH: lightweight partial updates (hide/show, stock, flags) ──
  if (method === 'PATCH') {
    const query = getQuery(event);
    const id = query['id'] as string;
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Product id is required' });

    const body = (await readBody(event)) as Record<string, any>;
    const allowed = ['is_active', 'stock', 'is_trending', 'is_new_arrival', 'price'];
    const patch: Record<string, any> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }
    if (Object.keys(patch).length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No valid fields to update' });
    }

    const { data, error } = await supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      .select('*, categories(name, slug)')
      .single();
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    return { status: 'success', message: 'Product updated', data };
  }

  // ── DELETE: remove a product (and best-effort clean up its images) ──
  if (method === 'DELETE') {
    const query = getQuery(event);
    const id = query['id'] as string;
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Product id is required' });

    const { data: existing } = await supabase
      .from('products')
      .select('image_urls')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });

    const imageUrls: string[] = existing?.image_urls || [];
    const paths = imageUrls
      .map((url) => {
        const marker = '/product-images/';
        const idx = url.indexOf(marker);
        return idx >= 0 ? url.slice(idx + marker.length) : null;
      })
      .filter((p): p is string => !!p);
    if (paths.length > 0) {
      await supabase.storage.from('product-images').remove(paths);
    }

    return { status: 'success', message: 'Product deleted successfully' };
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});