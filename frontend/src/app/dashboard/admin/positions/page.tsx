"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiBriefcase, FiDollarSign, FiUsers } from "react-icons/fi";
import styles from "./positions.module.css";
import Swal from "sweetalert2";

interface Position {
  id: number;
  positionName: string;
  baseSalary: number;
  allowance: number;
  _count?: { users: number };
}

const API_BASE = "http://localhost:5000/api/positions";

export default function PositionManagementPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(API_BASE, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPositions(data.data);
    } catch (err) {
      Swal.fire("Error", "Gagal mengambil data jabatan", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus Jabatan?',
      text: `Menghapus jabatan ${name} dapat mempengaruhi data gaji karyawan terkait.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Terhapus!', 'Jabatan berhasil dihapus', 'success');
          fetchPositions();
        }
      } catch (err) {
        Swal.fire('Error', 'Gagal menghapus data', 'error');
      }
    }
  };

  const formatIDR = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) return <div className={styles.loader}>Menyiapkan Struktur Organisasi...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.push('/dashboard/admin')} className={styles.backBtn}>
            <FiArrowLeft /> Dashboard
          </button>
          <h1 className={styles.title}>Manajemen Jabatan & Gaji</h1>
        </div>
        <button onClick={() => router.push('/dashboard/admin/positions/create')} className={styles.addBtn}>
          <FiPlus /> Tambah Jabatan Baru
        </button>
      </header>

      {/* Metric Cards Khusus Jabatan */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.blue}`}>
          <div className={styles.statIcon}><FiBriefcase /></div>
          <div>
            <p className={styles.statLabel}>Total Divisi/Jabatan</p>
            <h3 className={styles.statValue}>{positions.length}</h3>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statIcon}><FiUsers /></div>
          <div>
            <p className={styles.statLabel}>Karyawan Terdaftar</p>
            <h3 className={styles.statValue}>
              {positions.reduce((acc, curr) => acc + (curr._count?.users || 0), 0)} Orang
            </h3>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama Jabatan</th>
              <th>Gaji Pokok</th>
              <th>Tunjangan</th>
              <th>Total Take Home Pay</th>
              <th>Total Karyawan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => (
              <tr key={pos.id}>
                <td>
                  <div className={styles.posNameWrapper}>
                    <div className={styles.posInitial}>{pos.positionName.charAt(0)}</div>
                    <span className={styles.posNameText}>{pos.positionName}</span>
                  </div>
                </td>
                <td>{formatIDR(pos.baseSalary)}</td>
                <td>{formatIDR(pos.allowance)}</td>
                <td className={styles.totalSalary}>{formatIDR(pos.baseSalary + pos.allowance)}</td>
                <td>
                  <span className={styles.userCountBadge}>
                    <FiUsers size={12} /> {pos._count?.users || 0}
                  </span>
                </td>
                <td>
                  <div className={styles.actionGroup}>
                    <button className={styles.editBtn} onClick={() => router.push(`/dashboard/admin/positions/edit/${pos.id}`)}>
                      <FiEdit />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDelete(pos.id, pos.positionName)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}