// app/groups/[groupId]/settings/page.js
"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../utils/supabaseClient';

export default function GroupSettings() {
  const { groupId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/');
    } else {
      fetchGroup();
      fetchMembers();
    }
  }, [user]);

  const fetchGroup = async () => {
    let { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();
    if (error) console.error(error);
    else setGroup(data);
  };

  const fetchMembers = async () => {
    let { data, error } = await supabase
      .from('memberships')
      .select('user_id, users(email)')
      .eq('group_id', groupId);
    if (error) console.error(error);
    else setMembers(data);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    const res = await fetch(`/api/groups/${groupId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    });
    if (!res.ok) {
      alert('Error inviting user');
    } else {
      setInviteEmail('');
      fetchMembers();
    }
  };

  const handleRemoveMember = async (userId) => {
    const res = await fetch(`/api/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      alert('Error removing member');
    } else {
      fetchMembers();
    }
  };

  if (!group) return <p>Loading...</p>;

  // Only allow access if the current user is the admin.
  if (group.admin_id !== user.id) {
    return <p>Access Denied: Only admins can access this page.</p>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Group Settings: {group.name}</h1>
      <h2>Invite Member</h2>
      <form onSubmit={handleInvite}>
        <input type="email" placeholder="User Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
        <button type="submit">Invite</button>
      </form>
      <h2>Members</h2>
      <ul>
        {members.map(member => (
          <li key={member.user_id}>
            {member.users.email}
            {member.user_id !== user.id && (
              <button onClick={() => handleRemoveMember(member.user_id)}>Remove</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
