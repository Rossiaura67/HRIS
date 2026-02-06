"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import { FiUser, FiCamera, FiCreditCard, FiLock, FiCheckCircle } from "react-icons/fi";
import styles from "./profile.module.css";

const API_AUTH = "http://localhost:5000/api/auth";
const API_USER = "http://localhost:5000/api/users";
const IMAGE_URL = "http://localhost:5000/public/profiles/";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Ambil Data Profil
  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_AUTH}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) setUser(result.data);
    } catch (err) {
      Swal.fire("Error", "Gagal memuat profil", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  /**
   * FIX: Agar Header Terupdate Otomatis
   * Browser tidak memicu event 'storage' pada tab yang sama.
   * Kita buat event manual bernama 'profileSync'.
   */
  const triggerHeaderUpdate = () => {
    window.dispatchEvent(new Event("profileSync"));
  };

  // 2. Ganti Foto (FIXED Sync Logic)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_image", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_USER}/me/photo`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      const result = await res.json();
      
      if (result.success) {
        // PERBAIKAN: Update localStorage agar Header bisa ambil nama file terbaru
        // Pastikan key 'profile_image' sama dengan yang dibaca Header.tsx
        localStorage.setItem("profile_image", result.filename);
        
        // PERBAIKAN: Kirim sinyal khusus ke Header di tab yang sama
        triggerHeaderUpdate();
        
        Swal.fire("Sukses", "Foto profil diperbarui", "success");
        fetchProfile();
      }
    } catch (err) {
      Swal.fire("Gagal", "Gagal upload foto", "error");
    }
  };

  // 3. Update Nama & Data Bank (FIXED Sync Logic)
  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_USER}/me`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (result.success) {
        // PERBAIKAN: Update nama di localStorage agar Header langsung berubah
        localStorage.setItem("name", result.data.name);
        
        // PERBAIKAN: Kirim sinyal sinkronisasi
        triggerHeaderUpdate();
        
        Swal.fire("Berhasil", "Informasi profil diperbarui", "success");
        fetchProfile();
      }
    } catch (err) {
      Swal.fire("Gagal", "Terjadi kesalahan sistem", "error");
    }
  };

  // 4. Ganti Password
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { oldPassword, newPassword, confirmPassword } = Object.fromEntries(formData.entries());

    if (newPassword !== confirmPassword) {
      return Swal.fire("Error", "Konfirmasi password tidak cocok", "error");
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_USER}/me/password`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const result = await res.json();
      if (result.success) {
        Swal.fire("Berhasil", "Password telah diperbarui", "success");
        (e.target as HTMLFormElement).reset();
      } else {
        Swal.fire("Gagal", result.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Gagal sistem", "error");
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-gray-400">Menyinkronkan Data...</div>;

  return (
    <div className={styles.container}>
      {/* HEADER PROFIL */}
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrapper}>
          <img 
            src={user?.profile_image ? `${IMAGE_URL}${user.profile_image}` : `https://ui-avatars.com/api/?name=${user?.name}&background=4A86C5&color=fff`} 
            className={styles.avatar} 
            alt="User"
          />
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
          <button className={styles.changePhotoBtn} onClick={() => fileInputRef.current?.click()} title="Ganti Foto">
            <FiCamera />
          </button>
        </div>
        <div className={styles.userTitle}>
          <h2>{user?.name}</h2>
          <div className={styles.badgeRow}>
            <span className={styles.roleBadge}>{user?.role?.toUpperCase()}</span>
            <span className={styles.positionText}>{user?.position?.positionName || "General Staff"}</span>
          </div>
          <p className={styles.employeeId}>ID Karyawan: {user?.employeeId}</p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className={styles.tabBar}>
        <button onClick={() => setActiveTab("personal")} className={activeTab === "personal" ? styles.activeTab : ""}>
          <FiUser /> Info Pribadi
        </button>
        <button onClick={() => setActiveTab("security")} className={activeTab === "security" ? styles.activeTab : ""}>
          <FiLock /> Keamanan Akun
        </button>
      </div>

      {activeTab === "personal" ? (
        <form onSubmit={handleUpdateProfile} className={styles.mainGrid}>
          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
                <FiUser className={styles.icon} />
                <h3>IDENTITAS DIRI</h3>
            </div>
            <div className={styles.formGroup}>
              <label>NAMA LENGKAP</label>
              <input name="name" defaultValue={user?.name} required />
            </div>
            <div className={styles.formGroup}>
              <label>NOMOR WHATSAPP</label>
              <input name="phone" defaultValue={user?.phone} placeholder="Contoh: 08123456789" />
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.cardHeader}>
                <FiCreditCard className={styles.icon} />
                <h3>REKENING BANK</h3>
            </div>
            <div className={styles.formGroup}>
              <label>NAMA BANK</label>
              <input name="bank_name" defaultValue={user?.bank_name} placeholder="BCA / Mandiri / BNI" />
            </div>
            <div className={styles.formGroup}>
              <label>NOMOR REKENING</label>
              <input name="bank_account" defaultValue={user?.bank_account} placeholder="Masukkan nomor rekening" />
            </div>
          </div>

          <div className={styles.actionRow}>
            <button type="submit" className={styles.saveBtn}>
              <FiCheckCircle /> Simpan Perubahan Data
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.securityContainer}>
          <form onSubmit={handleChangePassword} className={styles.sectionCard}>
            <div className={styles.cardHeader}>
                <FiLock className={styles.icon} />
                <h3>PENGATURAN PASSWORD</h3>
            </div>
            <div className={styles.formGroup}>
              <label>PASSWORD LAMA</label>
              <input type="password" name="oldPassword" required />
            </div>
            <div className={styles.formGroup}>
              <label>PASSWORD BARU</label>
              <input type="password" name="newPassword" required />
            </div>
            <div className={styles.formGroup}>
              <label>KONFIRMASI PASSWORD BARU</label>
              <input type="password" name="confirmPassword" required />
            </div>
            <button type="submit" className={styles.saveBtn}>Perbarui Password</button>
          </form>
        </div>
      )}
    </div>
  );
}