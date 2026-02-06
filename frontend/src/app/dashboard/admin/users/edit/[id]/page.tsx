"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiArrowLeft, FiSave, FiUser, FiCamera, FiCreditCard, FiCalendar, FiPhone, FiMail } from "react-icons/fi";
import styles from "./edit.module.css";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5000/api/users"; 
const IMAGE_BASE_URL = "http://localhost:5000/uploads/profiles/";

const BANK_OPTIONS = ["BCA", "Mandiri"].sort();

// Tambahan opsi kontrak sesuai Schema Prisma
const CONTRACT_OPTIONS = ["Tetap", "Kontrak", "Magang"];

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    name: "", 
    email: "", 
    role: "employee", 
    status: "Active",
    contract_type: "Kontrak", // Tambahan state tipe kontrak
    positionId: "", 
    phone: "", 
    bank_name: "",
    bank_account: "", 
    bank_holder_name: "", 
    annual_leave_quota: 12
  });

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return router.push("/Auth/login");

      const [resUser, resPos] = await Promise.all([
        fetch(`${API_BASE}/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/positions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const dataUser = await resUser.json();
      const dataPos = await resPos.json();

      if (dataUser.success) {
        const u = dataUser.data;
        if (u.role === "superadmin") {
            Swal.fire("Akses Ditolak", "Anda tidak bisa mengedit Superadmin", "error");
            return router.push("/dashboard/admin/users");
        }

        setFormData({
          name: u.name || "", 
          email: u.email || "", 
          role: u.role || "employee",
          status: u.status || "Active", 
          contract_type: u.contract_type || "Kontrak", // Load data kontrak dari DB
          positionId: u.positionId ? String(u.positionId) : "",
          phone: u.phone || "", 
          bank_name: u.bank_name || "",
          bank_account: u.bank_account || "", 
          bank_holder_name: u.bank_holder_name || "",
          annual_leave_quota: u.annual_leave_quota || 12
        });
        if (u.profile_image) setPreviewImage(`${IMAGE_BASE_URL}${u.profile_image}`);
      }
      if (dataPos.success) setPositions(dataPos.data);
    } catch (err) {
      Swal.fire("Error", "Gagal menyambung ke server", "error");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { if (id) fetchData(); }, [fetchData, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => data.append(key, String(value)));
      if (selectedFile) data.append("profile_image", selectedFile);

      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: data 
      });

      const result = await res.json();
      if (result.success) {
        Swal.fire("Berhasil", "Data karyawan diperbarui!", "success");
        router.push("/dashboard/admin/users");
      } else {
        Swal.fire("Gagal", result.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Terjadi kesalahan sistem", "error");
    }
  };

  if (loading) return <div className={styles.loader}>Memuat Data...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}><FiArrowLeft /> Kembali</button>
        <h1 className={styles.title}>Edit Profile & Struktur</h1>
      </header>

      <form onSubmit={handleSubmit} className={styles.formWrapper}>
        <div className={styles.mainGrid}>
          
          <aside className={styles.sidebar}>
            <div className={styles.cardPastel}>
              <div className={styles.avatarWrapper}>
                <img 
                  src={previewImage || `https://ui-avatars.com/api/?name=${formData.name}&background=random`} 
                  className={styles.profilePreview} alt="Profile" 
                />
                <button type="button" className={styles.uploadOverlay} onClick={() => fileInputRef.current?.click()}>
                  <FiCamera />
                </button>
              </div>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if(file) {
                  setSelectedFile(file);
                  setPreviewImage(URL.createObjectURL(file));
                }
              }} />
              <h2 className={styles.userNameDisplay}>{formData.name}</h2>
              <span className={styles.roleBadge}>{formData.role}</span>

              <div className={styles.sidebarFields}>
                <div className={styles.field}>
                  <label><FiMail /> Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label><FiPhone /> WhatsApp</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
            </div>
          </aside>

          <div className={styles.content}>
            {/* BAGIAN DATA ORGANISASI */}
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}><FiUser /> Data Organisasi</h3>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Jabatan</label>
                  <select value={formData.positionId} onChange={e => setFormData({...formData, positionId: e.target.value})}>
                    <option value="">Pilih Jabatan</option>
                    {positions.map((p: any) => <option key={p.id} value={p.id}>{p.positionName}</option>)}
                  </select>
                </div>
                
                {/* FIELD TIPE KONTRAK BARU */}
                <div className={styles.field}>
                  <label>Tipe Kontrak</label>
                  <select value={formData.contract_type} onChange={e => setFormData({...formData, contract_type: e.target.value})}>
                    {CONTRACT_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label>Status Karyawan</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Active">Aktif</option>
                    <option value="Inactive">Non-Aktif</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label><FiCalendar /> Jatah Cuti</label>
                  <input type="number" value={formData.annual_leave_quota} onChange={e => setFormData({...formData, annual_leave_quota: Number(e.target.value)})} />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}><FiCreditCard /> Rekening Payroll</h3>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Bank</label>
                  <select value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})}>
                    <option value="">Pilih Bank</option>
                    {BANK_OPTIONS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>No. Rekening</label>
                  <input type="text" value={formData.bank_account} onChange={e => setFormData({...formData, bank_account: e.target.value})} />
                </div>
                <div className={styles.field}>
                  <label>Nama Pemilik</label>
                  <input type="text" value={formData.bank_holder_name} onChange={e => setFormData({...formData, bank_holder_name: e.target.value})} />
                </div>
              </div>
            </div>

            <button type="submit" className={styles.saveBtn}><FiSave /> Simpan Perubahan</button>
          </div>
        </div>
      </form>
    </div>
  );
}