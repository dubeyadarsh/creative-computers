import { defineEventHandler, getHeader, getMethod, getQuery, readBody, createError } from 'h3';
import { supabase } from '../../../utils/supabase';

const VALID_STATUS = ['placed', 'confirmed', 'shipped', 'delivered', 'cancelled'];

// Verify the caller is an authenticated admin. Returns the user id.
async function requireAdmin(event: any): Promise<string> {
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' });
  }
  return user.id;
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // ── List all orders (admin) ──
  if (method === 'GET') {
    await requireAdmin(event);
    const query = getQuery(event);
    const status = query['status'] as string;

    let dbQuery = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (status && VALID_STATUS.includes(status)) {
      dbQuery = dbQuery.eq('status', status);
    }

    const { data, error } = await dbQuery;
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });
    return { status: 'success', data };
  }

  // ── Update an order's status (admin) ──
  if (method === 'PATCH' || method === 'PUT') {
    await requireAdmin(event);
    const query = getQuery(event);
    const id = query['id'] as string;
    if (!id) throw createError({ statusCode: 400, statusMessage: 'Order id is required' });

    const body = (await readBody(event)) as { status?: string };
    const newStatus = body?.status;
    if (!newStatus || !VALID_STATUS.includes(newStatus)) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid status' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)
      .select('*, order_items(*)')
      .single();
    if (error) throw createError({ statusCode: 500, statusMessage: error.message });

    return { status: 'success', data };
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
