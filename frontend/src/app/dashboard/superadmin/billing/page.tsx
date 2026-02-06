"use client";

import { useEffect, useState, useCallback } from "react";
import { FiDollarSign, FiFileText, FiCheck, FiAlertCircle } from "react-icons/fi";
import styles from "./billing.module.css";
import Swal from "sweetalert2";

// SINKRONISASI: Menggunakan base URL superadmin yang benar
const API_URL = "http://localhost:5000/api/superadmin";

export default function BillingManagement() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Seluruh Transaksi Global
  // SINKRONISASI: GET /api/superadmin/billing/transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${API_URL}/billing/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (result.success) {
        setTransactions(result.data);
      }
    } catch (err) {
      console.error("Gagal mengambil data transaksi:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

const handleManualActivate = async (id: number) => {
    const result = await Swal.fire({
      title: 'Konfirmasi Verifikasi',
      text: "Pastikan dana sudah diterima. Paket tenant akan segera aktif!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0A224A',
      confirmButtonText: 'Ya, Verifikasi!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        
        const res = await fetch(`${API_URL}/billing/activate-manual/${id}`, {
          method: "POST", 
          headers: { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        const resData = await res.json();

        if (res.ok && resData.success) {
          Swal.fire('Berhasil', 'Pembayaran diverifikasi. Paket tenant telah aktif.', 'success');
          fetchTransactions(); // Refresh tabel
        } else {
          Swal.fire('Gagal', resData.message || 'Gagal memproses verifikasi.', 'error');
        }
      } catch (error) {
        console.error("Connection Error:", error);
        Swal.fire('Error', 'Gagal menghubungi server. Pastikan koneksi backend aktif.', 'error');
      }
    }
  };

  if (loading) return <div className={styles.loaderArea}><div className={styles.spinner}></div></div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1><FiDollarSign /> Billing Audit (Superadmin)</h1>
          <p>Verifikasi pembayaran manual dan log transaksi Midtrans global.</p>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Perusahaan</th>
                <th>Paket</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((trx) => (
                  <tr key={trx.id}>
                    <td><strong>#{trx.referenceId || trx.invoiceId}</strong></td>
                    <td>{trx.company?.name || "Global Tenant"}</td>
                    <td className={styles.planName}>{trx.planName}</td>
                    <td className={styles.amount}>
                      Rp {Number(trx.amount).toLocaleString('id-ID')}
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[trx.status?.toLowerCase() || 'pending']}`}>
                        {trx.status}
                      </span>
                    </td>
                    <td className={styles.actionCell}>
                      {/* Hanya munculkan tombol Verify jika status belum Success/Paid */}
                      {(trx.status === 'Pending' || trx.status === 'Failed') && (
                        <button 
                          onClick={() => handleManualActivate(trx.id)} 
                          className={styles.btnActivate}
                          title="Aktivasi Manual"
                        >
                          <FiCheck /> Verify
                        </button>
                      )}
                      <button className={styles.btnDetail} title="Log Detail">
                        <FiFileText />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyRow}>
                    <FiAlertCircle /> Tidak ada log transaksi masuk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}