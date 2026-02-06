"use client";

import { useState, useEffect, useCallback } from "react";
import { FiFileText, FiDollarSign, FiCalendar } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import styles from "./payroll.module.css";

// SINKRON: Pastikan base URL sesuai rute payroll di backend
const API_BASE_URL = "http://localhost:5000/api/payroll";

export default function MyPayrollPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // SINKRONISASI: Menggunakan endpoint /me sesuai dengan router.get("/me", ...)
  const fetchMyPayroll = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_BASE_URL}/me`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
      });
      
      const result = await res.json();
      
      if (result.success) {
        setPayrolls(result.data);
      } else {
        toast.error(result.message || "Gagal memuat riwayat gaji");
      }
    } catch (error) {
      console.error("Payroll Fetch Error:", error);
      toast.error("Terjadi kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchMyPayroll(); 
  }, [fetchMyPayroll]);

  // SINKRONISASI: Konversi Decimal (string/object) ke Number untuk Intl.NumberFormat
  const formatIDR = (amount: any) => {
    const value = typeof amount === "string" ? parseFloat(amount) : Number(amount || 0);
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) return (
    <div className={styles.loadingContainer}>
       <div className={styles.spinner}></div>
       <p>Menarik Data Slip Gaji...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Riwayat Slip Gaji</h1>
          <p className={styles.subtitle}>Informasi transparansi penghasilan bulanan Anda.</p>
        </div>
      </header>

      <div className={styles.payrollGrid}>
        {payrolls.map((p: any) => (
          <div key={p.id} className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.periodBox}>
                <FiCalendar className={styles.icon} />
                <span className={styles.periodLabel}>
                  {/* Format bulan dari index (1-12) ke nama bulan lokal */}
                  {new Date(0, p.month - 1).toLocaleString('id-ID', { month: 'long' })} {p.year}
                </span>
              </div>
              {/* SINKRONISASI: Class status dinamis sesuai PayrollStatus Enum */}
              <span className={`${styles.statusBadge} ${styles[p.status.toLowerCase()]}`}>
                ● {p.status}
              </span>
            </div>

            <div className={styles.cardMain}>
              <p className={styles.label}>Gaji Bersih (Take Home Pay)</p>
              <h2 className={styles.amount}>{formatIDR(p.net_salary)}</h2>
            </div>

            <button 
              onClick={() => router.push(`/dashboard/employee/payroll/${p.id}`)}
              className={styles.btnDetail}
            >
              <FiFileText /> Lihat Rincian Slip
            </button>
          </div>
        ))}
      </div>

      {payrolls.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}><FiDollarSign /></div>
          <h3>Belum Ada Riwayat Gaji</h3>
          <p>Slip gaji akan muncul di sini setelah diproses oleh bagian HR.</p>
        </div>
      )}
    </div>
  );
}