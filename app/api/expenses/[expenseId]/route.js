import { supabase } from "@/utils/supabaseClient";

export async function PUT(req, { params }) {
  try {
    const { expenseId } = params;
    const { user_id, description, amount, category, date } = await req.json();

    const { error } = await supabase
      .from("expenses")
      .update({ description, amount, category, date })
      .eq("id", expenseId)
      .eq("user_id", user_id); // Only allow the creator to edit

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Expense updated" }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { expenseId } = params;
    const { user_id } = await req.json();

    console.log(expenseId)

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("user_id", user_id); // Only allow the creator to delete

    if (error) throw error;

    return new Response(JSON.stringify({ message: "Expense deleted" }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
