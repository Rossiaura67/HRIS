"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  FiArrowLeft, FiUser, FiCalendar, FiPhone, 
  FiMail, FiCreditCard, FiClock, FiDollarSign, FiBriefcase 
} from "react-icons/fi";
import styles from "./profile-detail.module.css";
import Swal from "sweetalert2";
import { getImageUrl } from "@/utils/helpers"; // Gunakan helper yang konsisten

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [user, setUser] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/Auth/login");

      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // SINKRONISASI: Memastikan endpoint sesuai dengan router backend
      const [resUser, resAtn] = await Promise.all([
        fetch(`${API_BASE}/users/${id}`, { headers }),
        fetch(`${API_BASE}/attendance/user/${id}`, { headers })
      ]);

      const dataUser = await resUser.json();
      const dataAtn = await resAtn.json();

      if (dataUser.success) {
        setUser(dataUser.data);
      } else {
        Swal.fire("Gagal", dataUser.message || "Data tidak ditemukan", "error");
        router.push("/dashboard/admin/users");
      }

      if (dataAtn.success) setAttendance(dataAtn.data);

    } catch (err) {
      console.error("Fetch detail error:", err);
      Swal.fire("Error", "Gagal memuat profil", "error");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { if (id) fetchDetail(); }, [id, fetchDetail]);

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      maximumFractionDigits: 0 
    }).format(amount);
  };

  if (loading) return <div className={styles.loader}>Menyusun Profil...</div>;
  if (!user) return <div className={styles.errorState}>Karyawan tidak ditemukan.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <FiArrowLeft /> Kembali
        </button>
        <h1 className={styles.title}>Detail Karyawan</h1>
      </header>

      <div className={styles.mainGrid}>
        {/* KIRI: Sidebar Identitas */}
        <aside className={styles.sidebar}>
          <div className={styles.profileCard}>
            <div className={styles.avatarWrapper}>
              <img 
                src={getImageUrl('profiles', user.profile_image) || `https://ui-avatars.com/api/?name=${user.name}`} 
                alt={user.name} 
                className={styles.avatar}
              />
              <span className={`${styles.statusBadge} ${styles[user.status.toLowerCase()]}`}>
                {user.status}
              </span>
            </div>
            <h2 className={styles.profileName}>{user.name}</h2>
            <p className={styles.profilePosition}>{user.position?.positionName || "Staff"}</p>
            <div className={styles.employeeIdBadge}>NIK: {user.employeeId || "-"}</div>
            
            <div className={styles.quickStats}>
              <div className={styles.statBox}>
                <span className={styles.statVal}>{attendance.filter(a => a.status === 'OnTime').length}</span>
                <span className={styles.statLabel}>Hadir</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statVal}>{attendance.filter(a => a.status === 'Late').length}</span>
                <span className={styles.statLabel}>Telat</span>
              </div>
            </div>
          </div>

          <div className={styles.contactList}>
            <div className={styles.contactItem}><FiMail /> <span>{user.email}</span></div>
            <div className={styles.contactItem}><FiPhone /> <span>{user.phone || "-"}</span></div>
            <div className={styles.contactItem}>
              <FiCalendar /> 
              <span>Gabung: {user.join_date ? new Date(user.join_date).toLocaleDateString('id-ID') : "-"}</span>
            </div>
          </div>
        </aside>

        {/* KANAN: Data Detail */}
        <main className={styles.content}>
          <section className={styles.infoCard}>
            <h3 className={styles.cardTitle}><FiBriefcase /> Payroll & Jabatan</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoField}>
                <label>Gaji Pokok</label>
                <p>{formatIDR(user.position?.baseSalary || 0)}</p>
              </div>
              <div className={styles.infoField}>
                <label>Tunjangan</label>
                <p>{formatIDR(user.position?.allowance || 0)}</p>
              </div>
              <div className={styles.infoField}>
                <label>Rekening</label>
                <p>{user.bank_name || '-'} - {user.bank_account || '-'}</p>
              </div>
              <div className={styles.infoField}>
                <label>Jatah Cuti</label>
                <p className={styles.highlight}>{user.leave_balance ?? 0} Hari</p>
              </div>
            </div>
          </section>

          <section className={styles.infoCard}>
            <h3 className={styles.cardTitle}><FiClock /> Riwayat Presensi (10 Terakhir)</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tanggal</th>
                    <th>Masuk</th>
                    <th>Keluar</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length > 0 ? attendance.slice(0, 10).map((row, i) => (
                    <tr key={i}>
                      <td>{new Date(row.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className={styles.time}>{row.clockIn ? new Date(row.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "--:--"}</td>
                      <td className={styles.time}>{row.clockOut ? new Date(row.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "--:--"}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[row.status.toLowerCase()]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className={styles.noData}>Tidak ada riwayat.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}