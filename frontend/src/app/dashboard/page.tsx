// File: DashboardRedirectPage.tsx (Tidak ada perubahan signifikan, sudah benar)

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getRole, getToken } from "@/utils/auth";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const role = getRole()?.toLowerCase();

    if (!token) return router.replace("/login");

    switch (role) {
      case "admin":
        // Redirect Admin ke halaman admin
        router.replace("/dashboard/admin");
        break;
      case "superadmin":
        // Redirect Superadmin ke halaman superadmin
        router.replace("/dashboard/superadmin");
        break;
      default:
        // Redirect Employee (atau role lain yang tidak dikenal)
        router.replace("/dashboard/employee");
        break;
    }
  }, [router]);

  return <div className="text-center p-10">Redirecting...</div>;
}