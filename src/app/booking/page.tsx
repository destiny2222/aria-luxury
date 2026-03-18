"use client";

import { DashboardShell } from "@/components/DashboardShell";
import { useRouter } from "next/navigation";
import { 
  User,
  Car,
  AlertCircle,
  Hash,
  Calendar,
  Eye,
  X,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface Booking {
  id: string;
  listingId: string;
  rentalUserId: string;
  listingUserId: string;
  pickupDate: string;
  returnDate: string;
  pickupTime: string;
  returnTime: string;
  status: string;
  pickupArea: string;
  dropoffArea: string;
  duration: string;
  reason: string | null;
  serviceCharge: string;
  cautionFee: string;
  totalAmount: string;
  paidAmount: string;
  balanceAmount: string;
  additionalInfo: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  reference?: string;
  transactionRef?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  listing?: {
    make: string;
    model: string;
    frontView?: string;
  };
}

// Helper function to get auth token from cookies
function getAuthToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(c => 
    c.trim().startsWith('session=') || 
    c.trim().startsWith('token=') ||
    c.trim().startsWith('auth_token=') ||
    c.trim().startsWith('admin_token=')
  );
  if (authCookie) {
    return authCookie.split('=')[1] || authCookie.split('=')[1];
  }
  return null;
}

