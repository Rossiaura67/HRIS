"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiMapPin, FiClock, FiSave, FiNavigation, FiTarget } from "react-icons/fi";
import styles from "./settings.module.css";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5000/api/attendance";

export default function AttendanceSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // State sesuai Schema Prisma (Float untuk koordinat, Int untuk radius)
  const [officeData, setOfficeData] = useState({
    officeName: "",
    latitude: 0,
    longitude: 0,
    radius: 100
  });

  const [clockInTime, setClockInTime] = useState("08:00");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/office-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        if (result.data) {
          setOfficeData({
            officeName: result.data.officeName || "",
            latitude: Number(result.data.latitude) || 0,
            longitude: Number(result.data.longitude) || 0,
            radius: Number(result.data.radius) || 100
          });
        }
        setClockInTime(result.clockInTime || "08:00");
      }
    } catch (err) {
      Swal.fire("Error", "Gagal memuat pengaturan", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/settings/office`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(officeData)
      });
      const result = await res.json();
      if (result.success) Swal.fire("Berhasil", "Lokasi kantor diperbarui", "success");
    } catch (err) {
      Swal.fire("Error", "Gagal menyimpan lokasi", "error");
    }
  };

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
      if (result.success) Swal.fire("Berhasil", "Jam kerja diperbarui", "success");
    } catch (err) {
      Swal.fire("Error", "Gagal menyimpan jam kerja", "error");
    }
  };

  // Fungsi sakti: Ambil lokasi admin saat ini untuk jadi koordinat kantor
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return Swal.fire("Error", "Browser tidak mendukung GPS", "error");
    
    Swal.fire({ title: 'Mencari Lokasi...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    navigator.geolocation.getCurrentPosition((pos) => {
      setOfficeData({
        ...officeData,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
      Swal.close();
      Swal.fire("Lokasi Terdeteksi", "Koordinat berhasil diambil dari GPS Anda", "success");
    }, () => {
      Swal.fire("Gagal", "Pastikan izin lokasi aktif", "error");
    });
  };

  if (loading) return <div className={styles.loader}>Memuat Pengaturan...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <FiArrowLeft /> Kembali
        </button>
        <h1 className={styles.title}>Konfigurasi Absensi & Geofencing</h1>
      </header>

      <div className={styles.settingsGrid}>
        {/* CARD 1: LOKASI (GEOFENCING) */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiMapPin /></div>
            <div>
              <h3>Titik Lokasi Kantor</h3>
              <p>Hanya karyawan di dalam radius yang bisa absen.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateOffice} className={styles.form}>
            <div className={styles.field}>
              <label>Nama Kantor</label>
              <input 
                type="text" value={officeData.officeName}
                onChange={e => setOfficeData({...officeData, officeName: e.target.value})}
                placeholder="Contoh: Gedung Pusat A" required 
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
              <label>Radius Absensi (Meter)</label>
              <div className={styles.unitWrapper}>
                <input 
                  type="number" value={officeData.radius}
                  onChange={e => setOfficeData({...officeData, radius: parseInt(e.target.value)})}
                  required 
                />
                <span className={styles.unit}>Meters</span>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              <button type="button" onClick={getCurrentLocation} className={styles.gpsBtn}>
                <FiNavigation /> Deteksi Lokasi Saya
              </button>
              <button type="submit" className={styles.saveBtn}>
                <FiSave /> Simpan Lokasi
              </button>
            </div>
          </form>
        </section>

        {/* CARD 2: WAKTU KERJA */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}><FiClock /></div>
            <div>
              <h3>Ketentuan Waktu</h3>
              <p>Batas waktu masuk kantor.</p>
            </div>
          </div>

          <form onSubmit={handleUpdateTime} className={styles.form}>
            <div className={styles.field}>
              <label>Jam Masuk Standar</label>
              <input 
                type="time" value={clockInTime}
                onChange={e => setClockInTime(e.target.value)}
                className={styles.timeInput} required 
              />
            </div>
            
            <div className={styles.alertBox}>
              <FiTarget />
              <span>Sistem akan otomatis menghitung "Terlambat" jika absen lewat dari jam ini.</span>
            </div>

            <button type="submit" className={styles.saveBtnFull}>
              <FiSave /> Simpan Jam Kerja
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}