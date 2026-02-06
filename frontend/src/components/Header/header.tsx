"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { FiSearch, FiBell, FiChevronDown, FiLogOut, FiUser, FiActivity, FiShield, FiBellOff } from "react-icons/fi";
import { useRouter, usePathname } from "next/navigation";
import UserAvatar from "../ui/UserAvatar";
import { getImageUrl } from "@/utils/helpers";
import Swal from "sweetalert2";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface NotificationData {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // State untuk pencarian
  const [user, setUser] = useState({ 
    id: "", name: "", profile_image: null, role: "", companyLogo: null 
  });
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  
  const router = useRouter();
  const pathname = usePathname();

  // --- LOGIKA PENCARIAN GLOBAL ---
  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return;

    const role = user.role;

    // Mapping keyword ke URL berdasarkan Sidebar
    if (role === "admin") {
      if (q.includes("user") || q.includes("karyawan") || q.includes("pegawai") || q.includes("employee")) 
        router.push("/dashboard/admin/users");
      else if (q.includes("absen") || q.includes("attendance") || q.includes("recap") || q.includes("hadir")) 
        router.push("/dashboard/admin/attendances");
      else if (q.includes("cuti") || q.includes("leave") || q.includes("izin")) 
        router.push("/dashboard/admin/leaves");
      else if (q.includes("gaji") || q.includes("payroll") || q.includes("slip")) 
        router.push("/dashboard/admin/payroll");
      else if (q.includes("bill") || q.includes("langganan") || q.includes("paket") || q.includes("subs")) 
        router.push("/dashboard/admin/subscription");
      else if (q.includes("dash")) 
        router.push("/dashboard/admin");
    } 
    else if (role === "employee") {
      if (q.includes("absen") || q.includes("clock") || q.includes("hadir")) 
        router.push("/dashboard/employee/attendance");
      else if (q.includes("gaji") || q.includes("payroll") || q.includes("slip")) 
        router.push("/dashboard/employee/payroll");
      else if (q.includes("dash") || q.includes("utama")) 
        router.push("/dashboard/employee");
    }
    else if (role === "superadmin") {
      if (q.includes("subs") || q.includes("langganan") || q.includes("paket")) 
        router.push("/dashboard/superadmin/subscriptions");
      else if (q.includes("log") || q.includes("audit") || q.includes("sistem")) 
        router.push("/dashboard/superadmin/logs");
      else router.push("/dashboard/superadmin");
    }

    setSearchQuery(""); // Reset input setelah cari
  };

  const syncData = useCallback(async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      if (!pathname.includes("/Auth")) router.replace("/Auth/login");
      return;
    }

    const currentRole = (localStorage.getItem("role") || "employee").toLowerCase();
    
    setUser({
      id: localStorage.getItem("userId") || "",
      name: localStorage.getItem("name") || "User",
      profile_image: localStorage.getItem("profile_image") as any,
      role: currentRole,
      companyLogo: localStorage.getItem("companyLogo") as any
    });

    if (currentRole === 'superadmin') return;

    try {
        const res = await fetch(`${API_BASE}/users/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setNotifications(result.data);
    } catch (err) { 
        console.error("Gagal sinkronisasi notifikasi"); 
    }
  }, [router, pathname]);

  const handleMarkAsRead = async () => {
    const token = localStorage.getItem("token");
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (!token || unreadCount === 0) return;

    try {
      const res = await fetch(`${API_BASE}/users/notifications/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Gagal memperbarui status notifikasi");
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: "Anda harus login kembali untuk mengakses data.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4A86C5',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      localStorage.clear();
      router.replace("/Auth/login");
    }
  };

  useEffect(() => {
    setMounted(true);
    syncData();
    window.addEventListener("storage", syncData);
    window.addEventListener("profileSync", syncData); 
    return () => {
      window.removeEventListener("storage", syncData);
      window.removeEventListener("profileSync", syncData);
    };
  }, [syncData]);

  const getNotifTitle = () => {
    return user.role === 'admin' ? 'LOG AUDIT PERUSAHAAN' : 'PEMBERITAHUAN SAYA';
  };

  if (!mounted) return <header className="h-20 bg-white border-b" />;

  return (
    <header className="fixed top-0 left-0 w-full h-20 flex items-center justify-between bg-white px-8 shadow-sm border-b border-gray-100 z-50">
      
      {/* KIRI: Branding Section */}
      <div className="flex items-center gap-4">
        <div 
          className="relative w-12 h-12 cursor-pointer flex items-center justify-center p-1 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 transition-transform active:scale-95" 
          onClick={() => router.push(`/dashboard/${user.role}`)}
        >
          <Image 
            src={getImageUrl('logos', user.companyLogo) || "/logo.png"}
            alt="Logo" 
            fill 
            className="object-contain p-1" 
            unoptimized 
          />
        </div>
        <div className="hidden sm:block border-l pl-4 border-gray-100">
          <h2 className="text-xs font-black text-gray-800 uppercase tracking-widest leading-tight">
            {user.role === 'superadmin' ? 'Control Center' : 'Corporate Portal'}
          </h2>
          <p className="text-[10px] text-[#4A86C5] font-bold uppercase">
             {user.role === 'superadmin' ? 'System Root' : user.role === 'admin' ? 'Management System' : 'Employee Network'}
          </p>
        </div>
      </div>

      {/* TENGAH: Global Search (Perbaikan Logic) */}
      <form 
        onSubmit={handleGlobalSearch}
        className="hidden md:flex items-center gap-3 bg-gray-50 px-5 py-2.5 rounded-2xl w-full max-w-md border border-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all"
      >
        <FiSearch className="text-gray-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={user.role === 'employee' ? "Ketik 'absen' atau 'gaji'..." : "Ketik 'cuti', 'karyawan', atau 'billing'..."} 
          className="bg-transparent outline-none text-sm w-full text-gray-700 font-medium" 
        />
        <button type="submit" hidden />
      </form>

      <div className="flex items-center gap-6">
        {/* Notifikasi & Profile (Sama seperti sebelumnya) */}
        {user.role !== 'superadmin' && (
          <div className="relative">
            <button 
              className={`p-2.5 rounded-xl transition-all relative ${showNotif ? 'bg-blue-50 text-[#4A86C5]' : 'text-gray-400 hover:bg-gray-100'}`}
              onClick={() => {
                  if (!showNotif) handleMarkAsRead(); 
                  setShowNotif(!showNotif);
              }}
            >
              <FiBell size={22} />
              {notifications.some(n => !n.is_read) && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>

            {showNotif && (
              <div className="absolute right-0 mt-3 w-80 bg-white shadow-2xl rounded-2xl border border-gray-100 p-4 z-50 max-h-[450px] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-50">
                      <h3 className="text-[11px] font-black text-gray-400 tracking-widest flex items-center gap-2">
                          {user.role === 'employee' ? <FiActivity /> : <FiShield />}
                          {getNotifTitle()}
                      </h3>
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">Terbaru</span>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                      {notifications.length > 0 ? notifications.map((n) => (
                          <div key={n.id} className={`p-3 rounded-xl border transition-all ${n.is_read ? 'bg-white border-gray-50 opacity-70' : 'bg-blue-50/30 border-blue-100 ring-1 ring-blue-50'}`}>
                              <p className="text-[11px] font-black text-gray-800 leading-tight">{n.title}</p>
                              <p className="text-[10px] text-gray-500 mt-1 leading-snug">{n.message}</p>
                              <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">
                                  {new Date(n.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} • {new Date(n.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                          </div>
                      )) : (
                          <div className="py-8 text-center bg-gray-50 rounded-xl">
                              <FiBellOff className="mx-auto text-gray-200 mb-2" size={32} />
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Belum ada aktivitas</p>
                          </div>
                      )}
                  </div>
              </div>
            )}
          </div>
        )}

        <div className="relative group">
          <div 
            onClick={() => router.push(`/dashboard/profile`)} 
            className="flex items-center gap-4 pl-6 border-l border-gray-100 cursor-pointer group hover:opacity-80 transition-all"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-gray-800 group-hover:text-[#4A86C5] transition-colors line-clamp-1 max-w-[120px]">{user.name}</p>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-tighter">{user.role}</p>
            </div>
            <UserAvatar name={user.name} image={getImageUrl('profiles', user.profile_image)} />
            <FiChevronDown className="text-gray-300 group-hover:text-gray-600 transition-colors" />
          </div>

          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-50 p-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50">
            <button 
              onClick={() => router.push('/dashboard/profile')}
              className="flex items-center gap-3 w-full p-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <FiUser className="text-blue-500" /> Profil Saya
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-2.5 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <FiLogOut /> Keluar
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}