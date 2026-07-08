import { defineEventHandler, readMultipartFormData, getMethod, getQuery, createError } from 'h3';
import { supabase } from '../../../utils/supabase';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

 if (method === 'GET') {
    const query = getQuery(event);
    const categoryId = query['categoryId'] as string;
    
    // Pagination defaults: page 1, 10 items per page
    const page = parseInt((query['page'] as string) || '1', 10);
    const limit = parseInt((query['limit'] as string) || '10', 10);
    
    // Calculate Supabase range (0-indexed)
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Request exact count to build frontend pagination
    let dbQuery = supabase
      .from('products')
      .select('*, categories(name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (categoryId) dbQuery = dbQuery.eq('category_id', categoryId);

    const { data, error, count } = await dbQuery;
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    
    return { 
      status: 'success', 
      data,
      meta: { total: count, page, limit } // Return pagination metadata
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

      if (method === 'POST') {
        const { data, error: dbError } = await supabase.from('products').insert([{
          name: fields['name'], description: fields['description'] || '',
          price: parseFloat(fields['price']), stock: parseInt(fields['stock'] || '1'),
          category_id: fields['category_id'], uploaded_by: fields['uploaded_by'] || 'admin_user',
          attributes, image_urls: newImageUrls
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
          name: fields['name'], description: fields['description'] || '',
          price: parseFloat(fields['price']), stock: parseInt(fields['stock'] || '1'),
          category_id: fields['category_id'], attributes, image_urls: finalImageUrls
        }).eq('id', id).select().single();

        if (dbError) throw createError({ statusCode: 500, statusMessage: dbError.message });
        return { status: 'success', message: 'Product updated', data };
      }

    } catch (error: any) {
      throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || error.message });
    }
  }
});