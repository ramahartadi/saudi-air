import { Plane } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t-2 border-foreground bg-secondary mt-auto">
      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-4">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-primary">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <span>SkyBook</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted partner for Saudi Airlines flight bookings.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:underline">Search Flights</a></li>
              <li><a href="/my-bookings" className="hover:underline">My Bookings</a></li>
              <li><a href="/login" className="hover:underline">Login</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">Help Center</a></li>
              <li><a href="#" className="hover:underline">Contact Us</a></li>
              <li><a href="#" className="hover:underline">FAQs</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:underline">Terms of Service</a></li>
              <li><a href="#" className="hover:underline">Privacy Policy</a></li>
              <li><a href="#" className="hover:underline">Refund Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-foreground text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SkyBook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
