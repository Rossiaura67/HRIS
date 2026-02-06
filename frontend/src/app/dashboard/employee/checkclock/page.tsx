"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FiUploadCloud, FiMapPin, FiCalendar } from "react-icons/fi";
import Swal from "sweetalert2";
import styles from "./checkclock.module.css";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const UseMapHelper = dynamic(() => import("react-leaflet").then(mod => {
  const { useMap } = mod;
  return function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    map.setView(center);
    return null;
  };
}), { ssr: false });

import L from "leaflet";
const icon = typeof window !== 'undefined' ? L.icon({ 
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png", 
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png", 
  iconSize: [25, 41], 
  iconAnchor: [12, 41] 
}) : null;

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function AddCheckClock() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [evidence, setEvidence] = useState<File | null>(null);
  const [position, setPosition] = useState<[number, number]>([-7.9666, 112.6326]);
  const [attendanceStatus, setAttendanceStatus] = useState({ hasIn: false, hasOut: false });

  const [formData, setFormData] = useState({
    tipeAksi: "Masuk", 
    todayDate: new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date()),
    address: "Mencari lokasi GPS...",
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/attendance/today`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const result = await res.json();
        
        if (result.success && result.data) {
          const { clockIn, clockOut } = result.data;
          setAttendanceStatus({ hasIn: !!clockIn, hasOut: !!clockOut });
          
          if (clockIn && !clockOut) {
            setFormData(prev => ({ ...prev, tipeAksi: "Pulang" }));
          }
        }
      } catch (err) {
        console.error("Status check failed:", err);
      }
    };

    fetchStatus();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setFormData(prev => ({ ...prev, address: data.display_name || "Alamat tidak ditemukan" }));
        } catch (err) {
          setFormData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
        }
      }, () => {
        Swal.fire("Akses Lokasi Ditolak", "Izin lokasi diperlukan untuk melakukan presensi.", "error");
      });
    }
  }, []);

  const handleSave = async () => {
    if (!evidence && formData.tipeAksi === "Masuk") {
      return Swal.fire("Perhatian", "Foto selfie wajib dilampirkan untuk absen masuk.", "warning");
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    const data = new FormData();

    data.append("tipeAbsensi", formData.tipeAksi); 
    data.append("latitude", position[0].toString());
    data.append("longitude", position[1].toString());
    data.append("addressDetail", formData.address);
    data.append("deviceName", `Web-Browser (${navigator.platform})`);

    if (evidence) {
      data.append("attendance_photo", evidence); 
    }

    try {
      const res = await fetch(`${API_URL}/attendance/check`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: data
      });

      const result = await res.json();

      if (res.ok && result.success) {
        Swal.fire("Berhasil", "Data presensi telah tersimpan.", "success").then(() => {
          router.push("/dashboard/employee/attendance");
        });
      } else {
        Swal.fire("Gagal", result.message || "Terjadi kesalahan pada sistem.", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Gagal menghubungkan ke server.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Presensi Kehadiran: {formData.tipeAksi}</h1>
      
      <div className={styles.card}>
        <div className={styles.formSection}>
          <div className={styles.infoBadge}>
            <FiCalendar /> {formData.todayDate}
          </div>

          <div className={styles.inputGroup}>
            <label className="text-[10px] font-black text-gray-400 uppercase">Status Hari Ini</label>
            <div className={styles.readOnlyInput}>
              {attendanceStatus.hasOut ? "Tugas Hari Ini Selesai" : 
               attendanceStatus.hasIn ? "Bekerja (Siap Absen Pulang)" : 
               "Siap Melakukan Presensi"}
            </div>
          </div>

          {!attendanceStatus.hasOut && (
            <div className={styles.uploadBox}>
              <label className="text-[10px] font-black text-gray-400 uppercase">Verifikasi Wajah (Selfie)</label>
              <div className={styles.dropzone}>
                <input 
                  type="file" 
                  hidden 
                  id="fileInput" 
                  accept="image/*" 
                  capture="user" 
                  onChange={(e) => setEvidence(e.target.files?.[0] || null)} 
                />
                <label htmlFor="fileInput" className={styles.dropzoneLabel}>
                  <FiUploadCloud size={24} className="text-[#4A86C5]" />
                  <p className="text-xs font-bold text-gray-600">
                    {evidence ? evidence.name : "Ambil Foto Selfie"}
                  </p>
                </label>
              </div>
            </div>
          )}
          
          <div className={styles.locationBox}>
            <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
              <FiMapPin /> Titik Lokasi GPS
            </label>
            <p className={styles.addressText}>{formData.address}</p>
          </div>
        </div>

        <div className={styles.mapSection}>
          <div className={styles.mapWrapper}>
            <MapContainer center={position} zoom={16} style={{ height: "100%", width: "100%", borderRadius: "1rem" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <UseMapHelper center={position} />
              {icon && <Marker position={position} icon={icon} />}
            </MapContainer>
          </div>
        </div>
      </div>

      <div className={styles.formFooter}>
        <button 
          className={styles.btnSave} 
          onClick={handleSave} 
          disabled={loading || attendanceStatus.hasOut}
        >
          {loading ? "Memproses..." : 
           attendanceStatus.hasOut ? "Presensi Lengkap" : 
           `Konfirmasi Absen ${formData.tipeAksi}`}
        </button>
      </div>
    </div>
  );
}