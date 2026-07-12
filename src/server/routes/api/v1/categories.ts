import {
  defineEventHandler,
  getMethod,
  getQuery,
  readMultipartFormData,
  createError,
} from 'h3';
import { supabase } from '../../../utils/supabase';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // ======================================================
  // GET
  // ======================================================
  if (method === 'GET') {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    return {
      status: 'success',
      data,
    };
  }

  // ======================================================
  // POST / PUT
  // ======================================================
  if (method === 'POST' || method === 'PUT') {
    const formData = await readMultipartFormData(event);

    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No form data received',
      });
    }

    const fields: any = {};
    const files: any[] = [];

    for (const part of formData) {
      if (part.name === 'images' && part.data) {
        files.push(part);
      } else if (part.name) {
        fields[part.name] = part.data.toString();
      }
    }

    const uploadedImages: string[] = [];

    for (const file of files) {
      const fileName = `categories/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}-${file.filename}`;

      const { error: uploadError } = await supabase.storage
        .from('category-images')
        .upload(fileName, file.data, {
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) {
        throw createError({
          statusCode: 500,
          statusMessage: uploadError.message,
        });
      }

      const { data } = supabase.storage
        .from('category-images')
        .getPublicUrl(fileName);

      uploadedImages.push(data.publicUrl);
    }

    const existingImages =
      fields['existing_images']
        ? JSON.parse(fields['existing_images'])
        : [];

    const payload = {
      name: fields['name'],
      slug: fields['slug'],
      show_on_home: fields['show_on_home'] === 'true',
      attributes: fields['attributes']
        ? JSON.parse(fields['attributes'])
        : [],
      // Newly uploaded images go first so image_urls[0] reflects the
      // latest upload in the UI on edit.
      image_urls:
        method === 'PUT'
          ? [...uploadedImages, ...existingImages]
          : uploadedImages,
    };

    // ======================================================
    // CREATE
    // ======================================================
    if (method === 'POST') {
      const { data, error } = await supabase
        .from('categories')
        .insert([payload])
        .select()
        .single();

      if (error) {
        throw createError({
          statusCode: 500,
          statusMessage: error.message,
        });
      }

      return {
        status: 'success',
        message: 'Category created successfully',
        data,
      };
    }

    // ======================================================
    // UPDATE
    // ======================================================

    const query = getQuery(event);

    const id = Array.isArray(query['id'])
      ? query['id'][0]
      : query['id'];

    if (!id || typeof id !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Category id is required',
      });
    }

    const { data, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }

    return {
      status: 'success',
      message: 'Category updated successfully',
      data,
    };
  }

  // ======================================================
  // DELETE
  // ======================================================
  if (method === 'DELETE') {
    const query = getQuery(event);

    const id = Array.isArray(query['id']) ? query['id'][0] : query['id'];

    if (!id || typeof id !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Category id is required',
      });
    }

    // Fetch existing images so we can clean up storage after deletion.
    const { data: existing } = await supabase
      .from('categories')
      .select('image_urls')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      // Postgres FK violation (products still reference this category).
      const isForeignKeyViolation = error.code === '23503';
      throw createError({
        statusCode: isForeignKeyViolation ? 409 : 500,
        statusMessage: isForeignKeyViolation
          ? 'Cannot delete category because it still has products assigned to it.'
          : error.message,
      });
    }

    // Best-effort storage cleanup (does not fail the request).
    const imageUrls: string[] = existing?.image_urls || [];
    const paths = imageUrls
      .map((url) => {
        const marker = '/category-images/';
        const idx = url.indexOf(marker);
        return idx === -1 ? null : url.substring(idx + marker.length);
      })
      .filter((p): p is string => !!p);

    if (paths.length > 0) {
      await supabase.storage.from('category-images').remove(paths);
    }

    return {
      status: 'success',
      message: 'Category deleted successfully',
    };
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed',
  });
});