"use client";

import React, { useEffect, useState } from "react";
import styles from "./admin.module.css";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        // SINKRONISASI: Pastikan result.data memiliki struktur yang dikirim backend
        if (result.success) setData(result.data);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;

  // Data untuk Bar Chart utama
  const currentNumData = [
    { 
      name: "Employees", 
      New: data?.newEmployees || 0, 
      Active: data?.activeEmployees || 0 
    }
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard Admin</h1>

      {/* Top Cards */}
      <div className={styles.topCards}>
        <div className={`${styles.card} ${styles.blue}`}>
          <span>Total Employee</span>
          <h2>{data?.totalEmployee || 0}</h2>
        </div>
        <div className={`${styles.card} ${styles.cyan}`}>
          <span>New Employees</span>
          <h2>{data?.newEmployees || 0}</h2>
        </div>
        <div className={`${styles.card} ${styles.mint}`}>
          <span>Active Employees</span>
          <h2>{data?.activeEmployees || 0}</h2>
        </div>
      </div>

      <div className={styles.middleSection}>
        {/* Chart 1: Status Kontrak */}
        <div className={styles.chartBox}>
          <h3>Employee Contract Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart layout="vertical" data={data?.employeeStatus} margin={{ left: 30, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="value" fill="#FF8A65" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Pertumbuhan Karyawan */}
        <div className={styles.chartBox}>
          <h3>Current Number of Employees</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={currentNumData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" hide />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="New" fill="#DDEBFF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Active" fill="#FFB800" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.bottomSection}>
        {/* Attendance Table */}
        <div className={styles.tableBox}>
          <h3>Real-time Attendance</h3>
          <div className={styles.legendRow}>
            {/* SINKRONISASI: Mapping legend dari stats backend */}
            {data?.attendanceTodayStats?.map((stat: any, i: number) => (
              <span key={i} style={{ color: stat.color }}>● {stat.value} {stat.name}</span>
            ))}
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Nama</th>
                  <th>Status</th>
                  <th>Jam Masuk</th>
                </tr>
              </thead>
              <tbody>
                {data?.attendanceTable?.length > 0 ? (
                  data.attendanceTable.map((item: any, index: number) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{item.nama}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[item.status?.toLowerCase()]}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.checkIn}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className={styles.empty}>Belum ada aktivitas hari ini</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Attendance Pie Chart */}
        <div className={styles.pieBox}>
          <h3>Attendance Ratio</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data?.attendanceTodayStats}
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
              >
                {data?.attendanceTodayStats?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.pieLegend}>
            {data?.attendanceTodayStats?.map((item: any, i: number) => (
              <div key={i} className={styles.pieLegendItem}>
                <span style={{ backgroundColor: item.color }}></span> {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}