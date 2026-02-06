"use client";

import React, { useEffect, useState, useCallback } from "react";
// PERBAIKAN 1: Link harus dari next/link, bukan next/navigation
import Link from "next/link"; 
import { 
  FiGrid, FiClock, FiUsers, FiSettings, 
  FiShield, FiLogOut, FiBriefcase, FiDollarSign, FiActivity,
  FiCreditCard 
} from "react-icons/fi";
// PERBAIKAN 2: next/navigation hanya untuk hook
import { usePathname, useRouter } from "next/navigation"; 

const API_BASE_URL = "http://localhost:5000/api";

type UserRole = "superadmin" | "admin" | "employee" | "";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  key: string;
  count?: number;   
  badge?: boolean;  
  isCritical?: boolean; 
}

export default function Sidebar() {
  const [role, setRole] = useState<UserRole>("");
  const [pendingLeaveCount, setPendingLeaveCount] = useState<number>(0);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [showAdminNotif, setShowAdminNotif] = useState<boolean>(false);
  const [showEmployeeNotif, setShowEmployeeNotif] = useState<boolean>(false);

  const pathname = usePathname();
  const router = useRouter();

  const fetchSidebarData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const storedRole = localStorage.getItem("role")?.trim().toLowerCase() as UserRole;
      
      if (!token || !storedRole) return;

      if (storedRole === "admin") {
        // SINKRONISASI: Menggunakan auth/me karena sudah mencakup data subscription
        const [leaveRes, authRes] = await Promise.all([
          fetch(`${API_BASE_URL}/leaves/stats/summary`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        ]).catch(() => {
            // Mencegah throw error jika server mati
            return [null, null];
        });

        if (leaveRes?.ok) {
          const leaveResult = await leaveRes.json();
          if (leaveResult.success) {
            setPendingLeaveCount(leaveResult.data.pending);
            setShowAdminNotif(leaveResult.data.pending > 0);
          }
        }

        if (authRes?.ok) {
          const authResult = await authRes.json();
          if (authResult.success && authResult.data.company?.subscription?.endDate) {
            const endDate = new Date(authResult.data.company.subscription.endDate);
            const now = new Date();
            const diffTime = endDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeft(diffDays);
          }
        }
      }
    } catch (err) {
      console.warn("Sidebar sync deferred: Server unreachable");
    }
  }, []);

  useEffect(() => {
    if (pathname.includes("/leaves")) setShowAdminNotif(false);
  }, [pathname]);

  useEffect(() => {
    const storedRole = localStorage.getItem("role")?.trim().toLowerCase() as UserRole;
    if (storedRole) {
      setRole(storedRole);
      fetchSidebarData();
      const interval = setInterval(fetchSidebarData, 120000); 
      return () => clearInterval(interval);
    } else {
      router.replace("/Auth/login");
    }
  }, [fetchSidebarData, router]);

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.clear();
      router.replace("/Auth/login");
    }
  };

  const getMenuItems = (): MenuItem[] => {
    switch (role) {
      case "superadmin":
        return [
          { key: "stats", icon: <FiGrid size={24} />, label: "Global Stats", href: "/dashboard/superadmin" },
          { key: "subs", icon: <FiActivity size={24} />, label: "Subscriptions", href: "/dashboard/superadmin/subscriptions" },
          { key: "logs", icon: <FiShield size={24} />, label: "System Logs", href: "/dashboard/superadmin/logs" },
        ];
      case "admin":
        return [
          { key: "dash", icon: <FiGrid size={24} />, label: "Dashboard", href: "/dashboard/admin" },
          { key: "users", icon: <FiUsers size={24} />, label: "Employees", href: "/dashboard/admin/users" },
          { key: "att", icon: <FiClock size={24} />, label: "Attendance Recap", href: "/dashboard/admin/attendances" },
          { key: "leave", icon: <FiBriefcase size={24} />, label: "Leave Requests", href: "/dashboard/admin/leaves", count: showAdminNotif ? pendingLeaveCount : 0 },
          { key: "pay", icon: <FiDollarSign size={24} />, label: "Payroll", href: "/dashboard/admin/payroll" },
          { 
            key: "billing", 
            icon: <FiCreditCard size={24} />, 
            label: "Billing & Plan", 
            href: "/dashboard/admin/subscription",
            badge: daysLeft !== null && daysLeft <= 7,
            isCritical: daysLeft !== null && daysLeft <= 3 
          },
        ];
      case "employee":
        return [
          { key: "dash", icon: <FiGrid size={24} />, label: "My Dashboard", href: "/dashboard/employee" },
          { key: "att", icon: <FiClock size={24} />, label: "Clock In/Out", href: "/dashboard/employee/attendance" },
          { key: "pay", icon: <FiDollarSign size={24} />, label: "My Payslip", href: "/dashboard/employee/payroll", badge: showEmployeeNotif },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  if (!role) return <aside className="w-[70px] h-[calc(100vh-80px)] bg-[#4A86C5] fixed left-0 top-20" />;

  return (
    <aside className="w-[70px] h-[calc(100vh-80px)] bg-[#4A86C5] flex flex-col justify-between items-center py-6 shadow-lg fixed left-0 top-20 z-40">
      <div className="flex flex-col items-center gap-6 w-full mt-6">
        {menuItems.map((item) => {
          const isHome = item.href === `/dashboard/${role}`;
          const isActive = isHome ? pathname === item.href : pathname.startsWith(item.href);

          return (
            <Link key={item.key} href={item.href} title={item.label} className="relative group" prefetch={false}>
              <div
                className={`transition-all duration-300 p-3 rounded-xl cursor-pointer ${
                  isActive
                    ? "bg-white/25 text-white scale-110 shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                } ${item.isCritical && !isActive ? "text-orange-300 animate-pulse" : ""}`}
              >
                {item.icon}
              </div>

              {item.count !== undefined && item.count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#4A86C5] shadow-sm">
                  {item.count > 9 ? "9+" : item.count}
                </span>
              )}

              {item.badge && (
                <span className="absolute top-0 right-0 flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${item.isCritical ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-[#4A86C5] ${item.isCritical ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}