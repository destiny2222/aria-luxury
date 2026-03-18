"use client";

import { DashboardShell } from "@/components/DashboardShell";
import { useRouter } from "next/navigation";
import { 
  Eye,
  Check,
  X,
  Activity,
  Users,
  AlertCircle,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { 
  MapPin, 
  Fuel, 
  ShieldCheck,
} from "lucide-react";

interface Listing {
  id: string;
  userId: string;
  make: string;
  model: string;
  type: string;
  year: string;
  status: string;
  description: string;
  pickupArea: string;
  pickupLga: string;
  seat: string;
  availability: boolean;
  availableDates: string[];
  unavailableDates: string[];
  transmission: string;
  gasType: string;
  frontView: string;
  backView: string;
  sideView: string;
  dashboardView: string;
  interiorView: string;
  exteriorFeature: string[];
  interiorFeature: string[];
  millage: string;
  insuranceDoc: string;
  registrationDoc: string;
  customDutyDoc: string;
  ownershipDoc: string;
  rent: number;
  cautionFee: number;
  threeDaysDiscount: number;
  monthDiscount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
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

export default function CarsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalListings, setTotalListings] = useState(0);
  
  // Modal & Action State
  const [selectedCar, setSelectedCar] = useState<Listing | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
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
      const response = await fetch(`/api/admin/listings?${queryParams.toString()}`, {
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
        throw new Error("Failed to fetch listings.");
      }

      const data = await response.json();
      // console.log("Car Listings", data);
      
      if (data.status && data.data) {
        const items = data.data.data || [];
        setListings(items);
        setTotalListings(data.data.pagination?.total || items.length);
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
  }, [page, statusFilter, searchTerm, router]);

  const handleStatusUpdate = async (id: string, newStatus: "approved" | "declined") => {
    let reason = "";
    if (newStatus === "declined") {
      reason = window.prompt("Please enter a reason for declining this listing:") || "";
      if (!reason) return; 
    }
    
    setUpdatingStatusId(`${id}-${newStatus}`);
    
    try {
      // Use local API route
      const response = await fetch(`/api/admin/listings/status?listingId=${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus, ...(reason && { reason }) }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to ${newStatus} listing.`);
      }

      const data = await response.json();
      if (data.status || data.success) {
        setListings(prev => prev.map(listing => 
          (listing.id === id) ? { ...listing, status: newStatus.toUpperCase() } : listing
        ));
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "An error occurred while updating status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchListings();
    }, 500); 
    return () => clearTimeout(timer);
  }, [fetchListings]);

  return (
    <DashboardShell>
      <div className="space-y-8 pt-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">Fleet Management</h1>
            <p className="text-white/40 text-sm sm:text-base">Manage your car listings and document compliance.</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Search listings..."
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
              className="w-full sm:w-auto glass px-6 py-3 rounded-xl text-sm text-white/60 focus:outline-none focus:text-white appearance-none cursor-pointer text-center sm:text-left [&>option]:bg-[#1a1c20] [&>option]:text-white"
            >
               <option value="all" className="bg-[#1a1c20] text-white">All Status</option>
               <option value="pending" className="bg-[#1a1c20] text-white">Pending</option>
               <option value="approved" className="bg-[#1a1c20] text-white">Approved</option>
               <option value="declined" className="bg-[#1a1c20] text-white">Declined</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
             <AlertCircle className="w-5 h-5" />
             <p>{error}</p>
          </div>
        )}

        {/* Cars Table */}
        <div className="glass-card overflow-hidden relative w-full">
           <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded w-full">
           {isLoading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-xl">
               <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <table className="w-full border-collapse text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-white/5 bg-white/1">
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Vehicle Details</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Owner</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Location</th>
                <th className="px-6 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-white/40 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {listings.map((car, index) => (
                <motion.tr 
                  key={car.id || index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-white/2 transition-all"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden glass border border-white/10 p-1 group-hover:scale-105 transition-transform">
                        <Image 
                          src={car.frontView || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=200"} 
                          alt={`${car.make} ${car.model}`}
                          width={56} 
                          height={56} 
                          className="object-cover rounded-lg w-full h-full" 
                        />
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-primary transition-colors capitalize">
                          {car.make} {car.model}
                        </p>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest mt-0.5">{car.type || "Luxury Fleet"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white/80">
                       {car.user?.firstName || "Unknown"} {car.user?.lastName || ""}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                       <span className="text-sm text-white/60">{car.pickupArea}, {car.pickupLga}</span>
                    </div>
                  </td>
                   <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                         car.status === 'APPROVED' ? 'bg-emerald-400/10 text-emerald-400' : 
                         car.status === 'PENDING' ? 'bg-amber-400/10 text-amber-400' :
                         'bg-red-400/10 text-red-400'
                       }`}>
                         {car.status || 'Unknown'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {car.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(car.id || "", "approved")}
                            disabled={updatingStatusId === car.id}
                            className="p-2.5 rounded-xl cursor-pointer glass text-emerald-400 hover:bg-emerald-400/10 transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Approve"
                          >
                            {updatingStatusId === `${car.id}-approved` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(car.id || "", "declined")}
                            disabled={updatingStatusId === car.id}
                            className="p-2.5 rounded-xl cursor-pointer glass text-red-400 hover:bg-red-400/10 transition-all group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Decline"
                          >
                            {updatingStatusId === `${car.id}-declined` ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => {
                          setSelectedCar(car);
                          setActiveImage(car.frontView);
                          setIsModalOpen(true);
                        }}
                        className="p-2.5 rounded-xl cursor-pointer glass hover:text-primary transition-all group/btn"
                      >
                        <Eye className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                      {/* <div className="relative" ref={activeActionId === car.id ? dropdownRef : null}>
                        <button 
                          onClick={() => setActiveActionId(activeActionId === car.id ? null : car.id)}
                          className={`p-2.5 rounded-xl cursor-pointer glass hover:text-white transition-all ${activeActionId === car.id ? 'bg-white/10 text-white' : ''}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {activeActionId === car.id && (
                          <div className="absolute right-0 mt-2 w-48 glass-card border border-white/10 py-2 z-50 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                             <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all">
                               <Edit className="w-3.5 h-3.5 cursor-pointer" />
                               Edit Listing
                             </button>
                             <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 flex items-center gap-3 transition-all">
                               <Clipboard className="w-3.5 h-3.5 cursor-pointer" />
                               View Documents
                             </button>
                             <div className="h-px bg-white/5 my-1" />
                             <button className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-400 hover:bg-red-400/10 flex items-center gap-3 transition-all">
                               <Trash2 className="w-3.5 h-3.5 cursor-pointer" />
                               Delete Listing
                             </button>
                          </div>
                        )}
                      </div> */}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {listings.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-white/20">
                    No listings found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
           </div>
          
          <div className="p-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/40 text-sm">
            <p>Showing {listings.length} of {totalListings} vehicles</p>
            <div className="flex gap-2 w-full sm:w-auto">
               <button 
                 onClick={() => setPage(p => Math.max(1, p - 1))}
                 disabled={page === 1}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg cursor-pointer glass hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Previous
               </button>
               <button 
                 onClick={() => setPage(p => p + 1)}
                 className="flex-1 sm:flex-initial px-4 py-2 rounded-lg cursor-pointer bg-primary text-white font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 Next
               </button>
            </div>
          </div>
        </div>

        {/* --- Car Details Modal --- */}
        <AnimatePresence>
          {isModalOpen && selectedCar && (
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
                    
                    {/* Left Column: Images and Gallery */}
                    <div className="lg:col-span-7 space-y-8">
                      {/* Hero Image */}
                      <div className="relative aspect-16/10 rounded-3xl overflow-hidden glass border border-white/10 group">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeImage}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                          >
                            <Image 
                              src={activeImage || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1200"} 
                              alt={selectedCar.make}
                              fill
                              className="object-cover"
                            />
                          </motion.div>
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                        <div className="absolute bottom-6 left-6">
                           <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                             {activeImage === selectedCar.frontView ? 'Front View' : 
                              activeImage === selectedCar.backView ? 'Back View' :
                              activeImage === selectedCar.sideView ? 'Side View' :
                              activeImage === selectedCar.dashboardView ? 'Dashboard' : 'Interior'}
                           </span>
                        </div>
                      </div>

                      {/* Image Gallery Grid */}
                      <div className="grid grid-cols-5 gap-4">
                        {[selectedCar.frontView, selectedCar.backView, selectedCar.sideView, selectedCar.dashboardView, selectedCar.interiorView].map((view, i) => (
                          <div 
                            key={i} 
                            onClick={() => setActiveImage(view)}
                            className={`relative aspect-square rounded-xl overflow-hidden glass border transition-all cursor-pointer group ${
                              activeImage === view ? 'border-primary ring-2 ring-primary/20' : 'border-white/5 hover:border-white/20'
                            }`}
                          >
                             <Image 
                                src={view || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400"} 
                                alt={`View ${i + 1}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                             />
                             {activeImage === view && (
                               <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px]" />
                             )}
                          </div>
                        ))}
                      </div>

                      {/* Description */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">About this Vehicle</h4>
                        <p className="text-white/70 leading-relaxed text-lg font-light">
                          {selectedCar.description || `Experience the ultimate driving thrill with this exquisite ${selectedCar.make} ${selectedCar.model}. Perfectly maintained and ready for your next adventure.`}
                        </p>
                      </div>

                      {/* Features Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                             Exterior Features
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedCar.exteriorFeature?.length > 0 ? selectedCar.exteriorFeature.map((feat, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-lg glass-card border border-white/5 text-xs text-white/60">
                                {feat}
                              </span>
                            )) : <span className="text-white/20 italic text-xs">No exterior features listed</span>}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                             Interior Features
                          </h4>
                          <div className="flex flex-wrap gap-2">
                           {selectedCar.interiorFeature?.length > 0 ? selectedCar.interiorFeature.map((feat, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-lg glass-card border border-white/5 text-xs text-white/60">
                                {feat}
                              </span>
                            )) : <span className="text-white/20 italic text-xs">No interior features listed</span>}
                          </div>
                        </div>
                      </div>

                      {/* Documents Section */}
                      <div className="space-y-4 pt-4">
                         <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest">Compliance Documents</h4>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                              { label: 'Insurance', url: selectedCar.insuranceDoc },
                              { label: 'Registration', url: selectedCar.registrationDoc },
                              { label: 'Custom Duty', url: selectedCar.customDutyDoc },
                              { label: 'Ownership', url: selectedCar.ownershipDoc }
                            ].map((doc, i) => (
                              <a 
                                key={i} 
                                href={doc.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-4 rounded-2xl glass border border-white/5 hover:bg-white/5 transition-all flex flex-col items-center gap-3 text-center group"
                              >
                                <ShieldCheck className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-bold text-white/60 uppercase tracking-tight">{doc.label}</span>
                              </a>
                            ))}
                         </div>
                      </div>
                    </div>

                    {/* Right Column: Specs, Pricing & Availability */}
                    <div className="lg:col-span-5 space-y-8">
                       {/* Basic Info Card */}
                       <div className="glass-card p-8 border border-white/10 space-y-6">
                          <div className="flex justify-between items-start">
                             <div>
                                <h2 className="text-3xl font-bold text-white capitalize">{selectedCar.make} {selectedCar.model}</h2>
                                <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">
                                   {selectedCar.year} • {selectedCar.type}
                                </p>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                selectedCar.status === 'APPROVED' ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/20' : 
                                selectedCar.status === 'PENDING' ? 'bg-amber-400/20 text-amber-400 border border-amber-400/20' :
                                'bg-red-400/20 text-red-400 border border-red-400/20'
                             }`}>
                                {selectedCar.status}
                             </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="glass p-4 rounded-2xl">
                                <MapPin className="w-5 h-5 text-primary mb-2" />
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Location</p>
                                <p className="text-white text-sm font-bold">{selectedCar.pickupArea}</p>
                                <p className="text-white/40 text-[10px]">{selectedCar.pickupLga}</p>
                             </div>
                             <div className="glass p-4 rounded-2xl">
                                <Activity className="w-5 h-5 text-emerald-400 mb-2" />
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Mileage</p>
                                <p className="text-white text-sm font-bold">{selectedCar.millage || '0 Km'}</p>
                             </div>
                             <div className="glass p-4 rounded-2xl">
                                <Fuel className="w-5 h-5 text-amber-400 mb-2" />
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Fuel & Transmission</p>
                                <p className="text-white text-sm font-bold">{selectedCar.gasType}</p>
                                <p className="text-white/40 text-[10px]">{selectedCar.transmission}</p>
                             </div>
                             <div className="glass p-4 rounded-2xl">
                                <Users className="w-5 h-5 text-blue-400 mb-2" />
                                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Capacity</p>
                                <p className="text-white text-sm font-bold">{selectedCar.seat} Seats</p>
                             </div>
                          </div>
                       </div>

                       {/* Pricing Card */}
                       <div className="glass-card p-8 border border-emerald-400/10 bg-emerald-400/2 space-y-6">
                          <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Pricing Breakdown</h4>
                          
                          <div className="space-y-4">
                             <div className="flex justify-between items-center">
                                <span className="text-white/60 text-sm">Rent per Day</span>
                                <span className="text-xl font-bold text-white">₦{selectedCar.rent?.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-white/60 text-sm">Caution Fee</span>
                                <span className="text-sm font-bold text-white">₦{selectedCar.cautionFee?.toLocaleString()}</span>
                             </div>
                             <div className="h-px bg-white/5 my-2" />
                             <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                      <span className="text-white/60 text-xs">3+ Days Discount</span>
                                   </div>
                                   <span className="text-emerald-400 text-xs font-bold">{selectedCar.threeDaysDiscount}% OFF</span>
                                </div>
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                      <span className="text-white/60 text-xs">Monthly Discount</span>
                                   </div>
                                   <span className="text-emerald-400 text-xs font-bold">{selectedCar.monthDiscount}% OFF</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Availability & Owner */}
                       <div className="glass-card p-8 border border-white/5 space-y-6">
                           <div className="space-y-4">
                              <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest">Unavailable Dates</h4>
                              <div className="flex flex-wrap gap-2 text-[10px]">
                                 {selectedCar.unavailableDates?.length > 0 ? selectedCar.unavailableDates.slice(0, 10).map((date, i) => (
                                    <span key={i} className="px-2 py-1 rounded bg-red-400/10 text-red-400 border border-red-400/10">
                                       {date}
                                    </span>
                                 )) : <span className="text-white/20 italic">No unavailable dates</span>}
                                 {selectedCar.unavailableDates?.length > 10 && <span className="text-white/40">+{selectedCar.unavailableDates.length - 10} more</span>}
                              </div>
                           </div>

                          <div className="pt-6 border-t border-white/5">
                             <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Owner Contact</h4>
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border-2 border-primary/20 p-0.5 shadow-xl">
                                   <div className="w-full h-full rounded-full bg-linear-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold italic text-lg shadow-inner">
                                     {selectedCar.user?.firstName?.[0]}{selectedCar.user?.lastName?.[0]}
                                   </div>
                                </div>
                                <div>
                                  <p className="font-bold text-white text-base">{selectedCar.user?.firstName} {selectedCar.user?.lastName}</p>
                                  <p className="text-xs text-white/40">{selectedCar.user?.email}</p>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-black/40 flex items-center justify-end gap-4">
                   <button 
                     onClick={() => setIsModalOpen(false)}
                     className="px-8 py-3 rounded-xl glass cursor-pointer hover:bg-white/10 text-white font-bold transition-all border border-white/10"
                   >
                     Close Details
                   </button>
                   {selectedCar.status === 'PENDING' && (
                     <div className="flex gap-2">
                        <button 
                           onClick={() => {
                              handleStatusUpdate(selectedCar.id, "approved");
                              setIsModalOpen(false);
                           }}
                           className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all shadow-lg shadow-emerald-500/20"
                        >
                           Approve
                        </button>
                        <button 
                           onClick={() => {
                              handleStatusUpdate(selectedCar.id, "declined");
                              setIsModalOpen(false);
                           }}
                           className="px-8 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all shadow-lg shadow-red-500/20"
                        >
                           Decline
                        </button>
                     </div>
                   )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}
