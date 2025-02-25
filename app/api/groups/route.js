// app/api/groups/route.js
import { supabase } from '../../../utils/supabaseClient';

export async function POST(request) {
  const body = await request.json();
  const { name, admin_id } = body;
  const { data, error } = await supabase
    .from('groups')
    .insert([{ name, admin_id }]);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
  return new Response(JSON.stringify({ data }), { status: 200 });
}
