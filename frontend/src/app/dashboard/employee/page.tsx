"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiChevronDown, FiCalendar } from "react-icons/fi";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip 
} from "recharts";
import styles from "./employee.module.css";
import Swal from "sweetalert2";

// --- INTERFACE DATA SINKRON DENGAN BACKEND ---
interface DashboardSummary {
  userProfile: {
    name: string;
    role: string;
  };
  summaryMetrics: {
    workHours: string;
    onTime: number;
    late: number;
    absent: number;
  };
  leaveSummary: {
    totalQuota: number;
    taken: number;
    remaining: number;
  };
  attendanceStats: { name: string; value: number; color: string }[];
  dailyWorkLog: { name: string; hours: number; label: string }[];
}

export default function EmployeeDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      // Memanggil rute backend: GET /api/dashboard
      const res = await fetch(
        `http://localhost:5000/api/dashboard?month=${filter.month}&year=${filter.year}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const resData = await res.json();
      if (resData.success) {
        setData(resData.data);
      } else {
        throw new Error(resData.message);
      }
    } catch (error: any) {
      console.error("Dashboard Error:", error);
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return <div className={styles.loader}><span></span></div>;

  return (
    <div className={styles.dashboardContainer}>
      {/* 1. WELCOME & FILTER TOP */}
      <div className={styles.topRow}>
        <div className={styles.welcomeInfo}>
        </div>
        <div className={styles.filterBox}>
          <select 
            value={filter.month} 
            onChange={(e) => setFilter({...filter, month: parseInt(e.target.value)})}
            className={styles.selectMonth}
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <option key={m} value={m}>
                {new Date(0, m-1).toLocaleString('id-ID', {month: 'long'})}
              </option>
            ))}
          </select>
          <FiChevronDown className={styles.iconDown} />
        </div>
      </div>

      {/* 2. 4 METRICS GRID (Top Cards) */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.statCard} ${styles.bgLightPurple}`}>
          <p>Work Hours</p>
          <h3>{data?.summaryMetrics?.workHours || "0h 0m"}</h3>
        </div>
        <div className={`${styles.statCard} ${styles.bgSkyBlue}`}>
          <p>On Time</p>
          <h3>{data?.summaryMetrics?.onTime || 0}</h3>
        </div>
        <div className={`${styles.statCard} ${styles.bgMint}`}>
          <p>Late</p>
          <h3>{data?.summaryMetrics?.late || 0}</h3>
        </div>
        <div className={`${styles.statCard} ${styles.bgSoftBlue}`}>
          <p>Absent</p>
          <h3>{data?.summaryMetrics?.absent || 0}</h3>
        </div>
      </div>

      {/* 3. MIDDLE SECTION: LEAVE & ATTENDANCE */}
      <div className={styles.middleGrid}>
        {/* Leave Summary Card */}
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>Leave Summary</h4>
          <div className={styles.leaveFlex}>
            <div className={styles.quotaBox}>
              <p>Total Quota Annual Leave</p>
              <h2>{data?.leaveSummary?.totalQuota || 0}</h2>
              <button onClick={() => router.push('/dashboard/employee/request')} className={styles.requestBtn}>
                Request Leave
              </button>
            </div>
            <div className={styles.leaveDetails}>
              <div className={styles.detailItem}>
                <span>Taken</span>
                <strong>{data?.leaveSummary?.taken || 0}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Remaining</span>
                <strong>{data?.leaveSummary?.remaining || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Summary Donut Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeaderInline}>
            <h4 className={styles.cardTitle}>Attendance Summary</h4>
            <div className={styles.dropdownInline}>Mount <FiChevronDown /></div>
          </div>
          <div className={styles.donutArea}>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data?.attendanceStats || []}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data?.attendanceStats?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.legendArea}>
              {data?.attendanceStats?.map((item) => (
                <div key={item.name} className={styles.legendItem}>
                  <span className={styles.dot} style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. WORK HOURS BAR CHART */}
      <div className={styles.card}>
        <div className={styles.barHeader}>
            <span className={styles.yAxisLabel}>Hour</span>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.dailyWorkLog || []} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <Tooltip cursor={{fill: '#f8fafc'}} />
              <Bar dataKey="hours" barSize={110}>
                {data?.dailyWorkLog?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#aec2e0" : "#7d8dbb"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className={styles.chartFooter}>Aktivitas Kerja Harian</p>
      </div>
    </div>
  );
}