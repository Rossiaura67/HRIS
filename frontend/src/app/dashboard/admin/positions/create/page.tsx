"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiSave, FiBriefcase, FiDollarSign, FiPlusCircle } from "react-icons/fi";
import styles from "./create.module.css";
import Swal from "sweetalert2";

export default function CreatePositionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    positionName: "",
    baseSalary: 0,
    allowance: 0,
  });

  // Fungsi untuk memformat angka menjadi format ribuan (1.000.000)
  const formatNumber = (num: number) => {
    return num.toLocaleString("id-ID");
  };

  // Fungsi untuk membersihkan titik agar kembali jadi angka murni
  const parseNumber = (str: string) => {
    return Number(str.replace(/\D/g, ""));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "positionName") {
      setFormData({ ...formData, [name]: value });
    } else {
      // Jika input gaji/tunjangan, bersihkan titik lalu simpan sebagai angka
      const numericValue = parseNumber(value);
      setFormData({ ...formData, [name]: numericValue });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/positions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire("Berhasil!", "Jabatan baru telah ditambahkan.", "success");
        router.push("/dashboard/admin/positions");
      } else {
        Swal.fire("Gagal", data.message, "error");
      }
    } catch (err) {
      Swal.fire("Error", "Gagal menyambungkan ke server", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      maximumFractionDigits: 0 
    }).format(num);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <FiArrowLeft /> Kembali
        </button>
        <h1 className={styles.title}>Buat Jabatan Baru</h1>
      </header>

      <div className={styles.formGrid}>
        <form onSubmit={handleSubmit} className={styles.formCard}>
          <h3 className={styles.sectionTitle}><FiBriefcase /> Konfigurasi Jabatan</h3>
          
          <div className={styles.field}>
            <label>Nama Jabatan</label>
            <div className={styles.inputWrapper}>
              <FiPlusCircle className={styles.inputIcon} />
              <input 
                type="text" 
                name="positionName" 
                placeholder="Contoh: Senior Developer"
                value={formData.positionName} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label>Gaji Pokok</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencyPrefix}>Rp</span>
                <input 
                  type="text" // Ubah ke text agar bisa pakai format titik
                  name="baseSalary" 
                  placeholder="0"
                  value={formData.baseSalary === 0 ? "" : formatNumber(formData.baseSalary)} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            <div className={styles.field}>
              <label>Tunjangan</label>
              <div className={styles.inputWrapper}>
                <span className={styles.currencyPrefix}>Rp</span>
                <input 
                  type="text" // Ubah ke text
                  name="allowance" 
                  placeholder="0"
                  value={formData.allowance === 0 ? "" : formatNumber(formData.allowance)} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.saveBtn}>
            {loading ? "Menyimpan..." : <><FiSave /> Simpan Jabatan</>}
          </button>
        </form>

        <aside className={styles.previewCard}>
          <h3 className={styles.previewTitle}>Ringkasan Gaji</h3>
          <div className={styles.previewItem}>
            <span>Jabatan</span>
            <strong>{formData.positionName || "-"}</strong>
          </div>
          <hr className={styles.divider} />
          <div className={styles.previewItem}>
            <span>Gaji Pokok</span>
            <span>{formatIDR(formData.baseSalary)}</span>
          </div>
          <div className={styles.previewItem}>
            <span>Tunjangan</span>
            <span>{formatIDR(formData.allowance)}</span>
          </div>
          <div className={`${styles.previewItem} ${styles.totalRow}`}>
            <span>Total / Bulan</span>
            <span className={styles.grandTotal}>{formatIDR(formData.baseSalary + formData.allowance)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}