"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiMapPin, FiClock, FiSave, FiNavigation, FiTarget } from "react-icons/fi";
import styles from "./settings.module.css";
import Swal from "sweetalert2";

// SINKRONISASI: Ubah base ke /api/company sesuai rute backend yang Anda berikan
const API_BASE = "http://localhost:5000/api/company";

export default function AttendanceSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  const [officeData, setOfficeData] = useState({
    officeName: "",
    latitude: 0,
    longitude: 0,
    radius: 100
  });

  const [clockInTime, setClockInTime] = useState("08:00");

  // SINKRONISASI: Menggunakan router.get("/settings", ...)
  const fetchSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (result.success) {
        // Asumsi data lokasi ada di result.data.officeSetting
        if (result.data?.officeSetting) {
          const s = result.data.officeSetting;
          setOfficeData({
            officeName: s.officeName || "Kantor Pusat",
            latitude: Number(s.latitude) || 0,
            longitude: Number(s.longitude) || 0,
            radius: Number(s.radius) || 100
          });
        }
        // Asumsi jam masuk ada di result.data.workTime
        setClockInTime(result.data?.workTime || "08:00");
      }
    } catch (err) {
      Swal.fire("Error", "Gagal memuat pengaturan", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // SINKRONISASI: Menggunakan router.put("/settings/location", ...)
  const handleUpdateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/settings/location`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(officeData)
      });
      const result = await res.json();
      if (result.success) {
        Swal.fire("Berhasil", "Lokasi geofencing diperbarui", "success");
      } else {
        Swal.fire("Gagal", result.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Gagal menyimpan lokasi", "error");
    }
  };

  // SINKRONISASI: Menggunakan router.put("/settings/time", ...)
  const handleUpdateTime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/settings/time`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ clockInTime })
      });
      const result = await res.json();
      if (result.success) {
        Swal.fire("Berhasil", "Jam masuk standar diperbarui", "success");
      } else {
        Swal.fire("Gagal", result.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Gagal menyimpan jam kerja", "error");
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return Swal.fire("Error", "GPS tidak didukung", "error");
    
    Swal.fire({ title: 'Mendeteksi GPS...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    navigator.geolocation.getCurrentPosition((pos) => {
      setOfficeData({
        ...officeData,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
      Swal.close();
      Swal.fire("Berhasil", "Koordinat terkunci ke posisi Anda saat ini", "success");
    }, () => {
      Swal.fire("Gagal", "Akses lokasi ditolak", "error");
    });
  };

  if (loading) return <div className={styles.loader}>Menghubungkan ke Server...</div>;

  return (
    <div className={styles.container}>
      {/* Struktur JSX tetap sama seperti desain Anda */}
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <FiArrowLeft /> Kembali
        </button>
        <h1 className={styles.title}>Konfigurasi Geofencing & Jam Kerja</h1>
      </header>

      

      <div className={styles.settingsGrid}>
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiMapPin /></div>
            <div>
              <h3>Lokasi Absensi (Geofencing)</h3>
              <p>Tentukan koordinat GPS dan radius aman kantor.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateOffice} className={styles.form}>
            <div className={styles.field}>
              <label>Nama Lokasi / Kantor</label>
              <input 
                type="text" value={officeData.officeName}
                onChange={e => setOfficeData({...officeData, officeName: e.target.value})}
                placeholder="Misal: Kantor Utama" required 
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Latitude</label>
                <input 
                  type="number" step="any" value={officeData.latitude}
                  onChange={e => setOfficeData({...officeData, latitude: parseFloat(e.target.value)})}
                  required 
                />
              </div>
              <div className={styles.field}>
                <label>Longitude</label>
                <input 
                  type="number" step="any" value={officeData.longitude}
                  onChange={e => setOfficeData({...officeData, longitude: parseFloat(e.target.value)})}
                  required 
                />
              </div>
            </div>

            <div className={styles.field}>
              <label>Radius Keamanan (Meter)</label>
              <div className={styles.unitWrapper}>
                <input 
                  type="number" value={officeData.radius}
                  onChange={e => setOfficeData({...officeData, radius: parseInt(e.target.value)})}
                  required 
                />
                <span className={styles.unit}>M</span>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button type="button" onClick={getCurrentLocation} className={styles.gpsBtn}>
                <FiNavigation /> Ambil Titik Saya
              </button>
              <button type="submit" className={styles.saveBtn}>
                <FiSave /> Simpan Lokasi
              </button>
            </div>
          </form>
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiClock /></div>
            <div>
              <h3>Pengaturan Waktu</h3>
              <p>Atur ambang batas keterlambatan karyawan.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateTime} className={styles.form}>
            <div className={styles.field}>
              <label>Batas Jam Masuk</label>
              <input 
                type="time" value={clockInTime}
                onChange={e => setClockInTime(e.target.value)}
                className={styles.timeInput} required 
              />
            </div>
            
            <div className={styles.alertBox}>
              <FiTarget />
              <span>Sistem akan menandai "Terlambat" jika absen melewati jam ini.</span>
            </div>

            <button type="submit" className={styles.saveBtnFull}>
              <FiSave /> Perbarui Jam Kerja
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}