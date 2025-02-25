export async function DELETE(req) {
    try {
      const { groupId, userId } = req.query;
  
      // Remove user from group
      await supabase
        .from("memberships")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);
  
      return new Response(JSON.stringify({ message: "User removed" }), { status: 200 });
  
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  }
  