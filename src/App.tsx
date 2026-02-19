import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import FlightsPage from "./pages/FlightsPage";
import HotelsPage from "./pages/HotelsPage";
import HotelDetailPage from "./pages/HotelDetailPage";
import UserFlightsPage from "./pages/UserFlightsPage";
import AgentFlightsPage from "./pages/AgentFlightsPage";
import PassengersPage from "./pages/booking/PassengersPage";
import SeatsPage from "./pages/booking/SeatsPage";
import BaggagePage from "./pages/booking/BaggagePage";
import PaymentPage from "./pages/booking/PaymentPage";
import CheckoutPage from "./pages/booking/CheckoutPage";
import ConfirmationPage from "./pages/booking/ConfirmationPage";
import BookingDetailPage from "./pages/booking/BookingDetailPage";
import HotelBookingPage from "./pages/booking/HotelBookingPage";
import HotelCheckoutPage from "./pages/booking/HotelCheckoutPage";
import HotelConfirmationPage from "./pages/booking/HotelConfirmationPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import ManageAirports from "./pages/admin/ManageAirports";
import ManageAirlines from "./pages/admin/ManageAirlines";
import ManageFlights from "./pages/admin/ManageFlights";
import ManageHotelChains from "./pages/admin/ManageHotelChains";
import ManageBookings from "./pages/admin/ManageBookings";
import SearchApiPage from "./pages/admin/SearchApiPage";
import MyBookings from "./pages/MyBookings";
import NotFound from "./pages/NotFound";

import { AuthProvider } from "./hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/flights" element={<FlightsPage />} />
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/hotels/:id" element={<HotelDetailPage />} />
            <Route path="/user/flights" element={<UserFlightsPage />} />
            <Route path="/agent/flights" element={<AgentFlightsPage />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/booking/detail/:id" element={<BookingDetailPage />} />
            <Route path="/booking/hotel" element={<HotelBookingPage />} />
            <Route path="/booking/passengers" element={<PassengersPage />} />
            <Route path="/booking/seats" element={<SeatsPage />} />
            <Route path="/booking/baggage" element={<BaggagePage />} />
            <Route path="/booking/payment" element={<PaymentPage />} />
            <Route path="/booking/checkout/:id" element={<CheckoutPage />} />
            <Route path="/booking/hotel-checkout/:id" element={<HotelCheckoutPage />} />
            <Route path="/booking/confirmation" element={<ConfirmationPage />} />
            <Route path="/booking/hotel-confirmation" element={<HotelConfirmationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/airports" element={<ManageAirports />} />
            <Route path="/admin/airlines" element={<ManageAirlines />} />
            <Route path="/admin/bookings" element={<ManageBookings />} />
            <Route path="/admin/flights" element={<ManageFlights />} />
            <Route path="/admin/hotel-chains" element={<ManageHotelChains />} />
            <Route path="/admin/searchapi" element={<SearchApiPage />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
