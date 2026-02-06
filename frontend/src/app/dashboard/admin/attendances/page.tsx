"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  FiArrowLeft, FiSearch, FiFilter, FiDownload, 
  FiClock, FiCheckCircle, FiAlertCircle, FiUserX, 
  FiEdit3, FiSettings 
} from "react-icons/fi";
import styles from "./attendance.module.css";
import Swal from "sweetalert2";
import { getImageUrl } from "@/utils/helpers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AttendanceMonitoringPage() {
  const router = useRouter();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAttendance = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/Auth/login");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/attendance/all?date=${filterDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAttendances(data.data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [filterDate, router]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const handleManualEdit = async (id: number, currentName: string) => {
    const { value: formValues } = await Swal.fire({
      title: `Koreksi Absensi: ${currentName}`,
      html: `
        <div style="text-align:left">
          <label style="font-size:12px; font-weight:bold">Status Baru</label>
          <select id="swal-status" class="swal2-input" style="width:100%; margin-top:5px">
            <option value="OnTime">Hadir (Tepat Waktu)</option>
            <option value="Permit">Izin</option>
            <option value="Sick">Sakit</option>
            <option value="AnnualLeave">Cuti Tahunan</option>
            <option value="Late">Terlambat</option>
          </select>
          <label style="font-size:12px; font-weight:bold; margin-top:15px; display:block">Alasan Koreksi</label>
          <textarea id="swal-reason" class="swal2-textarea" placeholder="Contoh: Kesalahan GPS / Lupa Absen" style="width:100%"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Update Status',
      confirmButtonColor: '#4A86C5',
      preConfirm: () => {
        return {
          status: (document.getElementById('swal-status') as HTMLSelectElement).value,
          reason: (document.getElementById('swal-reason') as HTMLTextAreaElement).value
        }
      }
    });

    if (formValues) {
      if (!formValues.reason) return Swal.fire("Gagal", "Alasan koreksi wajib diisi", "error");

      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/attendance/manual/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formValues)
        });
        
        const result = await res.json();
        if (result.success) {
          Swal.fire({ icon: 'success', title: 'Data Diperbarui', timer: 1500 });
          fetchAttendance();
        }
      } catch (err) {
        Swal.fire("Error", "Gagal menghubungi server", "error");
      }
    }
  };

  const metrics = useMemo(() => {
    return {
      onTime: attendances.filter(a => a.status === 'OnTime').length,
      late: attendances.filter(a => a.status === 'Late').length,
      others: attendances.filter(a => ['Sick', 'Permit', 'AnnualLeave'].includes(a.status)).length
    };
  }, [attendances]);

  const filteredData = attendances.filter(a => 
    a.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.user.employeeId && a.user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportPDF = async () => { /* Logika PDF */ };

  if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div></div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.push('/dashboard/admin')} className={styles.backBtn}>
            <FiArrowLeft /> Dashboard
          </button>
          <h1 className={styles.title}>Monitoring Real-time</h1>
        </div>
        
        <div className={styles.headerActions}>
          <button 
            onClick={() => router.push('/dashboard/admin/attendances/settings')} 
            className={styles.settingsBtn}
          >
            <FiSettings /> Atur jam dan lokasi
          </button>

          <button onClick={handleExportPDF} className={styles.reportBtn}>
            <FiDownload /> Export PDF
          </button>
        </div>
      </header>

      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.blue}`}>
          <div className={styles.metricIcon}><FiCheckCircle /></div>
          <div className={styles.metricInfo}><p>On Time</p><h3>{metrics.onTime}</h3></div>
        </div>
        <div className={`${styles.metricCard} ${styles.orange}`}>
          <div className={styles.metricIcon}><FiClock /></div>
          <div className={styles.metricInfo}><p>Terlambat</p><h3>{metrics.late}</h3></div>
        </div>
        <div className={`${styles.metricCard} ${styles.green}`}>
          <div className={styles.metricIcon}><FiAlertCircle /></div>
          <div className={styles.metricInfo}><p>Izin/Cuti/Sakit</p><h3>{metrics.others}</h3></div>
        </div>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.searchWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari Karyawan..." 
            className={styles.searchInput} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <input 
          type="date" 
          value={filterDate} 
          onChange={(e) => setFilterDate(e.target.value)} 
          className={styles.dateInput} 
        />
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Jam Masuk</th>
                <th>Jam Keluar</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className={styles.userCell}>
                      <img 
                        src={getImageUrl('profiles', row.user.profile_image) || `https://ui-avatars.com/api/?name=${row.user.name}`} 
                        className={styles.avatar} alt="" 
                      />
                      <div className={styles.nameGroup}>
                        <span className={styles.userName}>{row.user.name}</span>
                        <span className={styles.userPos}>{row.user.position?.positionName}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.timeText}>
                    {row.clockIn ? new Date(row.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </td>
                  <td className={styles.timeText}>
                    {row.clockOut ? new Date(row.clockOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[row.status.toLowerCase()] || ''}`}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {!row.is_payroll_processed ? (
                      <button className={styles.editBtn} onClick={() => handleManualEdit(row.id, row.user.name)}>
                        <FiEdit3 /> Koreksi
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 italic">Locked (Payroll)</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className={styles.noData}>Tidak ada data kehadiran ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}