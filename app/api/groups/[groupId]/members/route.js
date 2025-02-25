import { supabase } from "@/utils/supabaseClient";

export async function GET(req, { params }) {
  try {
    const { groupId } = params; // Extract groupId from URL params

    if (!groupId) {
      return new Response(JSON.stringify({ error: "Group ID is required" }), { status: 400 });
    }

    // Fetch members of the group
    const { data: members, error } = await supabase
      .from("memberships")
      .select("user_id, role")
      .eq("group_id", groupId);

    if (error) throw error;

    return new Response(JSON.stringify({ members }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
