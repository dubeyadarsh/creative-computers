import { defineEventHandler, getHeader, createError } from 'h3';
import { supabase } from '../../../../utils/supabase';

export default defineEventHandler(async (event) => {
  // 1. Extract token from Authorization header (Bearer <token>)
  const authHeader = getHeader(event, 'authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Missing token' });
  }
  const token = authHeader.split(' ')[1];

  // 2. Verify token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized: Invalid token' });
  }

  // 3. Fetch their custom profile data to check roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  return {
    status: 'success',
    user: {
      id: user.id,
      email: user.email,
      ...profile
    }
  };
});