import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  UserCheck, 
  MoreVertical, 
  Trash2,
  RefreshCw,
  Ban,
  CheckCircle2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/lib/supabase';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  avatar_url: string;
  created_at: string;
  is_approved: boolean;
}

interface RegistrationRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function ManageUsers() {
  const { role, isLoading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const isFetching = useRef(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const fetchUsers = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    
    try {
      // Fetch Active Profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;
      setProfiles(profileData || []);

      // Fetch Pending Requests
      const { data: requestData, error: requestError } = await supabase
        .from('registration_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestError) throw requestError;
      setRequests(requestData || []);

    } catch (error: any) {
      toast.error("Error loading data: " + error.message);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    if (role === 'admin') {
      fetchUsers();
    }
  }, [role, fetchUsers]);

  const updateRole = async (userId: string, newRole: string) => {
    const loadingToast = toast.loading(`Updating role to ${newRole}...`);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`Role updated successfully`, { id: loadingToast });
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const loadingToast = toast.loading(`${nextStatus ? 'Approving' : 'Blocking'} user...`);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: nextStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${nextStatus ? 'active' : 'blocked'} successfully`, { id: loadingToast });
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, is_approved: nextStatus } : p));
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected', customRole?: string) => {
    const loadingToast = toast.loading(`Processing request...`);
    try {
      if (action === 'approved') {
        const req = requests.find(r => r.id === requestId);
        if (!req) throw new Error("Request data not found");

        const { data, error } = await supabase.functions.invoke('admin-invite', {
          body: {
            requestId: req.id,
            email: req.email,
            firstName: req.first_name,
            lastName: req.last_name,
            phone: req.phone,
            role: customRole || req.role,
            redirectTo: `${window.location.origin}/reset-password`
          }
        });

        if (error) throw error;
        toast.success(`User invited and request approved!`, { id: loadingToast });
      } else {
        const { error } = await supabase
          .from('registration_requests')
          .delete()
          .eq('id', requestId);

        if (error) throw error;
        toast.success(`Request removed`, { id: loadingToast });
      }

      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
    }
  };

  if (authLoading) return <div className="p-10 text-center font-black">AUTHENTICATING...</div>;
  if (role !== 'admin') return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground">User Management</h1>
            <p className="text-muted-foreground font-bold uppercase text-xs mt-1">Manage accounts and access requests</p>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-transparent border-b-2 border-foreground w-full justify-start rounded-none h-auto p-0 mb-6 flex-wrap gap-2">
            <TabsTrigger 
              value="users" 
              className="px-6 py-3 font-black uppercase italic text-sm rounded-none border-t-2 border-l-2 border-r-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-white data-[state=active]:translate-y-[2px]"
            >
              Active Users ({profiles.length})
            </TabsTrigger>
            <TabsTrigger 
              value="requests" 
              className="px-6 py-3 font-black uppercase italic text-sm rounded-none border-t-2 border-l-2 border-r-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-white data-[state=active]:translate-y-[2px]"
            >
              Pending Requests ({requests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-foreground text-white border-b-4 border-foreground">
                    <tr>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">User</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Role</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Status</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Joined</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-foreground">
                    {loading && profiles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-20 text-center font-black animate-pulse">SYNCING DATABASE...</td>
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
                          <td className="p-4">
                            <span className={`px-2 py-0.5 border-2 border-foreground font-black uppercase text-[9px] shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                              ${user.is_approved ? 'bg-emerald-400' : 'bg-rose-400'}`}>
                              {user.is_approved ? 'Active' : 'Blocked'}
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
                                <DropdownMenuItem onClick={() => toggleApproval(user.id, user.is_approved)} className="font-bold uppercase text-xs cursor-pointer flex gap-2">
                                  {user.is_approved ? (
                                    <><Ban className="h-4 w-4 text-rose-600" /> Block User</>
                                  ) : (
                                    <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Unblock User</>
                                  )}
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
          </TabsContent>

          <TabsContent value="requests">
            <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-foreground text-white border-b-4 border-foreground">
                    <tr>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Full Name</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Email / Phone</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Requesting Role</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs">Status</th>
                      <th className="p-4 font-black uppercase tracking-widest text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-foreground">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-20 text-center font-black">NO REQUESTS FOUND.</td>
                      </tr>
                    ) : (
                      requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50">
                          <td className="p-4 font-black uppercase text-sm">
                            {req.first_name} {req.last_name}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-xs">{req.email}</span>
                              <span className="text-[10px] text-muted-foreground">{req.phone || 'No Phone'}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <Select 
                              defaultValue={req.role} 
                              onValueChange={(val) => {
                                setRequests(prev => prev.map(r => r.id === req.id ? { ...r, role: val } : r));
                              }}
                            >
                              <SelectTrigger className="h-8 border-2 border-foreground uppercase font-black text-[9px] w-[100px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-2 border-foreground">
                                <SelectItem value="user">USER</SelectItem>
                                <SelectItem value="agent">AGENT</SelectItem>
                                <SelectItem value="admin">ADMIN</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4">
                            <Badge className={`uppercase font-black text-[9px] border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                              ${req.status === 'pending' ? 'bg-amber-400' : req.status === 'approved' ? 'bg-emerald-400' : 'bg-rose-400'}`}>
                              {req.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            {req.status === 'pending' ? (
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm"
                                  onClick={() => handleRequestAction(req.id, 'approved')}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white border-2 border-foreground font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all h-8"
                                >
                                  ACC (Approve)
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRequestAction(req.id, 'rejected')}
                                  className="border-2 border-foreground font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-[-2px] transition-all h-8"
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[10px] font-black uppercase opacity-40 italic">Handled</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
