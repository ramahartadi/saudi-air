import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plane, User, Menu, X, LogOut, LayoutDashboard, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, profile, signOut } = useAuth();
  
  const navLinks = [
    { href: '/', label: 'Search Flights' },
    ...(user ? [{ href: '/my-bookings', label: 'My Bookings' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-primary">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="hidden sm:inline">SkyBook</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button 
                variant={isActive(link.href) ? 'default' : 'ghost'}
                className="font-medium"
              >
                {link.label}
              </Button>
            </Link>
          ))}
          {role === 'admin' && (
            <Link to="/admin/dashboard">
              <Button 
                variant={isActive('/admin/dashboard') ? 'default' : 'ghost'}
                className="font-medium"
              >
                Admin Panel
              </Button>
            </Link>
          )}
        </nav>

        {/* Auth Buttons / Profile */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 border-2 border-foreground">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-2 border-foreground" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <p className="text-[10px] mt-1 uppercase font-bold text-primary">{role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-foreground h-px" />
                {role === 'admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-foreground h-px" />
                <DropdownMenuItem onClick={() => setIsLogoutDialogOpen(true)} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline">
                  <User className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-2 border-foreground bg-background p-4">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={isActive(link.href) ? 'default' : 'ghost'}
                  className="w-full justify-start font-medium"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            {role === 'admin' && (
              <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button 
                  variant={isActive('/admin/dashboard') ? 'default' : 'ghost'}
                  className="w-full justify-start font-medium"
                >
                  Admin Panel
                </Button>
              </Link>
            )}
            <div className="h-px bg-foreground/20 my-2" />
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-10 w-10 border-2 border-foreground">
                    <AvatarFallback>
                      {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold">{profile?.first_name} {profile?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-start text-destructive" onClick={() => setIsLogoutDialogOpen(true)}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-rose-100 border-2 border-foreground rounded-full">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
              </div>
              <AlertDialogTitle className="text-lg font-bold">Logout?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-foreground">
              Are you sure you want to log out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-none border-2 border-foreground font-bold h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSignOut}
              className="bg-rose-600 rounded-none border-2 border-foreground font-bold h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-rose-700 active:shadow-none active:translate-x-[1px] active:translate-y-[1px] transition-all text-white"
            >
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
