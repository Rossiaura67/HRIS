"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./subscriptions.module.css";
import { FiPackage, FiUsers, FiEdit3, FiPlus, FiDollarSign, FiTrash2, FiSlash } from "react-icons/fi";
import Swal from "sweetalert2";

// Pastikan port ini sesuai dengan port Backend Express Anda
const API_URL = "http://localhost:5000/api/superadmin";

export default function SubscriptionManagement() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper untuk mendapatkan Header Authorization
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // 1. Fetch Master Plans (Sync: getMasterPlans)
  const fetchMasterPlans = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/master-plans`, {
        headers: getAuthHeader()
      });
      const result = await res.json();
      if (result.success) {
        const colors = ["#dee9ff", "#99d6ff", "#c0ffff", "#9db4ff"];
        setPlans(result.data.map((p: any, i: number) => ({
          ...p,
          color: colors[i % colors.length]
        })));
      }
    } catch (err) { console.error("Gagal memuat plans"); }
  }, []);

  // 2. Fetch Tenants (Sync: getAllTenants)
  const fetchTenants = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tenants`, {
        headers: getAuthHeader()
      });
      const result = await res.json();
      // Backend mengembalikan { success: true, data: [...] }
      if (result.success) setTenants(result.data);
    } catch (err) { 
      console.error("Gagal memuat tenant"); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchMasterPlans();
    fetchTenants();
  }, [fetchMasterPlans, fetchTenants]);

  // 3. Hapus Master Plan (Sync: deleteMasterPlan)
  const handleDeletePlan = async (id: number, name: string) => {
    const confirm = await Swal.fire({
      title: `Hapus Paket ${name}?`,
      text: "Hati-hati, jika paket ini sedang digunakan oleh tenant aktif, penghapusan mungkin gagal atau merusak data langganan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus Paket'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/master-plans/${id}`, {
          method: "DELETE",
          headers: getAuthHeader()
        });
        const result = await res.json();
        if (result.success) {
          Swal.fire("Terhapus", "Paket master berhasil dihapus dari katalog.", "success");
          fetchMasterPlans();
        } else {
          Swal.fire("Gagal", result.message || "Gagal menghapus paket", "error");
        }
      } catch (err) { Swal.fire("Error", "Terjadi kesalahan sistem", "error"); }
    }
  };

  // 4. Create/Update Plan (Sync: upsertMasterPlan)
  const handleUpsertPlan = async (existingPlan: any = null) => {
    const { value: formValues } = await Swal.fire({
      title: existingPlan ? 'Update Paket' : 'Tambah Paket SaaS',
      html:
        `<label style="display:block; text-align:left; margin-bottom:5px; font-size:12px;">Nama Paket</label>` +
        `<input id="p-name" class="swal2-input" placeholder="Nama Paket" value="${existingPlan?.name || ''}">` +
        `<label style="display:block; text-align:left; margin-bottom:5px; font-size:12px;">Harga (IDR)</label>` +
        `<input id="p-price" type="number" class="swal2-input" placeholder="Harga" value="${existingPlan?.price || ''}">` +
        `<label style="display:block; text-align:left; margin-bottom:5px; font-size:12px;">Limit Akun Karyawan</label>` +
        `<input id="p-limit" type="number" class="swal2-input" placeholder="Limit User" value="${existingPlan?.maxEmployees || ''}">` +
        `<label style="display:block; text-align:left; margin-bottom:5px; font-size:12px;">Masa Aktif (Hari)</label>` +
        `<input id="p-days" type="number" class="swal2-input" placeholder="Durasi" value="${existingPlan?.durationDays || 30}">` +
        `<label style="display:block; text-align:left; margin-bottom:5px; font-size:12px;">Deskripsi Singkat</label>` +
        `<input id="p-desc" class="swal2-input" placeholder="Contoh: Growing Business" value="${existingPlan?.description || ''}">`,
      showCancelButton: true,
      confirmButtonColor: '#0A224A',
      confirmButtonText: 'Simpan Konfigurasi',
      preConfirm: () => ({
        id: existingPlan?.id || null, // ID null untuk create, ada ID untuk update
        name: (document.getElementById('p-name') as HTMLInputElement).value,
        price: Number((document.getElementById('p-price') as HTMLInputElement).value),
        maxEmployees: Number((document.getElementById('p-limit') as HTMLInputElement).value),
        durationDays: Number((document.getElementById('p-days') as HTMLInputElement).value),
        description: (document.getElementById('p-desc') as HTMLInputElement).value,
        isActive: true
      })
    });

    if (formValues) {
      if (!formValues.name || !formValues.price) return Swal.fire("Error", "Nama dan Harga wajib diisi", "error");

      try {
        const res = await fetch(`${API_URL}/master-plans`, {
          method: "POST", // Backend menggunakan .upsert() di satu endpoint POST
          headers: getAuthHeader(),
          body: JSON.stringify(formValues)
        });
        const result = await res.json();
        if (result.success) {
          Swal.fire("Berhasil", "Katalog paket diperbarui", "success");
          fetchMasterPlans();
        }
      } catch (error) { Swal.fire("Error", "Gagal menyimpan paket", "error"); }
    }
  };

  // 5. Suspend Access (Sync: terminateTenantAccess)
  const handleTerminate = async (companyId: number, companyName: string) => {
    const confirm = await Swal.fire({
      title: `Bekukan Akses ${companyName}?`,
      text: "Tenant akan di-suspend, tapi data perusahaan tetap tersimpan.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f39c12',
      confirmButtonText: 'Ya, Suspend!'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/tenants/${companyId}/terminate`, {
          method: "DELETE",
          headers: getAuthHeader()
        });
        if (res.ok) {
          Swal.fire("Suspended", "Akses tenant telah dibekukan.", "success");
          fetchTenants();
        }
      } catch (err) { Swal.fire("Error", "Gagal menghubungi server", "error"); }
    }
  };

  // 6. Hard Delete Tenant (Sync: deleteTenant)
  const handleDeleteTenant = async (id: number, name: string, userCount: number) => {
    // Validasi frontend sebelum hit backend
    if (userCount > 0) {
      return Swal.fire("Gagal", `Tenant "${name}" masih memiliki ${userCount} pengguna aktif. Hapus pengguna tersebut di manajemen user terlebih dahulu.`, "error");
    }

    const confirm = await Swal.fire({
      title: `Hapus Permanen ${name}?`,
      text: "Data perusahaan dan langganan akan dihapus selamanya!",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus Permanen!'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/tenants/${id}`, {
          method: "DELETE",
          headers: getAuthHeader()
        });
        const result = await res.json();
        if (result.success) {
          Swal.fire("Terhapus", result.message, "success");
          fetchTenants();
        } else {
          Swal.fire("Gagal", result.message, "error");
        }
      } catch (err) { Swal.fire("Error", "Terjadi kesalahan sistem", "error"); }
    }
  };

  if (loading) return <div className={styles.loader}><span></span></div>;

  return (
    <div className={styles.container}>
      {/* Header, PlanGrid, dan Table tetap seperti kode Anda (Sudah benar) */}
      <div className={styles.headerRow}>
        <div className={styles.welcomeInfo}>
          <h1>SaaS Control Panel</h1>
          <p>Manajemen lisensi dan paket harga global.</p>
        </div>
        <div className={styles.actionGroup}>
          <button onClick={() => router.push('/dashboard/superadmin/billing')} className={styles.btnBilling}>
            <FiDollarSign /> Log Transaksi
          </button>
          <button onClick={() => handleUpsertPlan()} className={styles.btnPrimary}>
            <FiPlus /> Buat Paket
          </button>
        </div>
      </div>

      <div className={styles.planGrid}>
        {plans.map((plan) => (
          <div key={plan.id} className={styles.planCard} style={{ backgroundColor: plan.color }}>
            <div className={styles.planHeader}>
              <FiPackage size={22} color="#0A224A" />
              <div className={styles.planActions}>
                <button onClick={() => handleUpsertPlan(plan)} className={styles.iconEdit} title="Edit Paket"><FiEdit3 /></button>
                <button onClick={() => handleDeletePlan(plan.id, plan.name)} className={styles.iconDelete} title="Hapus Paket"><FiTrash2 color="#d33" /></button>
              </div>
            </div>
            <h3 className={styles.planName}>{plan.name}</h3>
            <p className={styles.planPrice}>Rp {Number(plan.price).toLocaleString('id-ID')}</p>
            <div className={styles.planFeature}>
              <FiUsers size={14} /> <span>Maks. {plan.maxEmployees} Akun</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama Perusahaan</th>
                <th>Paket</th>
                <th>Utilisasi Karyawan</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant: any) => (
                <tr key={tenant.id}>
                  <td><strong>{tenant.name}</strong></td>
                  <td>{tenant.subscription?.planName || 'Trial'}</td>
                  <td>
                    <div className={styles.usageBar}>
                      <div 
                        className={styles.usageFill} 
                        style={{ width: `${Math.min(((tenant._count?.users || 0) / (tenant.subscription?.maxEmployees || 10)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <small>{tenant._count?.users} / {tenant.subscription?.maxEmployees || 10}</small>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[tenant.status?.toLowerCase() || 'active']}`}>
                      {tenant.status}
                    </span>
                  </td>
                  <td className={styles.actionCell}>
                    <button onClick={() => handleTerminate(tenant.id, tenant.name)} className={styles.btnAction} title="Suspend Access">
                      <FiSlash color="#f39c12" />
                    </button>
                    <button onClick={() => handleDeleteTenant(tenant.id, tenant.name, tenant._count?.users || 0)} className={styles.btnAction} title="Hard Delete">
                      <FiTrash2 color="#d33" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}