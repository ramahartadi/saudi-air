import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  UserCheck, 
  MoreVertical, 
  Trash2,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from 'sonner';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  avatar_url: string;
  created_at: string;
}

export default function ManageUsers() {
  const { role, isLoading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const isFetching = useRef(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const fetchUsers = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&order=created_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setProfiles(data);
    } catch (error: any) {
      toast.error("Error loading users: " + error.message);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [supabaseUrl, supabaseKey]);

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
    }
  }, [role, fetchUsers]);

  const updateRole = async (userId: string, newRole: string) => {
    const loadingToast = toast.loading(`Updating ${userId} to ${newRole}...`);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) throw new Error('Update failed');

      toast.success(`Role updated to ${newRole}`, { id: loadingToast });
      // Update local state agar perubahan langsung kelihatan
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  if (authLoading) return <div className="p-10 text-center font-black">AUTHENTICATING...</div>;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">User Management</h1>
            <p className="text-muted-foreground font-bold uppercase text-xs mt-1">Found {profiles.length} registered accounts</p>
          </div>
          <Button 
            onClick={fetchUsers} 
            disabled={loading}
            className="border-2 border-foreground bg-white text-foreground hover:bg-secondary font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading && 'animate-spin'}`} />
            Refresh Data
          </Button>
        </div>

        <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-foreground text-white border-b-4 border-foreground">
                <tr>
                  <th className="p-4 font-black uppercase tracking-widest text-xs">User Profile</th>
                  <th className="p-4 font-black uppercase tracking-widest text-xs">Role</th>
                  <th className="p-4 font-black uppercase tracking-widest text-xs">Joined</th>
                  <th className="p-4 font-black uppercase tracking-widest text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-foreground">
                {loading && profiles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center font-black animate-pulse">SYNCING DATABASE...</td>
                  </tr>
                ) : (
                  profiles.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border-2 border-foreground rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="bg-primary text-primary-foreground font-black text-xl rounded-none">
                              {user.first_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-black uppercase text-sm leading-none">{user.first_name} {user.last_name}</span>
                            <span className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">{user.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 border-2 border-foreground font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                          ${user.role === 'admin' ? 'bg-rose-400' : user.role === 'agent' ? 'bg-indigo-400' : 'bg-emerald-400'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="border-2 border-foreground h-10 w-10 p-0 hover:bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-x-[-2px] translate-y-[-2px]">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-4 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-48">
                            <DropdownMenuLabel className="font-black uppercase text-[10px]">Change Role To:</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-foreground h-0.5" />
                            <DropdownMenuItem onClick={() => updateRole(user.id, 'admin')} className="font-bold uppercase text-xs cursor-pointer flex gap-2">
                              <Shield className="h-4 w-4" /> Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRole(user.id, 'agent')} className="font-bold uppercase text-xs cursor-pointer flex gap-2">
                              <UserCheck className="h-4 w-4" /> Agent
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRole(user.id, 'user')} className="font-bold uppercase text-xs cursor-pointer flex gap-2">
                              <UserIcon className="h-4 w-4" /> User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-foreground h-0.5" />
                            <DropdownMenuItem className="text-rose-600 font-black uppercase text-xs cursor-pointer flex gap-2">
                              <Trash2 className="h-4 w-4" /> Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