export default function BookingPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      // Get auth token
      const token = getAuthToken();
      const authHeaders: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

      // Use local API route
      const response = await fetch(`/api/admin/bookings?${queryParams.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          router.push('/');
          return;
        }
        throw new Error("Failed to fetch bookings.");
      }

      const data = await response.json();
      console.log("Bookings Data", data);
      
      if (data.status && data.data) {
        const items = data.data.data || [];
        setBookings(items);
        setTotalBookings(data.data.pagination?.total || items.length);
      }
    } catch (err: unknown) {
      // If unauthorized, redirect to login
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('unauthorized'))) {
        router.push('/');
        return;
      }
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, 500); 
    return () => clearTimeout(timer);
  }, [fetchBookings]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <DashboardShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Booking Management</h1>
            <p className="text-white/40">Track and manage active rentals and transaction history.</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Search by reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/3 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
             <select 
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto glass px-6 py-3 rounded-xl text-sm text-white/60 focus:outline-none 
              focus:text-white appearance-none cursor-pointer text-center sm:text-left [&>option]:bg-[#1a1c20] [&>option]:text-white"
            >
               <option value="all" className="bg-[#1a1c20] text-white">All Status</option>
               <option value="pending" className="bg-[#1a1c20] text-white">Pending</option>
               <option value="in_progress" className="bg-[#1a1c20] text-white">In Progress</option>
               <option value="completed" className="bg-[#1a1c20] text-white">Completed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
             <AlertCircle className="w-5 h-5" />
             <p>{error}</p>
          </div>
        )}

        {/* Bookings Table */}
        <div className="glass-card overflow-hidden relative w-full">
           <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded w-full">
           {isLoading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <table className="w-full border-collapse text-left min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/1">
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Booking ID</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Location</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Duration</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Period</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Status</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Total Amount</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.map((booking, index) => (
                <motion.tr 
                  key={booking.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-white/2 transition-all"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                        <Hash className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-[10px] uppercase tracking-wider line-clamp-1 w-24">{booking.id}</p>
                        <p className="text-[9px] text-white/20 mt-0.5">Created: {formatDate(booking.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white/80">
                      {booking.pickupArea}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-white/60">
                      {booking.duration.split(" day(s)")[0]} Days
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[10px] text-white/40 whitespace-nowrap">
                       <Calendar className="w-3.5 h-3.5" />
                       <span>{formatDate(booking.pickupDate)} - {formatDate(booking.returnDate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      (booking.status === 'COMPLETED' || booking.status === 'PAID') ? 'bg-emerald-400/10 text-emerald-400' : 
                      (booking.status === 'PENDING' || booking.status === 'RETURN_REQUESTED') ? 'bg-amber-400/10 text-amber-400' :
                      booking.status === 'UNPAID' ? 'bg-red-400/10 text-red-400' :
                      'bg-white/5 text-white/40'
                    }`}>
                      {booking.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-white">
                      ₦{parseFloat(booking.totalAmount).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button 
                      onClick={() => {
                        setSelectedBooking(booking);
                        setIsModalOpen(true);
                      }}
                      className="p-2.5 rounded-xl cursor-pointer glass hover:text-primary transition-all group/btn"
                    >
                      <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </td>
                </motion.tr>
              ))}
              {bookings.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-white/20">
                    No bookings found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
           </div>
          
          <div className="p-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-sm">
            <p>Showing {bookings.length} of {totalBookings} records</p>
            <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg glass hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Previous
               </button>
               <button 
                 onClick={() => setPage(p => p + 1)}
                 disabled={bookings.length < 10}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-primary text-white font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Next
               </button>
            </div>
          </div>
        </div>
        {/* --- Booking Details Modal --- */}
        <AnimatePresence>
          {isModalOpen && selectedBooking && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl h-[90vh] glass-card overflow-hidden shadow-2xl border border-white/10 flex flex-col"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 rounded-full glass hover:bg-white/20 text-white transition-all z-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Left Column: Car Info and Timeline */}
                    <div className="lg:col-span-7 space-y-8">
                      {/* Car Hero Section */}
                      <div className="relative aspect-video rounded-3xl overflow-hidden glass border border-white/10 group">
                        {selectedBooking.listing?.frontView ? (
                          <Image 
                            src={selectedBooking.listing.frontView} 
                            alt={selectedBooking.listing.make}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                            <Car className="w-20 h-20 text-white/10" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-6 left-8">
                           <div className="flex items-center gap-3 mb-2">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                               (selectedBooking.status === 'COMPLETED' || selectedBooking.status === 'PAID') ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/20' : 
                               (selectedBooking.status === 'PENDING' || selectedBooking.status === 'RETURN_REQUESTED') ? 'bg-amber-400/20 text-amber-400 border border-amber-400/20' :
                               selectedBooking.status === 'UNPAID' ? 'bg-red-400/20 text-red-400 border border-red-400/20' :
                               'bg-white/5 text-white/40 border border-white/10'
                             }`}>
                               {selectedBooking.status.replace("_", " ")}
                             </span>
                           </div>
                           <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                             {selectedBooking.listing?.make} {selectedBooking.listing?.model}
                           </h2>
                        </div>
                      </div>

                      {/* Rental Journey */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                 <Calendar className="w-5 h-5" />
                              </div>
                              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Collection</h4>
                           </div>
                           <div className="space-y-1">
                              <p className="text-2xl font-bold text-white tracking-tight">{formatDate(selectedBooking.pickupDate)}</p>
                              <div className="flex items-center gap-2 text-white/40 text-sm">
                                <Clock className="w-4 h-4" />
                                {selectedBooking.pickupTime}
                              </div>
                           </div>
                           <div className="pt-4 border-t border-white/5 flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-primary mt-0.5" />
                              <div>
                                 <p className="text-sm font-bold text-white">{selectedBooking.pickupArea}</p>
                                 <p className="text-[10px] text-white/30 uppercase tracking-widest">Base Location</p>
                              </div>
                           </div>
                        </div>

                        <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-2xl bg-emerald-400/10 text-emerald-400">
                                 <Calendar className="w-5 h-5" />
                              </div>
                              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Return</h4>
                           </div>
                           <div className="space-y-1">
                              <p className="text-2xl font-bold text-white tracking-tight">{formatDate(selectedBooking.returnDate)}</p>
                              <div className="flex items-center gap-2 text-white/40 text-sm">
                                <Clock className="w-4 h-4" />
                                {selectedBooking.returnTime}
                              </div>
                           </div>
                           <div className="pt-4 border-t border-white/5 flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-emerald-400 mt-0.5" />
                              <div>
                                 <p className="text-sm font-bold text-white">{selectedBooking.dropoffArea}</p>
                                 <p className="text-[10px] text-white/30 uppercase tracking-widest">Drop-off Zone</p>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Rental Content & Additional Info */}
                      {(selectedBooking.reason || selectedBooking.additionalInfo) && (
                        <div className="space-y-6">
                           {selectedBooking.reason && (
                             <div className="space-y-3">
                               <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Purpose of Rental</h4>
                               <div className="p-6 rounded-2xl glass border border-white/5">
                                 <p className="text-white/70 leading-relaxed italic">&quot;{selectedBooking.reason}&quot;</p>
                               </div>
                             </div>
                           )}
                        </div>
                      )}

                      {/* Booking Metadata */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                         <div className="glass p-4 rounded-2xl border border-white/5 text-center">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Duration</p>
                            <p className="text-white font-bold">{selectedBooking.duration.split(" day(s)")[0]} Days</p>
                         </div>
                         <div className="glass p-4 rounded-2xl border border-white/5 text-center">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Created</p>
                            <p className="text-white font-bold text-xs">{formatDate(selectedBooking.createdAt)}</p>
                         </div>
                         <div className="glass p-4 rounded-2xl border border-white/5 text-center">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Last Update</p>
                            <p className="text-white font-bold text-xs">{formatDate(selectedBooking.updatedAt)}</p>
                         </div>
                         <div className="glass p-4 rounded-2xl border border-white/5 text-center">
                            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-1">Booking Hash</p>
                            <p className="text-white font-bold text-[10px] uppercase tracking-wider">{selectedBooking.id.slice(0, 8)}</p>
                         </div>
                      </div>
                    </div>

                    {/* Right Column: Financials & Customer */}
                    <div className="lg:col-span-5 space-y-8">
                       {/* Price Card */}
                       <div className="glass-card p-8 border border-white/10 bg-linear-to-br from-white/3 to-transparent space-y-8">
                          <div className="flex justify-between items-center pb-6 border-b border-white/5">
                             <div>
                                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Total Rental Fee</p>
                                <p className="text-4xl font-black text-primary italic tracking-tighter">₦{parseFloat(selectedBooking.totalAmount).toLocaleString()}</p>
                             </div>
                             <div className="text-right">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                                  selectedBooking.balanceAmount === "0.00" ? 'bg-emerald-400/20 text-emerald-400' : 'bg-red-400/20 text-red-400'
                                }`}>
                                   {selectedBooking.balanceAmount === "0.00" ? 'Fully Paid' : 'Payment Due'}
                                </span>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-white/40">Daily Rate Summary</span>
                                <span className="text-white font-medium">₦{(parseFloat(selectedBooking.totalAmount) / parseInt(selectedBooking.duration)).toLocaleString()} / day</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-white/40">Service Charge</span>
                                <span className="text-white font-medium">₦{parseFloat(selectedBooking.serviceCharge).toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-white/40">Caution Deposit</span>
                                <span className="text-white font-medium">₦{parseFloat(selectedBooking.cautionFee).toLocaleString()}</span>
                             </div>
                             
                             <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                      <span className="text-white/60 text-sm">Amount Paid</span>
                                   </div>
                                   <span className="text-emerald-400 font-bold">₦{parseFloat(selectedBooking.paidAmount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2 text-red-400/60">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                      <span className="text-sm">Balance Remaining</span>
                                   </div>
                                   <span className="text-red-400 font-bold">₦{parseFloat(selectedBooking.balanceAmount).toLocaleString()}</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Verification Status */}
                       <div className="glass-card p-8 border border-emerald-400/10 bg-emerald-400/2 space-y-6">
                           <div className="flex items-center gap-3 text-emerald-400 mb-2">
                             <div className="p-2 rounded-xl bg-emerald-400/10">
                                <ShieldCheck className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/50">Smart Contract Secure</p>
                                <p className="text-sm font-bold text-white">Verified Transaction</p>
                             </div>
                           </div>
                           
                           <div className="space-y-4">
                              <div className="flex items-center gap-3 text-white/60 text-xs">
                                 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                 <span className="tracking-tight line-clamp-1">Ref ID: {selectedBooking.transactionRef || selectedBooking.id}</span>
                              </div>
                              <p className="text-[10px] text-white/40 leading-relaxed italic">
                                &quot;All payments are protected through our secure luxury escrow system. Deposits are automatically eligible for refund within 48h of vehicle return.&quot;
                              </p>
                           </div>
                       </div>

                       {/* Customer Card snippet if needed */}
                       <div className="glass-card p-6 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold italic text-sm">
                                {selectedBooking.user?.firstName?.[0]}{selectedBooking.user?.lastName?.[0]}
                             </div>
                             <div>
                                <p className="font-bold text-white text-sm">{selectedBooking.user?.firstName} {selectedBooking.user?.lastName}</p>
                                <p className="text-[10px] text-white/40">{selectedBooking.user?.email}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-end gap-4">
                   <button 
                     onClick={() => setIsModalOpen(false)}
                     className="px-8 py-3 rounded-xl glass cursor-pointer hover:bg-white/10 text-white font-bold transition-all border border-white/10"
                   >
                     Close
                   </button>
                   {/* <button className="px-8 py-3 rounded-xl bg-primary hover:bg-primary-light text-white font-bold transition-all shadow-lg shadow-primary/20">
                     Issue Refund
                   </button> */}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
