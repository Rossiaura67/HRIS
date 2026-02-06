"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  FiArrowLeft, FiDollarSign, FiUser, FiFilter, FiCheckCircle, 
  FiFileText, FiRefreshCw, FiCreditCard, FiTrendingUp, FiZap, FiTrash2, FiPrinter, FiCheck, FiPlus 
} from "react-icons/fi";
import styles from "./payroll.module.css";
import Swal from "sweetalert2";

const API_BASE = "http://localhost:5000/api/payroll";

export default function PayrollPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filter, setFilter] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/list?month=${filter.month}&year=${filter.year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPayrolls(data.data);
    } catch (err) {
      Swal.fire("Error", "Gagal sinkronisasi data", "error");
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportPDF = async () => {
    if (payrolls.length === 0) return Swal.fire("Info", "Tidak ada data untuk dicetak", "info");
    const token = localStorage.getItem("token");

    Swal.fire({
      title: 'Menyiapkan PDF...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false
    });

    try {
      const res = await fetch(`${API_BASE}/export-pdf?month=${filter.month}&year=${filter.year}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Gagal generate PDF");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rekap_Gaji_${months[filter.month - 1]}_${filter.year}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Swal.close();
    } catch (err) {
      Swal.fire("Error", "Gagal mengunduh PDF", "error");
    }
  };

  const handleGenerate = async () => {
    const token = localStorage.getItem("token");
    const result = await Swal.fire({
      title: 'Generate Payroll?',
      text: `Buat draft slip gaji periode ${months[filter.month-1]} ${filter.year}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Generate',
      confirmButtonColor: '#0f172a'
    });

    if (result.isConfirmed) {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(filter)
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire("Berhasil", data.message, "success");
        fetchData();
      }
    }
  };

  const handleCalculate = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/calculate/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Dihitung', timer: 800, showConfirmButton: false });
        fetchData();
      }
    } catch (err) { Swal.fire("Error", "Gagal kalkulasi", "error"); }
  };

  const handleApproveAll = async () => {
    const token = localStorage.getItem("token");
    const reviewCount = payrolls.filter(p => p.status === 'Review').length;
    if (reviewCount === 0) return Swal.fire("Info", "Tidak ada data berstatus Review", "info");

    const result = await Swal.fire({
      title: 'Approve Semua?',
      text: `Setujui ${reviewCount} data payroll massal?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Approve Semua',
      confirmButtonColor: '#10b981'
    });

    if (result.isConfirmed) {
      const res = await fetch(`${API_BASE}/approve-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(filter)
      });
      if (res.ok) {
        Swal.fire("Berhasil", "Semua payroll disetujui.", "success");
        fetchData();
      }
    }
  };

  const handleBulkPayment = async () => {
    const token = localStorage.getItem("token");
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: 'Proses Pembayaran?',
      text: `Tandai ${selectedIds.length} slip sebagai PAID?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Bayar Sekarang',
      confirmButtonColor: '#0f172a'
    });

    if (result.isConfirmed) {
      const res = await fetch(`${API_BASE}/bulk-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ payrollIds: selectedIds })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire("Berhasil", "Pembayaran telah dicatat.", "success");
        setSelectedIds([]);
        fetchData();
      } else {
        Swal.fire("Gagal", data.message, "error");
      }
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem("token");
    const result = await Swal.fire({
      title: 'Hapus Payroll?',
      text: "Data akan dihapus dan kunci absensi akan dibuka kembali.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48'
    });

    if (result.isConfirmed) {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) fetchData();
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const approvable = payrolls.filter(p => p.status === 'Approved').map(p => p.id);
      setSelectedIds(approvable);
    } else {
      setSelectedIds([]);
    }
  };

  const formatIDR = (num: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(num || 0));

  return (
    <div className={styles.container}>
      <div className={styles.maxWrapper}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button onClick={() => router.push('/dashboard/admin')} className={styles.backBtn}>
              <FiArrowLeft /> Dashboard
            </button>
            <h1 className={styles.title}>Payroll Management</h1>
          </div>
          <div className={styles.headerActions}>
            <button onClick={handleExportPDF} className={styles.pdfBtn}>
              <FiPrinter /> Export Rekap PDF
            </button>
            <button onClick={handleApproveAll} className={styles.approveBtn}>
              <FiCheckCircle /> Approve All
            </button>
            <button onClick={handleGenerate} className={styles.processBtn}>
              <FiPlus /> Generate Draft
            </button>
          </div>
        </header>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}><FiTrendingUp /></div>
            <div className={styles.cardInfo}>
              <p>Total Pengeluaran Gaji</p>
              <h3>{formatIDR(payrolls.reduce((acc, curr) => acc + Number(curr.net_salary), 0))}</h3>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.cardIcon}><FiUser /></div>
            <div className={styles.cardInfo}>
              <p>Total Data Slip</p>
              <h3>{payrolls.length} Karyawan</h3>
            </div>
          </div>
        </div>

        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <FiFilter />
            <select value={filter.month} onChange={e => setFilter({...filter, month: parseInt(e.target.value)})} className={styles.select}>
              {months.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="number" value={filter.year} onChange={e => setFilter({...filter, year: parseInt(e.target.value)})} className={styles.yearInput} />
          </div>
          {selectedIds.length > 0 && (
            <button onClick={handleBulkPayment} className={styles.paymentBtn}>
              <FiZap /> Bayar {selectedIds.length} Terpilih
            </button>
          )}
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" onChange={(e) => toggleSelectAll(e.target.checked)} />
                  </th>
                  <th>Karyawan</th>
                  <th>Rekening Bank</th>
                  <th>Gaji Pokok</th>
                  <th>Potongan</th>
                  <th>Gaji Bersih</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && payrolls.length === 0 ? (
                  <tr><td colSpan={8} className={styles.loading}>Memproses data...</td></tr>
                ) : payrolls.length > 0 ? payrolls.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        disabled={row.status !== 'Approved'}
                        checked={selectedIds.includes(row.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(row.id) ? prev.filter(i => i !== row.id) : [...prev, row.id])}
                      />
                    </td>
                    <td>
                      <div className={styles.userCell}>
                        <span className={styles.userName}>{row.user?.name}</span>
                        <span className={styles.userPos}>{row.user?.position?.positionName || 'Staff'}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.bankCell}>
                        <FiCreditCard size={14} color={!row.user?.bank_account ? '#ef4444' : '#94a3b8'} />
                        <div>
                          <span className={styles.bankName}>{row.user?.bank_name || '-'}</span>
                          <span className={!row.user?.bank_account ? styles.textRed : styles.bankAcc}>{row.user?.bank_account || 'KOSONG'}</span>
                        </div>
                      </div>
                    </td>
                    <td>{formatIDR(row.basic_salary)}</td>
                    <td className={styles.textRed}>-{formatIDR(row.deductions)}</td>
                    <td className={styles.fontBold}>{formatIDR(row.net_salary)}</td>
                    <td><span className={`${styles.statusBadge} ${styles[row.status?.toLowerCase()]}`}>{row.status}</span></td>
                    <td>
                      <div className={styles.actionGroup}>
                        {row.status === 'Draft' && (
                          <button onClick={() => handleCalculate(row.id)} className={styles.calcBtn} title="Kalkulasi">
                            <FiRefreshCw />
                          </button>
                        )}
                        {row.status === 'Review' && (
                          <button onClick={() => handleUpdateStatus(row.id, 'Approved')} className={styles.approveBtnSmall} title="Setujui">
                            <FiCheck />
                          </button>
                        )}
                        <button onClick={() => router.push(`/dashboard/admin/payroll/detail/${row.id}`)} className={styles.slipBtn} title="Detail Slip">
                          <FiFileText />
                        </button>
                        {row.status !== 'Paid' && (
                          <button onClick={() => handleDelete(row.id)} className={styles.deleteBtn} title="Hapus">
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className={styles.noData}>Klik "Generate Draft" untuk memulai periode ini.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}