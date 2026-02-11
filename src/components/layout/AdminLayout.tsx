import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Plane, 
  ClipboardList, 
  Settings, 
  Search, 
  Bell, 
  Menu, 
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
}

export function AdminLayout({ children, showSearch = true }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, profile, signOut } = useAuth();

  const navItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/admin/dashboard' },
    { label: 'Manage Users', icon: Users, href: '/admin/users' },
    { label: 'Airports', icon: Plane, href: '/admin/airports' },
    { label: 'Airlines', icon: Plane, href: '/admin/airlines' },
    { label: 'Bookings', icon: ClipboardList, href: '/admin/bookings' },
    { label: 'Flights', icon: Plane, href: '/admin/flights' },
    { label: 'SearchApi', icon: Activity, href: '/admin/searchapi' },
    { label: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className={`${
          sidebarOpen ? 'w-72' : 'w-24'
        } border-r-4 border-foreground bg-secondary transition-all duration-300 flex flex-col z-50`}
      >
        <div className="h-20 p-4 border-b-4 border-foreground flex items-center justify-between">
          <Link to="/" className={`flex items-center gap-3 transition-opacity duration-200 ${!sidebarOpen && 'opacity-0 md:opacity-100'}`}>
            <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Plane className="h-6 w-6 text-primary-foreground" />
            </div>
            {sidebarOpen && <span className="text-2xl font-black uppercase tracking-tighter">SkyAdmin</span>}
          </Link>
        </div>

        <nav className="flex-1 p-6 flex flex-col gap-3 overflow-y-auto mt-4">
          {navItems.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive(item.href) ? 'default' : 'ghost'}
                className={`w-full ${sidebarOpen ? 'justify-start px-4 h-14' : 'justify-center h-14'} gap-4 border-2 transition-all group ${
                  isActive(item.href) 
                    ? 'border-foreground bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' 
                    : 'border-transparent hover:bg-white hover:border-foreground hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                }`}
              >
                <item.icon className={`h-6 w-6 shrink-0 ${isActive(item.href) ? 'text-primary-foreground' : 'text-foreground group-hover:scale-110 transition-transform'}`} />
                {sidebarOpen && <span className="font-bold uppercase text-sm tracking-wide">{item.label}</span>}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t-4 border-foreground bg-muted/50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full mb-4 border-2 border-foreground bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hidden md:flex h-10"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setIsLogoutDialogOpen(true)}
            className={`w-full ${sidebarOpen ? 'justify-start px-4' : 'justify-center'} gap-4 text-rose-600 font-black uppercase text-xs h-12 border-2 border-transparent hover:border-rose-600 hover:bg-rose-50`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <header className="h-20 border-b-4 border-foreground bg-white flex items-center justify-between px-8 shrink-0 z-40">
          <div className="flex-1 max-w-2xl">
            {showSearch && (
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                <Input 
                  placeholder="Universal Search..." 
                  className="h-12 pl-12 pr-4 bg-muted/30 border-2 border-foreground font-bold focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-white focus-visible:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="relative border-2 border-foreground h-12 w-12 hover:bg-primary/10 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
              <Bell className="h-6 w-6" />
              <span className="absolute top-2 right-2 h-3.5 w-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            </Button>
            
            <div className="h-10 w-px bg-foreground/20 mx-1"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <p className="text-sm font-black uppercase tracking-tight leading-none group-hover:text-primary transition-colors">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 leading-none">{role}</p>
                  </div>
                  <Button variant="ghost" className="relative h-12 w-12 rounded-none p-0 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all translate-x-[-2px] translate-y-[-2px]">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-black text-lg rounded-none">
                        {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-2" align="end">
                <DropdownMenuLabel className="px-3 py-4">
                  <div className="flex flex-col space-y-1">
                    <p className="text-lg font-black uppercase leading-none">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-xs font-bold text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-foreground h-1 my-2" />
                <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="py-3 font-bold uppercase text-xs cursor-pointer focus:bg-primary focus:text-primary-foreground">
                  <Settings className="mr-3 h-4 w-4" />
                  System Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-foreground h-0.5 my-1" />
                <DropdownMenuItem onClick={() => setIsLogoutDialogOpen(true)} className="py-3 font-bold uppercase text-xs cursor-pointer focus:bg-rose-500 focus:text-white text-rose-600">
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout Session
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {children}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="border-4 border-foreground rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-100 border-2 border-foreground">
                <AlertTriangle className="h-6 w-6 text-rose-600" />
              </div>
              <AlertDialogTitle className="text-xl font-black uppercase tracking-tight">Confirm Logout</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-foreground font-medium">
              Are you sure you want to end your session? You will need to login again to access the admin panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
            <AlertDialogCancel className="rounded-none border-2 border-foreground font-bold uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-11 hover:bg-secondary active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all">
              Stay Logged In
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSignOut}
              className="bg-rose-600 rounded-none border-2 border-foreground font-black uppercase text-xs shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-11 hover:bg-rose-700 active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all text-white"
            >
              Logout Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
