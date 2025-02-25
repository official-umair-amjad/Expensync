// utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSrvKey = process.env.NEXT_PUBLIC_SUPABASE_SRV_KEY;
export const supabaseAdmin = createClient(supabaseUrl, supabaseSrvKey);
