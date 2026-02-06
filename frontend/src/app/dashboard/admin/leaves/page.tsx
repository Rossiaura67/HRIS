"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  FiArrowLeft, FiCheck, FiX, FiSearch, 
  FiFilter, FiFileText, FiClock, FiUserCheck 
} from "react-icons/fi";
import styles from "./leaves.module.css";
import Swal from "sweetalert2";

// SINKRONISASI: Sesuaikan mount point backend Anda
const API_BASE = "http://localhost:5000/api/leaves";

export default function AdminLeavesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchLeaves = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/Auth/login");

    setLoading(true);
    try {
      // SINKRONISASI: GET / (Akses Employee & Admin)
      const res = await fetch(`${API_BASE}/`, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Gagal memuat data");

      if (data.success) setLeaves(data.data);
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem("token");
    try {
      // SINKRONISASI: GET /stats/summary (Khusus Admin Perusahaan)
      const res = await fetch(`${API_BASE}/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error("Gagal mengambil stats");
    }
  }, []);

  useEffect(() => { 
    fetchLeaves(); 
    fetchStats();
  }, [fetchLeaves, fetchStats]);

  const handleAction = async (id: number, status: "Approved" | "Rejected", employeeName: string) => {
    const actionText = status === "Approved" ? "Menyetujui" : "Menolak";
    
    const { isConfirmed, value: reason } = await Swal.fire({
      title: `${actionText} Pengajuan?`,
      text: `Konfirmasi status cuti untuk ${employeeName}`,
      icon: 'question',
      input: status === "Rejected" ? 'text' : undefined,
      inputPlaceholder: 'Berikan alasan penolakan...',
      showCancelButton: true,
      confirmButtonColor: status === "Approved" ? "#10b981" : "#ef4444",
      confirmButtonText: `Ya, ${status}`,
      inputValidator: (value: string): string | void => {
  if (status === "Rejected") {
    if (!value || value.trim() === "") {
      return 'Alasan penolakan wajib diisi!';
    }
  }
}
  });

    if (isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        // SINKRONISASI: PATCH /review/:id (Khusus Admin + checkSubscription)
        const res = await fetch(`${API_BASE}/review/${id}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            status, 
            rejected_reason: reason 
          })
        });

        const data = await res.json();
        
        // Penanganan jika Subscription Expired (Middleware checkSubscription)
        if (!res.ok) {
           throw new Error(data.message || "Gagal memproses review");
        }

        if (data.success) {
          Swal.fire("Berhasil", `Pengajuan telah ${status}`, "success");
          fetchLeaves();
          fetchStats();
        }
      } catch (err: any) {
        Swal.fire("Gagal", err.message, "error");
      }
    }
  };

  const filteredData = leaves.filter(item => {
    const matchSearch = item.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.push('/dashboard/admin')} className={styles.backBtn}>
            <FiArrowLeft /> Dashboard
          </button>
          <h1 className={styles.title}>Manajemen Cuti & Izin</h1>
        </div>
      </header>

      {/* Metrics Section: Menggunakan data asli dari API Stats */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.blue}`}>
          <div className={styles.metricIcon}><FiClock /></div>
          <div className={styles.metricInfo}>
            <p>Menunggu Persetujuan</p>
            <h3>{stats.pending}</h3>
          </div>
        </div>
        <div className={`${styles.metricCard} ${styles.green}`}>
          <div className={styles.metricIcon}><FiUserCheck /></div>
          <div className={styles.metricInfo}>
            <p>Total Disetujui</p>
            <h3>{stats.approved}</h3>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.searchWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari nama karyawan..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.selectWrapper}>
          <FiFilter size={14} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
            <option value="all">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Jenis</th>
                <th>Periode</th>
                <th>Alasan</th>
                <th>Bukti</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className={styles.loading}>Memuat data...</td></tr>
              ) : filteredData.length > 0 ? filteredData.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className={styles.userCell}>
                      <span className={styles.userName}>{row.user?.name}</span>
                      <span className={styles.userNik}>{row.user?.employeeId}</span>
                    </div>
                  </td>
                  <td className={styles.leaveType}>{row.type}</td>
                  <td className={styles.dateRange}>
                    {/* Sesuai Schema Prisma: startDate & endDate (camelCase) */}
                    {new Date(row.startDate).toLocaleDateString('id-ID')} - {new Date(row.endDate).toLocaleDateString('id-ID')}
                    <div className={styles.daysBadge}>{row.days_taken} Hari</div>
                  </td>
                  <td className={styles.reasonCell}>{row.reason || "-"}</td>
                  <td>
                    {row.evidence ? (
                      <a href={`http://localhost:5000/uploads/leaves/${row.evidence}`} target="_blank" className={styles.linkBukti}>
                        <FiFileText /> Lihat Bukti
                      </a>
                    ) : "-"}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[row.status.toLowerCase()]}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    {row.status === "Pending" ? (
                      <div className={styles.actionGroup}>
                        <button onClick={() => handleAction(row.id, "Approved", row.user.name)} className={styles.approveBtn}>
                          <FiCheck />
                        </button>
                        <button onClick={() => handleAction(row.id, "Rejected", row.user.name)} className={styles.rejectBtn}>
                          <FiX />
                        </button>
                      </div>
                    ) : (
                      <span className={styles.textMuted}>Selesai</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className={styles.noData}>Tidak ada pengajuan ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}