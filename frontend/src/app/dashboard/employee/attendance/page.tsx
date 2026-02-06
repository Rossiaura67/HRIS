"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Gunakan router untuk navigasi yang lebih aman
import styles from "./attendance.module.css";
import { FiClock, FiCalendar, FiSearch, FiRefreshCw } from "react-icons/fi";

const API_URL = "http://localhost:5000/api/attendance";

interface AttendanceRecord {
    id: number;
    rawDate: string; 
    dateDisplay: string;
    clockIn: string;
    clockOut: string;
    status: string;
    workHoursDisplay: string;
}

export default function AttendanceOverview() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch History sinkron dengan rute backend: router.get("/my-history", ...)
    const fetchAttendance = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            
            const res = await fetch(`${API_URL}/my-history`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const response = await res.json();
            
            if (response.success && Array.isArray(response.data)) {
                const formatted = response.data.map((item: any) => {
                    const d = new Date(item.date);
                    const hoursRaw = item.workHours || 0;
                    const h = Math.floor(hoursRaw);
                    const m = Math.round((hoursRaw - h) * 60);

                    return {
                        id: item.id,
                        // rawDate untuk komparasi hari ini (YYYY-MM-DD) zona Jakarta
                        rawDate: new Intl.DateTimeFormat('en-CA', { 
                            timeZone: 'Asia/Jakarta' 
                        }).format(new Date(item.date)),
                        dateDisplay: d.toLocaleDateString("id-ID", {
                            day: "2-digit", month: "long", year: "numeric",
                        }),
                        clockIn: item.clockIn ? new Date(item.clockIn).toLocaleTimeString('id-ID', { hour: "2-digit", minute: "2-digit", timeZone: 'Asia/Jakarta' }) : "-",
                        clockOut: item.clockOut ? new Date(item.clockOut).toLocaleTimeString('id-ID', { hour: "2-digit", minute: "2-digit", timeZone: 'Asia/Jakarta' }) : "-",
                        status: item.status, 
                        workHoursDisplay: hoursRaw > 0 ? `${h}j ${m}m` : "-",
                    };
                });
                setAttendanceData(formatted);
            }
        } catch (err) {
            console.error("Gagal sinkronisasi history:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { 
        fetchAttendance(); 
    }, [fetchAttendance]);

    // 2. Logic Status Hari Ini (Sinkron dengan helper getTodayDate di controller)
    const todayRecord = (() => {
        const todayStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(new Date());
        
        return attendanceData.find(r => r.rawDate === todayStr) || null;
    })();

    const filteredData = attendanceData.filter((item) =>
        item.dateDisplay.toLowerCase().includes(search.toLowerCase()) ||
        item.status.toLowerCase().includes(search.toLowerCase())
    );

    const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const getStatusClass = (status: string) => {
        const s = status?.toLowerCase() || "";
        if (s === 'ontime') return styles.onTime;
        if (s === 'late') return styles.late;
        if (s === 'absent') return styles.absent;
        if (s === 'sick') return styles.sick;
        if (s === 'annualleave') return styles.leave;
        if (s === 'holiday') return styles.holiday;
        return "";
    };

    if (loading) return <div className={styles.loading}>Memuat Log Presensi...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Presensi & Riwayat</h1>
                    <p className={styles.subtitle}>Pantau kehadiran harian dan log kerja Anda.</p>
                </div>
                <Link href="/dashboard/employee/checkclock" className={styles.btnAdd}>
                    <FiClock /> + Absen Sekarang
                </Link>
            </div>

            {/* Kotak Status Hari Ini */}
            <div className={todayRecord ? styles.todayCard : styles.todayCardEmpty}>
                <div className={styles.cardHeader}>
                    <FiCalendar /> 
                    <span>{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</span>
                </div>
                {todayRecord ? (
                    <div className={styles.cardInfo}>
                        <div className={styles.statusGroup}>
                            <label>Status Hari Ini</label>
                            <span className={`${styles.badge} ${getStatusClass(todayRecord.status)}`}>
                                {todayRecord.status}
                            </span>
                        </div>
                        <div className={styles.timeGroup}>
                            <p>Masuk: <strong>{todayRecord.clockIn}</strong></p>
                            <p>Pulang: <strong>{todayRecord.clockOut}</strong></p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.noPresensiWrapper}>
                        <p className={styles.noPresensi}>Anda belum mencatat kehadiran hari ini.</p>
                        <button onClick={() => router.push('/dashboard/employee/attendance/check')} className={styles.btnQuickCheck}>
                            Cek Lokasi Kantor →
                        </button>
                    </div>
                )}
            </div>

            {/* Tabel Riwayat */}
            <div className={styles.tableSection}>
                <div className={styles.tableTop}>
                    <div className={styles.searchBar}>
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Cari tanggal atau status..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <button onClick={fetchAttendance} className={styles.btnRefresh} title="Segarkan Data">
                        <FiRefreshCw />
                    </button>
                </div>

                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Masuk</th>
                                <th>Pulang</th>
                                <th>Total Jam</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.length > 0 ? paginatedData.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.dateDisplay}</td>
                                    <td>{item.clockIn}</td>
                                    <td>{item.clockOut}</td>
                                    <td>{item.workHoursDisplay}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className={styles.emptyTable}>Data tidak ditemukan</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <div className={styles.pagination}>
                    <span>Halaman {page} dari {totalPages || 1}</span>
                    <div className={styles.pageButtons}>
                        <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                        <button disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}