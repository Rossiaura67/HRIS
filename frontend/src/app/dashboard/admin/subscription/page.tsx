"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./billing.module.css";
import Swal from "sweetalert2";

// Gunakan Env Variable
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const API_URL = `${API_BASE}/subscription`;

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const router = useRouter();

  const fetchBillingData = useCallback(async () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) return router.push("/Auth/login");

    try {
      setLoading(true);
      const headers = { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      
      const [subRes, plansRes] = await Promise.all([
        fetch(`${API_URL}/my-plan`, { headers }),
        fetch(`${API_URL}/plans`, { headers })
      ]);

      const subData = await subRes.json();
      const plansData = await plansRes.json();

      if (subData.success) setSubscription(subData.data);
      if (plansData.success) setPlans(plansData.data);

      // Gunakan pengecekan role yang lebih aman
      if (role === "admin" || role === "superadmin") {
        const histRes = await fetch(`${API_URL}/my-history`, { headers });
        const histData = await histRes.json();
        if (histData.success) setHistory(histData.data);
      }
    } catch (err) {
      console.error("Billing fetch error:", err);
      Swal.fire("Error", "Gagal memuat data langganan", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchBillingData(); }, [fetchBillingData]);

  const handleCheckout = async (plan: any) => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");

    // Izinkan admin dan superadmin
    if (role !== "admin" && role !== "superadmin") {
      return Swal.fire("Akses Ditolak", "Hanya pengelola akun yang dapat mengelola langganan.", "warning");
    }

    const { value: file } = await Swal.fire({
      title: `Beli Paket ${plan.name}`,
      html: `
        <div style="text-align: left; font-size: 14px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <p style="margin-bottom: 10px; font-weight: 600; color: #64748b;">Instruksi Pembayaran:</p>
          <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #cbd5e1;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8;">Bank BCA</p>
            <p style="margin: 5px 0; font-size: 18px; font-weight: 800; color: #1e293b;">1234567890</p>
            <p style="margin: 0; font-size: 13px; font-weight: 600; color: #4A86C5;">A.N. Intan Tania</p>
          </div>
          <p style="margin-bottom: 5px; font-size: 12px;">Total Bayar:</p>
          <p style="color: #ff7a50; font-weight: 900; font-size: 22px; margin: 0;">
            Rp ${Number(plan.price).toLocaleString('id-ID')}
          </p>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 15px; font-style: italic;">
            *Unggah foto bukti transfer untuk aktivasi manual oleh tim kami.
          </p>
        </div>
      `,
      input: "file",
      inputAttributes: { "accept": "image/*", "aria-label": "Upload bukti transfer" },
      showCancelButton: true,
      confirmButtonText: "Kirim Bukti Pembayaran",
      confirmButtonColor: "#1e293b",
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (!value) return "Wajib mengunggah bukti transfer!";
      }
    });

    if (file) {
      setProcessingId(plan.id);
      const formData = new FormData();
      formData.append("planId", plan.id.toString());
      formData.append("proofOfPayment", file);

      try {
        const res = await fetch(`${API_URL}/checkout-manual`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });

        const result = await res.json();
        if (result.success) {
          Swal.fire("Berhasil!", "Pembayaran sedang diverifikasi. Mohon tunggu maksimal 1x24 jam.", "success");
          fetchBillingData();
        } else {
          throw new Error(result.message);
        }
      } catch (error: any) {
        Swal.fire("Gagal", error.message || "Gagal mengirim bukti.", "error");
      } finally {
        setProcessingId(null);
      }
    }
  };

  if (loading) return <div className={styles.loaderArea}><div className={styles.spinner}></div></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Subscription & Billing</h1>

      <div className={styles.statusGrid}>
        <div className={styles.statusCard}>
          <p className={styles.label}>Paket Saat Ini</p>
          <h2 className={styles.planName}>{subscription?.planName || "Trial Mode"}</h2>
          <span className={styles.expiry}>Berakhir dalam: <strong>{subscription?.daysLeft || 0}</strong> Hari</span>
        </div>
        
        <div className={styles.statusCard}>
          <p className={styles.label}>Utilisasi Kuota</p>
          <div className={styles.usageInfo}>
            <span className={styles.usageValue}>{subscription?.activeEmployees || 0}</span>
            <span className={styles.totalValue}>/ {subscription?.maxEmployees || 0} User</span>
          </div>
          <div className={styles.progressBg}>
             <div 
                className={styles.progressBar} 
                style={{ 
                  width: `${subscription?.maxEmployees ? Math.min((subscription.activeEmployees / subscription.maxEmployees) * 100, 100) : 0}%`, 
                  backgroundColor: (subscription?.activeEmployees / subscription?.maxEmployees) >= 0.9 ? "#ef4444" : "#10b981" 
                }}
             ></div>
          </div>
        </div>

        <div className={styles.statusCard}>
          <p className={styles.label}>Status Akun</p>
          <span className={`${styles.badge} ${subscription?.status === 'Active' ? styles.bgActive : styles.bgExpired}`}>
            {subscription?.status || "Inactive"}
          </span>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>Pilih Paket Upgrade</h3>
      <div className={styles.plansGrid}>
        {plans.map((plan: any) => (
          <div key={plan.id} className={`${styles.planCard} ${subscription?.planName === plan.name ? styles.planActive : ""}`}>
            {subscription?.planName === plan.name && <div className={styles.activeLabel}>Sedang Digunakan</div>}
            <h4>{plan.name}</h4>
            <div className={styles.priceTag}>
              <span className={styles.currency}>Rp</span>
              <span className={styles.amount}>{Number(plan.price).toLocaleString('id-ID')}</span>
              <span className={styles.period}>/ {plan.durationDays} hari</span>
            </div>
            <ul className={styles.features}>
              <li>✅ Maksimal {plan.maxEmployees} Karyawan</li>
              <li>✅ Full Access Dashboard Admin</li>
              <li>✅ Laporan PDF & Excel Unlimited</li>
              <li>✅ Support Prioritas</li>
            </ul>
            <button 
                className={styles.buyBtn} 
                onClick={() => handleCheckout(plan)} 
                disabled={processingId !== null || subscription?.planName === plan.name}
            >
              {processingId === plan.id ? "Memproses..." : subscription?.planName === plan.name ? "Paket Anda" : "Pilih paket"}
            </button>
          </div>
        ))}
      </div>

      {(localStorage.getItem("role") === "admin" || localStorage.getItem("role") === "superadmin") && (
        <>
          <h3 className={styles.sectionTitle}>Riwayat Transaksi</h3>
          <div className={styles.tableCard}>
            <div className={styles.tableWrapper}>
                <table className={styles.billingTable}>
                <thead>
                    <tr>
                    <th>Tanggal</th>
                    <th>Invoice / Ref</th>
                    <th>Paket</th>
                    <th>Total Bayar</th>
                    <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {history.length > 0 ? history.map((trx: any) => (
                    <tr key={trx.id}>
                        <td>{new Date(trx.createdAt).toLocaleDateString('id-ID')}</td>
                        <td><code className={styles.code}>#{trx.referenceId || trx.invoiceId || 'N/A'}</code></td>
                        <td>{trx.planName}</td>
                        <td className={styles.amountText}>Rp {Number(trx.amount).toLocaleString('id-ID')}</td>
                        <td><span className={`${styles.statusText} ${styles[trx.status?.toLowerCase()]}`}>{trx.status}</span></td>
                    </tr>
                    )) : (
                        <tr><td colSpan={5} className={styles.emptyTable}>Belum ada riwayat transaksi.</td></tr>
                    )}
                </tbody>
                </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}