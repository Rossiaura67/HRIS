"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiSend, FiCalendar, FiCamera, FiInfo, FiClock } from "react-icons/fi";
import styles from "./leave.module.css";
import Swal from "sweetalert2";

// SINKRONISASI: Endpoint base URL
const BASE_URL = "http://localhost:5000/api/leaves";

export default function LeaveRequestPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ 
        type: "Annual", // Sesuai Enum di Prisma
        startDate: "", 
        endDate: "", 
        reason: "" 
    });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Validasi Tanggal
        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            return Swal.fire("Error", "Tanggal mulai tidak boleh melebihi tanggal selesai.", "error");
        }

        // 2. Validasi File untuk Sakit (Sesuai kebijakan Backend)
        if (formData.type === "Sick" && !file) {
            return Swal.fire("Info", "Wajib melampirkan bukti surat sakit (PDF/JPG).", "info");
        }

        setLoading(true);

        // 3. Gunakan FormData karena mengirimkan File (Multer di Backend)
        const data = new FormData();
        data.append("type", formData.type);
        data.append("startDate", formData.startDate);
        data.append("endDate", formData.endDate);
        data.append("reason", formData.reason);
        
        // SINKRONISASI: Field name harus 'evidence' sesuai upload.single("evidence")
        if (file) data.append("evidence", file);

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${BASE_URL}/request`, {
                method: "POST",
                headers: { 
                    // JANGAN set Content-Type secara manual saat menggunakan FormData
                    Authorization: `Bearer ${token}` 
                },
                body: data 
            });

            const result = await res.json();

            if (res.ok) {
                await Swal.fire("Berhasil", "Pengajuan cuti berhasil dikirim!", "success");
                router.push("/dashboard/employee/request/histori");
            } else {
                Swal.fire("Gagal", result.message || "Gagal mengajukan cuti", "error");
            }
        } catch (err) {
            Swal.fire("Error", "Terjadi kesalahan koneksi ke server.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formCard}>
                <div className={styles.headerArea}>
                    <h2 className={styles.title}><FiSend /> Request Leave</h2>
                    <button 
                        onClick={() => router.push("/dashboard/employee/request/histori")}
                        className={styles.btnHistoryLink}
                    >
                        <FiClock /> View History
                    </button>
                </div>
                
                <div className={styles.infoBox}>
                    <FiInfo />
                    <p>Cuti tahunan akan memotong kuota tahunan Anda secara otomatis.</p>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label>Jenis Cuti</label>
                        <select 
                            value={formData.type} 
                            onChange={e => setFormData({...formData, type: e.target.value})}
                            required
                        >
                            <option value="Annual">Cuti Tahunan (Annual)</option>
                            <option value="Sick">Sakit (Sick)</option>
                           
                        </select>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.inputGroup}>
                            <label>Tanggal Mulai</label>
                            <input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Tanggal Selesai</label>
                            <input type="date" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label>Alasan / Keterangan</label>
                        <textarea placeholder="Tuliskan alasan pengajuan Anda..." required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
                    </div>

                    <div className={styles.inputGroup}>
                        <label><FiCamera /> Lampiran Bukti (Optional)</label>
                        <input type="file" accept="image/*,application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
                        <small className={styles.hint}>Format: JPG, PNG, PDF (Max 2MB)</small>
                    </div>

                    <button type="submit" className={styles.btnSubmit} disabled={loading}>
                        {loading ? "Memproses..." : "Kirim Pengajuan Cuti"}
                    </button>
                </form>
            </div>
        </div>
    );
}