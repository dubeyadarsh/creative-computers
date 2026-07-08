import { defineEventHandler, readBody, getMethod, getQuery, createError } from 'h3';
import { supabase } from '../../../utils/supabase';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === 'GET') {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    return { status: 'success', data };
  }

  if (method === 'POST') {
    const body = await readBody(event);
    if (!body.name) throw createError({ statusCode: 400, statusMessage: 'Category name is required' });

    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const attributes = body.attributes || [];
    const show_on_home = body.show_on_home || false; // Grab the checkbox value

    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: body.name, slug, attributes, show_on_home }])
      .select()
      .single();

    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    return { status: 'success', message: 'Category created', data };
  }

  // NEW: Handle Editing/Updating Categories
  if (method === 'PUT') {
    const query = getQuery(event);
    const id = query['id'] as string;
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Category ID is required for updating' });

    const body = await readBody(event);
    
    const updates: any = {
      name: body.name,
      attributes: body.attributes || [],
      show_on_home: body.show_on_home || false
    };

    if (body.name) {
       updates.slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    return { status: 'success', message: 'Category updated successfully', data };
  }
});