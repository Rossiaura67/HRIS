"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiArrowRight, FiTrendingUp, FiUsers, FiHome } from "react-icons/fi";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import styles from "./superadmin.module.css";

const API_URL = "http://localhost:5000/api/superadmin";

export default function SuperadminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false); // Fix Hydration Issue

  const fetchGlobalMetrics = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      }
    } catch (error) {
      console.error("Superadmin Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchGlobalMetrics();
  }, [fetchGlobalMetrics]);

  const formatIDR = (num: number) => 
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);

  if (!isClient || loading) return <div className={styles.loader}><span>Memuat Data Platform...</span></div>;

  return (
    <div className={styles.dashboardContainer}>
      
      {/* 1. METRICS GRID */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.statCard} ${styles.bgLightPurple}`}>
          <div className={styles.cardIcon}><FiTrendingUp /></div>
          <p>Total Revenue (Global)</p>
          <h3>{formatIDR(data?.totalRevenue || 0)}</h3>
        </div>
        <div className={`${styles.statCard} ${styles.bgSkyBlue}`}>
          <div className={styles.cardIcon}><FiHome /></div>
          <p>Total Tenants</p>
          <h3>{data?.totalTenants || 0} Perusahaan</h3>
        </div>
        <div className={`${styles.statCard} ${styles.bgMint}`}>
          <div className={styles.cardIcon}><FiUsers /></div>
          <p>Total Users Global</p>
          <h3>{data?.totalUsers || 0} Akun</h3>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* 2. CHART: PLAN DISTRIBUTION (Navy Dark Style) */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>Populasi Paket Langganan</h4>
          <div style={{ width: '100%', height: 300 }}>
            {/* SINKRONISASI: Recharts membutuhkan parent div dengan height yang pasti */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.planDistribution || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis hide /> {/* Sembunyikan YAxis sesuai desain screenshot sebelumnya */}
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" barSize={40}>
                  {(data?.planDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 1 ? "#64748b" : "#1e293b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. RECENT TENANTS TABLE */}
        <div className={styles.card}>
          <div className={styles.cardHeaderInline}>
            <h4 className={styles.cardTitle}>Aktivitas Tenant Terbaru</h4>
            <button className={styles.viewAllLink} onClick={() => router.push('/dashboard/superadmin/subscriptions')}>
              Semua Tenant <FiArrowRight />
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>NAMA PERUSAHAAN</th>
                  <th>PAKET</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTenants?.length > 0 ? data.recentTenants.map((tenant: any) => (
                  <tr key={tenant.id}>
                    <td className={styles.fontBold}>{tenant.name}</td>
                    <td>{tenant.plan}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[tenant.status?.toLowerCase() || 'active']}`}>
                        {tenant.status?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={3} style={{textAlign:'center', padding:'20px'}}>Belum ada aktivitas baru.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}