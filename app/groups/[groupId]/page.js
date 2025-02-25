"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/utils/supabaseClient";
import { Trash, Edit2, Plus, Ellipsis } from "lucide-react"; // Pencil icon & Plus icon

export default function GroupDetails() {
    const { user } = useAuth();
    const router = useRouter();
    const { groupId } = useParams();

    const [group, setGroup] = useState(null);
    const [openPopup, setOpenPopup] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [totalExpense, setTotalExpense] = useState(0);
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [userDetails, setUserDetails] = useState({});
    const [groupMembers, setGroupMembers] = useState([]);
    const [userExpenseCount, setUserExpenseCount] = useState({});
    const [newExpense, setNewExpense] = useState({
        description: "",
        amount: "",
        category: "",
        date: "",
    });

    // For editing an existing expense
    const [isEditing, setIsEditing] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);

    // For toggling the Add section on mobile
    const [showMobileAdd, setShowMobileAdd] = useState(false);

    useEffect(() => {
        if (!user) router.push("/");
        else if (groupId) {
            fetchGroupDetails();
            fetchExpenses();
            fetchGroupMembers();
        }
    }, [user, router, groupId]);

    const fetchGroupDetails = async () => {
        const { data, error } = await supabase
            .from("groups")
            .select("*")
            .eq("id", groupId)
            .single();
        if (!error) setGroup(data);
    };

    const fetchExpenses = async () => {
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .eq("group_id", groupId);
        if (!error) {
            setExpenses(data);
            fetchUserDetails(data);

            // Calculate total expense
            const total = data.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
            setTotalExpense(total);
        }
    };

    const fetchUserDetails = async (expenses) => {
        const userIds = [...new Set(expenses.map((exp) => exp.user_id))];
        const { data, error } = await supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", userIds);

        if (!error) {
            setUserDetails(Object.fromEntries(data.map((user) => [user.id, user])));

            // Count expenses per user
            const expenseCount = expenses.reduce((acc, exp) => {
                acc[exp.user_id] = (acc[exp.user_id] || 0) + parseFloat(exp.amount || 0);
                return acc;
            }, {});
            setUserExpenseCount(expenseCount);
        }
    };

    const fetchGroupMembers = async () => {
        try {
            const response = await fetch(`/api/groups/${groupId}/members`);
            if (!response.ok) {
                throw new Error("Failed to fetch group members");
            }
            const data = await response.json();

            setGroupMembers(data.members);

        } catch (error) {
            console.error("Error fetching group members:", error);
        }
    };


    const handleAddExpense = async (e) => {
        e.preventDefault();
        const { data, error } = await supabase
            .from("expenses")
            .insert([
                {
                    ...newExpense,
                    group_id: groupId,
                    user_id: user.id,
                },
            ])
            .select();

        if (!error && data?.[0]) {
            const added = data[0];
            setExpenses([...expenses, added]);
            setNewExpense({ description: "", amount: "", category: "", date: "" });

            // Update total expense and user expense count
            setTotalExpense((prev) => prev + parseFloat(added.amount || 0));
            setUserExpenseCount((prev) => ({
                ...prev,
                [user.id]: (prev[user.id] || 0) + parseFloat(added.amount || 0),
            }));
        }
    };


    // DELETE expense
    const handleDeleteExpense = async (expenseId, amount, userId) => {
        const response = await fetch(`/api/expenses/${expenseId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
        });

        if (response.ok) {
            setExpenses(expenses.filter((exp) => exp.id !== expenseId));
            setTotalExpense((prev) => prev - parseFloat(amount || 0));
            setUserExpenseCount((prev) => ({
                ...prev,
                [userId]: Math.max(0, (prev[userId] || 0) - parseFloat(amount || 0)),
            }));
        }
    };

    // EDIT expense (open modal)
    const handleEditExpense = (expense) => {
        setEditingExpense({ ...expense }); // clone to avoid direct mutation
        setIsEditing(true);
    };

    // UPDATE expense
    const handleUpdateExpense = async (e) => {
        e.preventDefault();
        if (!editingExpense) return;

        const { id: expenseId, user_id, ...rest } = editingExpense;
        const response = await fetch(`/api/expenses/${expenseId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: user.id,
                ...rest,
            }),
        });

        if (response.ok) {
            // If successful, update local state
            const updatedExpenses = expenses.map((exp) =>
                exp.id === expenseId ? { ...exp, ...rest } : exp
            );

            // Recalculate total
            const newTotal = updatedExpenses.reduce(
                (sum, exp) => sum + parseFloat(exp.amount || 0),
                0
            );

            // Recalculate userExpenseCount
            const newCounts = updatedExpenses.reduce((acc, exp) => {
                acc[exp.user_id] =
                    (acc[exp.user_id] || 0) + parseFloat(exp.amount || 0);
                return acc;
            }, {});

            setExpenses(updatedExpenses);
            setTotalExpense(newTotal);
            setUserExpenseCount(newCounts);

            setIsEditing(false);
            setEditingExpense(null);
        }
    };



    const inviteUser = async () => {
        setMessage("");
        if (!email) return setMessage("Please enter an email.");
        try {
            const response = await fetch(`/api/groups/${groupId}/invite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            if (response.ok) {
                setEmail("");
            }
            setMessage(response.ok ? result.message : result.error || "Error inviting user.");
        } catch (error) {
            setMessage("Something went wrong.");
        }
    };

    {
        groupMembers.map((member) => {
            const user = userDetails[member.user_id]; // Get user object safely

            return (
                <div
                    key={member.user_id}
                    className="grid grid-col-2 bg-white text-xs h-min wrap text-black md:p-1 p-2 rounded shadow"
                >
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-lg">${userExpenseCount[member.user_id] || 0}</p>
                        <Ellipsis size={20} />
                    </div>
                    <p>{user ? user.email : "Loading..."}</p>
                </div>
            );
        })
    }

    return (
        <div className="min-h-screen lg:p-8 relative">
            {/* Back button - visible only on large screens */}
            <Link
                href="/dashboard"
                className="ml-5 bg-green-600 hover:bg-green-700 text-white hidden lg:inline font-semibold py-2 px-4 rounded"
            >
                Back
            </Link>

            {group && (
                <div className="text-center mt-2">
                    <h1 className="text-3xl font-bold">{group.name} Group</h1>
                </div>
            )}

            <div className="md:flex w-full gap-4 p-5">
                {/* Left / Main section */}
                <section className="lg:w-3/4">
                    {/* Top row with total expense & group members */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        <div className="bg-green-600 text-2xl text-white font-bold px-2 py-2 rounded">
                            Total: ${totalExpense.toFixed(2)}
                        </div>
                        {groupMembers.map((member) => {
                            const user = userDetails[member.user_id];

                            return (
                                <div
                                    key={member.user_id}
                                    className="relative bg-white text-xs h-min wrap text-black md:p-1 p-2 rounded shadow"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-lg text-indigo-500">${userExpenseCount[member.user_id] || 0}</p>
                                        <button onClick={() => setOpenPopup(openPopup === member.user_id ? null : member.user_id)}>
                                            <Ellipsis size={20} />
                                        </button>
                                    </div>
                                    <p>{user ? user.email : "Loading..."}</p>

                                    {/* Popup */}
                                    {openPopup === member.user_id && (
                                        <div className="absolute top-5 -right-28 mt-2 w-32 bg-white shadow-lg border rounded-md z-10">
                                            <button
                                                className="w-full text-left p-2 text-sm bg-red-700 hover:bg-red-500 text-white rounded-md"
                                                onClick={() => handleRemoveMember(member.user_id)}
                                            >
                                                Remove Member
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                    </div>

                    <h3 className="text-md font-semibold">Expenses</h3>
                    {expenses.length === 0 ? (
                        <p>No expenses yet.</p>
                    ) : (
                        <ul>
                            {expenses.map((expense) => (
                                <li
                                    key={expense.id}
                                    className="p-4 mt-2 bg-black shadow-sm rounded flex justify-between items-center"
                                >
                                    <div>
                                        <strong>{expense.description}</strong> - ${expense.amount} (
                                        {expense.category})
                                        {userDetails[expense.user_id] ? (
                                            <p className="text-gray-500 text-sm">
                                                {userDetails[expense.user_id].email}
                                            </p>
                                        ) : (
                                            <p className="text-gray-500 text-sm">
                                                Loading user info...
                                            </p>
                                        )}
                                        <p className="text-gray-500 text-sm">{expense.date}</p>
                                    </div>

                                    {user && expense.user_id === user.id && (
                                        <div className="flex gap-3">
                                            {/* Pencil Icon for editing */}
                                            <button
                                                onClick={() => handleEditExpense(expense)}
                                                className="text-green-400 hover:text-green-500"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            {/* Trash Icon for deleting */}
                                            <button
                                                onClick={() =>
                                                    handleDeleteExpense(
                                                        expense.id,
                                                        expense.amount,
                                                        expense.user_id
                                                    )
                                                }
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash size={20} />
                                            </button>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Right sidebar - hidden on small screens */}
                <section className="hidden md:block border-l md:w-1/4 p-2">
                    {user && group?.admin_id === user.id && (
                        <div className="border-b pb-5">
                            <h3 className="mb-2">Add Users:</h3>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter user email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="border p-2 w-full rounded validate"
                                />
                                <button
                                    onClick={inviteUser}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                                >
                                    Invite
                                </button>
                            </div>
                            {message && (
                                <p className="mt-2 text-sm text-blue-500">{message}</p>
                            )}
                        </div>
                    )}
                    <div className="mt-2">
                        <h3 className="mb-2">Add Expense:</h3>
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            {Object.keys(newExpense).map((key) => (
                                <input
                                    key={key}
                                    type={
                                        key === "amount"
                                            ? "number"
                                            : key === "date"
                                                ? "date"
                                                : "text"
                                    }
                                    placeholder={key}
                                    value={newExpense[key]}
                                    onChange={(e) =>
                                        setNewExpense({ ...newExpense, [key]: e.target.value })
                                    }
                                    className="border p-2 w-full rounded"
                                    required
                                />
                            ))}
                            <button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded"
                            >
                                Add Expense
                            </button>
                        </form>
                    </div>
                </section>
            </div>

            {/* FLOATING PLUS BUTTON - visible on small screens only */}
            <button
                onClick={() => setShowMobileAdd(true)}
                className="md:hidden fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full"
            >
                <Plus size={24} />
            </button>

            {/* MOBILE ADD SECTION (MODAL) */}
            {showMobileAdd && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white p-4 w-11/12 max-w-sm rounded shadow relative">
                        {/* Close button */}
                        <button
                            onClick={() => setShowMobileAdd(false)}
                            className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                        >
                            ✕
                        </button>

                        {/* If admin, show 'Add Users' */}
                        {user && group?.admin_id === user.id && (
                            <div className="border-b pb-5 mb-4">
                                <h3 className="mb-2 font-semibold">Add Users:</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="Enter user email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="border p-2 w-full rounded validate"
                                    />
                                    <button
                                        onClick={inviteUser}
                                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                                    >
                                        Invite
                                    </button>
                                </div>
                                {message && (
                                    <p className="mt-2 text-sm text-blue-500">{message}</p>
                                )}
                            </div>
                        )}

                        {/* Add Expense form */}
                        <div>
                            <h3 className="mb-2 font-semibold">Add Expense:</h3>
                            <form onSubmit={handleAddExpense} className="space-y-4">
                                {Object.keys(newExpense).map((key) => (
                                    <input
                                        key={key}
                                        type={
                                            key === "amount"
                                                ? "number"
                                                : key === "date"
                                                    ? "date"
                                                    : "text"
                                        }
                                        placeholder={key}
                                        value={newExpense[key]}
                                        onChange={(e) =>
                                            setNewExpense({ ...newExpense, [key]: e.target.value })
                                        }
                                        className="border p-2 w-full rounded"
                                        required
                                    />
                                ))}
                                <button
                                    type="submit"
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded w-full"
                                >
                                    Add Expense
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT EXPENSE MODAL */}
            {isEditing && editingExpense && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    {/* Modal Content */}
                    <div className="bg-white p-6 rounded shadow-md w-full max-w-md relative">
                        <h2 className="text-lg font-bold mb-4">Edit Expense</h2>
                        <form onSubmit={handleUpdateExpense} className="space-y-3">
                            <input
                                type="text"
                                className="border p-2 w-full rounded"
                                placeholder="Description"
                                value={editingExpense.description}
                                onChange={(e) =>
                                    setEditingExpense({
                                        ...editingExpense,
                                        description: e.target.value,
                                    })
                                }
                                required
                            />
                            <input
                                type="number"
                                className="border p-2 w-full rounded"
                                placeholder="Amount"
                                value={editingExpense.amount}
                                onChange={(e) =>
                                    setEditingExpense({
                                        ...editingExpense,
                                        amount: e.target.value,
                                    })
                                }
                                required
                            />
                            <input
                                type="text"
                                className="border p-2 w-full rounded"
                                placeholder="Category"
                                value={editingExpense.category}
                                onChange={(e) =>
                                    setEditingExpense({
                                        ...editingExpense,
                                        category: e.target.value,
                                    })
                                }
                                required
                            />
                            <input
                                type="date"
                                className="border p-2 w-full rounded"
                                placeholder="Date"
                                value={editingExpense.date}
                                onChange={(e) =>
                                    setEditingExpense({
                                        ...editingExpense,
                                        date: e.target.value,
                                    })
                                }
                                required
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    className="bg-gray-300 text-black font-semibold py-2 px-4 rounded"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditingExpense(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
                                >
                                    Update
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
