"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  FiArrowLeft, FiCamera, FiMail, FiUser, FiShield, 
  FiBriefcase, FiPhone, FiEdit2, FiCheck, FiX, FiLock 
} from "react-icons/fi";
import styles from "./profile.module.css";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5000";

export default function AdminProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [image, setImage] = useState<string>("/avatar.png");
  const router = useRouter();

  // 1. Fetch Data dari Controller getProfile
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setUser(result.data);
        setEditData({
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone || "",
        });
        if (result.data.profile_image) {
          setImage(`${API_BASE}/public/profiles/${result.data.profile_image}`);
        }
      }
    } catch (err) {
      Swal.fire("Error", "Gagal memuat profil", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 2. Handle Update Profile
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/users/update-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        localStorage.setItem("name", editData.name);
        setIsEditing(false);
        Swal.fire("Berhasil", "Profil diperbarui", "success");
        window.dispatchEvent(new Event("storage")); // Trigger Navbar update
      }
    } catch (err) {
      Swal.fire("Error", "Gagal update profil", "error");
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Upload Foto
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_image", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/users/upload-profile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setImage(`${API_BASE}/public/profiles/${data.fileName}`);
        window.dispatchEvent(new Event("storage"));
        Swal.fire("Berhasil", "Foto diperbarui", "success");
      }
    } catch (err) {
      Swal.fire("Error", "Gagal upload foto", "error");
    }
  };

  if (loading && !user) return <div className={styles.loader}>Memuat...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <FiArrowLeft /> Kembali
        </button>
        <h1 className={styles.pageTitle}>Pengaturan Akun</h1>
      </div>

      <div className={styles.gridContainer}>
        {/* Kolom Kiri: Foto & Ringkasan */}
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                <img src={image} alt="Admin" className={styles.avatarImg} />
                <label className={styles.cameraIcon}>
                  <FiCamera />
                  <input type="file" hidden onChange={handleUpload} />
                </label>
              </div>
              <h2 className={styles.nameLabel}>{user?.name}</h2>
              <span className={styles.roleBadge}>{user?.role}</span>
            </div>
            
            <div className={styles.quickInfo}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>ID Pegawai</span>
                <span className={styles.infoVal}>{user?.nik || "-"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Status Akun</span>
                <span className={styles.statusActive}>{user?.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Detail */}
        <div className={styles.rightCol}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Informasi Pribadi</h3>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className={styles.editBtn}>
                  <FiEdit2 /> Edit
                </button>
              ) : (
                <div className={styles.btnGroup}>
                  <button onClick={() => setIsEditing(false)} className={styles.cancelBtn}><FiX /></button>
                  <button onClick={handleUpdate} className={styles.saveBtn}><FiCheck /></button>
                </div>
              )}
            </div>

            <div className={styles.formGrid}>
              <div className={styles.inputBox}>
                <label><FiUser /> Nama Lengkap</label>
                <input 
                  disabled={!isEditing} 
                  value={editData.name} 
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                />
              </div>
              <div className={styles.inputBox}>
                <label><FiMail /> Email</label>
                <input 
                  disabled={!isEditing} 
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                />
              </div>
              <div className={styles.inputBox}>
                <label><FiPhone /> WhatsApp / Telepon</label>
                <input 
                  disabled={!isEditing} 
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                />
              </div>
              <div className={styles.inputBox}>
                <label><FiBriefcase /> Jabatan</label>
                <input disabled value={user?.position?.positionName || "Admin"} className={styles.readOnly} />
              </div>
            </div>

            <hr className={styles.divider} />

            <div className={styles.securitySection}>
              <h3>Keamanan</h3>
              <button className={styles.passwordBtn}>
                <FiLock /> Ganti Password Akun
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}