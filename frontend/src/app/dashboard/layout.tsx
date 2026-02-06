"use client";

import Sidebar from "@/components/Sidebar/sidebar"; // Sesuaikan path import Anda
import Header from "@/components/Header/header";   // Sesuaikan path import Anda
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token"); // Menggunakan localStorage langsung atau helper Anda

    if (!token) {
      router.replace("/Auth/login");
    } else {
      setLoaded(true);
    }
  }, [router]);

  if (!loaded) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 1. SIDEBAR (Posisi Fixed di dalam komponen Sidebar) */}
      <Sidebar />

      {/* 2. AREA KANAN (Header + Main Content) */}
      <div className="flex flex-col flex-1 ml-[75px]"> 
        {/* ml-[75px] memastikan area ini tidak tertutup Sidebar */}
        
        {/* 3. HEADER (Posisi Fixed/Sticky) */}
        <Header />

        {/* 4. MAIN CONTENT AREA */}
        <main className="flex-1 p-6 mt-20 overflow-auto">
          {/* mt-20 (80px) memastikan konten tidak tertutup Header yang tingginya h-20 */}
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}