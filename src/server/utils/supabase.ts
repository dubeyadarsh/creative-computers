import { createClient } from '@supabase/supabase-js';

// Accessing environment variables in Nitro
const supabaseUrl = process.env['VITE_PUBLIC_SUPABASE_URL'] || '';
const supabaseKey = process.env['SUPABASE_SERVICE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'] || '';
export const supabase = createClient(supabaseUrl, supabaseKey); 