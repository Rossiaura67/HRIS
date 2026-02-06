"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  FiArrowLeft, FiSave, FiUser, FiMail, FiLock, 
  FiBriefcase, FiPhone, FiCreditCard, FiHash, FiCalendar, FiCamera 
} from "react-icons/fi";
import styles from "./create.module.css";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5000/api/users";

const BANK_OPTIONS = [
  "BCA", "Mandiri"].sort();

export default function CreateUserPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState([]);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    role: "employee",
    positionId: "",
    contract_type: "Kontrak",
    annual_leave_quota: 12,
    gender: "Pria",
    phone: "",
    bank_name: "",
    bank_account: "",
    bank_holder_name: "",
    join_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/positions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resData = await res.json();
        if (resData.success) setPositions(resData.data);
      } catch (err) {
        console.error("Gagal memuat data jabatan");
      }
    };
    fetchPositions();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value.toString());
      });

      if (selectedFile) {
        data.append("profile_image", selectedFile);
      }

      const res = await fetch(`${API_BASE}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data 
      });

      const result = await res.json();
      if (result.success) {
        Swal.fire({ title: "Berhasil!", text: "Karyawan telah terdaftar.", icon: "success", timer: 1500 });
        router.push("/dashboard/admin/users");
      } else {
        Swal.fire("Gagal", result.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Gagal menghubungi server", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Sisa kode render Anda sudah sangat bagus dan benar secara fungsional */}
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}><FiArrowLeft /> Kembali</button>
        <h1 className={styles.title}>Registrasi Karyawan</h1>
      </header>

      <form onSubmit={handleSubmit} className={styles.formWrapper}>
        <div className={styles.mainGrid}>
          
          <aside className={styles.sidebar}>
            <div className={styles.cardPastel}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatarWrapper}>
                  <img 
                    src={previewImage || `https://ui-avatars.com/api/?name=${formData.name || 'New'}&background=random`} 
                    className={styles.profilePreview} alt="Preview" 
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
                <h2 className={styles.userNameDisplay}>{formData.name || "Nama Karyawan"}</h2>
                <p className={styles.userRoleDisplay}>ROLE: {formData.role.toUpperCase()}</p>
              </div>

              <div className={styles.sidebarFields}>
                <div className={styles.field}>
                  <label><FiMail /> Email</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="email@kantor.com" />
                </div>
                <div className={styles.field}>
                  <label><FiLock /> Password</label>
                  <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="******" />
                </div>
              </div>
            </div>
          </aside>

          <div className={styles.content}>
            <div className={styles.card}>
              <h3 className={styles.sectionTitle}><FiUser /> Data Personal & Jabatan</h3>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label><FiHash /> NIK / Employee ID</label>
                  <input type="text" name="employeeId" required value={formData.employeeId} onChange={handleChange} placeholder="EMP2026001" />
                </div>
                <div className={styles.field}>
                  <label>Nama Lengkap</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="Nama Lengkap" />
                </div>
                <div className={styles.field}>
                  <label>Jabatan</label>
                  <select name="positionId" required value={formData.positionId} onChange={handleChange}>
                    <option value="">Pilih Jabatan</option>
                    {positions.map((p: any) => <option key={p.id} value={p.id}>{p.positionName}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Tipe Kontrak</label>
                  <select name="contract_type" value={formData.contract_type} onChange={handleChange}>
                    <option value="Tetap">Karyawan Tetap</option>
                    <option value="Kontrak">Kontrak</option>
                    <option value="Magang">Magang</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label><FiCalendar /> Tanggal Bergabung</label>
                  <input type="date" name="join_date" value={formData.join_date} onChange={handleChange} />
                </div>
                <div className={styles.field}>
                  <label><FiPhone /> WhatsApp</label>
                  <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="0812..." />
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.sectionTitle}><FiCreditCard /> Rekening Payroll</h3>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label>Nama Bank</label>
                  <select name="bank_name" value={formData.bank_name} onChange={handleChange} required>
                    <option value="">Pilih Bank</option>
                    {BANK_OPTIONS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Nomor Rekening</label>
                  <input type="text" name="bank_account" value={formData.bank_account} onChange={handleChange} required />
                </div>
                <div className={styles.field}>
                  <label>Nama Pemilik Rekening</label>
                  <input type="text" name="bank_holder_name" value={formData.bank_holder_name} onChange={handleChange} required />
                </div>
                <div className={styles.field}>
                  <label>Jatah Cuti Tahunan</label>
                  <input type="number" name="annual_leave_quota" value={formData.annual_leave_quota} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="submit" disabled={loading} className={styles.saveBtn}>
                {loading ? "Mendaftarkan..." : <><FiSave /> Daftarkan Karyawan Baru</>}
              </button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}