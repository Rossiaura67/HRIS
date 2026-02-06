"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiClock, FiCalendar, FiArrowLeft, FiAlertCircle, FiFilter, FiInfo } from "react-icons/fi";
import styles from "./history.module.css";

const BASE_URL = "http://localhost:5000/api/leaves";

export default function LeaveHistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("all");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`${BASE_URL}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const result = await res.json();
                if (result.success) setHistory(result.data);
            } catch (err) {
                console.error("Gagal memuat riwayat:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filteredData = filterStatus === "all" 
        ? history 
        : history.filter((item: any) => item.status.toLowerCase() === filterStatus.toLowerCase());

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <button onClick={() => router.back()} className={styles.backBtn}>
                        <FiArrowLeft />
                    </button>
                    <div>
                        <h1 className={styles.title}>Riwayat Pengajuan Cuti</h1>
                        <p className={styles.subtitle}>Pantau status pengajuan izin dan cuti Anda.</p>
                    </div>
                </div>

                <div className={styles.filterBox}>
                    <FiFilter />
                    <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className={styles.selectFilter}
                    >
                        <option value="all">Semua Status</option>
                        <option value="pending">Menunggu</option>
                        <option value="approved">Disetujui</option>
                        <option value="rejected">Ditolak</option>
                    </select>
                </div>
            </header>

            {loading ? (
                <div className={styles.loadingWrapper}>
                    <div className={styles.spinner}></div>
                    <p>Sinkronisasi data...</p>
                </div>
            ) : filteredData.length === 0 ? (
                <div className={styles.emptyState}>
                    <FiAlertCircle size={64} color="#cbd5e1" />
                    <h3>Tidak ada riwayat</h3>
                    <p>Anda belum memiliki pengajuan dengan status ini.</p>
                    <button onClick={() => router.push("/dashboard/employee/leaves/request")} className={styles.btnRequest}>
                        Ajukan Sekarang
                    </button>
                </div>
            ) : (
                <div className={styles.tableSection}>
                    <table className={styles.historyTable}>
                        <thead>
                            <tr>
                                <th>Tipe & Alasan</th>
                                <th>Periode Cuti</th>
                                <th className={styles.textCenter}>Durasi</th>
                                <th className={styles.textCenter}>Status</th>
                                <th>Keterangan Admin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item: any) => (
                                <tr key={item.id} className={styles.tableRow}>
                                    <td className={styles.typeCell}>
                                        <span className={styles.leaveType}>{item.type}</span>
                                        <p className={styles.reasonText}>{item.reason}</p>
                                    </td>
                                    <td className={styles.dateCell}>
                                        <div className={styles.dateRange}>
                                            <FiCalendar />
                                            <span>{new Date(item.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <span className={styles.dateTo}>s/d {new Date(item.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </td>
                                    <td className={styles.textCenter}>
                                        <span className={styles.durationBadge}>{item.days_taken} Hari</span>
                                    </td>
                                    <td className={styles.textCenter}>
                                        <span className={`${styles.statusBadge} ${styles[item.status.toLowerCase()]}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className={styles.noteCell}>
                                        {item.status === 'Rejected' ? (
                                            <div className={styles.rejectNote}>
                                                <FiInfo /> {item.rejected_reason || "Tidak ada alasan spesifik."}
                                            </div>
                                        ) : (
                                            <span className={styles.textMuted}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}