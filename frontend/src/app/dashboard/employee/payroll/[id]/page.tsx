"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  FiArrowLeft, FiPrinter, FiInfo, FiClock, FiCalendar, 
  FiCreditCard, FiUser, FiBriefcase, FiDownload 
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import styles from "./detail.module.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = "http://localhost:5000/api/payroll";

export default function EmployeePayrollDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

const fetchDetail = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      
      // PERBAIKAN: Gunakan endpoint /me/${id} sesuai route backend
      const res = await fetch(`${API_BASE_URL}/me/${id}`, {
        method: "GET",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      
      const result = await res.json();
      
      if (res.ok && result.success) {
        setData(result.data);
      } else {
        // Jika status 401/403 (Token expired atau tidak sah)
        if (res.status === 401) {
          toast.error("Sesi telah berakhir, silakan login ulang");
          router.push("/login");
          return;
        }
        toast.error(result.message || "Slip gaji tidak ditemukan");
        router.push("/dashboard/employee/payroll");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [fetchDetail, id]);

  if (loading) return <div className={styles.center}>Menyiapkan Slip Gaji...</div>;
  if (!data) return <div className={styles.center}>Data tidak ditemukan</div>;

  // KALKULASI LOGIKA
  const mealTotal = Number(data.meal_allowance_snapshot || 0) * Number(data.total_attendance || 0);
  const transportTotal = Number(data.transport_allowance_snapshot || 0) * Number(data.total_attendance || 0);
  const fixedAllowance = Number(data.allowances || 0);
  const totalBruto = Number(data.basic_salary) + mealTotal + transportTotal + fixedAllowance;
  const totalDeductions = Number(data.deductions || 0);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  // --- FUNGSI DOWNLOAD PDF PROFESIONAL ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const period = `${new Date(0, data.month - 1).toLocaleString('id-ID', { month: 'long' })} ${data.year}`;

    // Header Perusahaan
    doc.setFontSize(16);
    doc.setTextColor(0, 35, 91);
    doc.text(data.user?.company?.name || "PT. PERUSAHAAN", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(data.user?.company?.address || "", 14, 26);
    doc.line(14, 30, 196, 30);

    // Judul
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("SLIP GAJI KARYAWAN", 105, 40, { align: "center" });
    doc.setFontSize(11);
    doc.text(`Periode: ${period}`, 105, 46, { align: "center" });

    // Info Karyawan
    autoTable(doc, {
      startY: 55,
      body: [
        ["Nama Karyawan", `: ${data.user?.name}`, "No. Referensi", `: #PAY-${data.id}`],
        ["Jabatan", `: ${data.user?.position?.positionName}`, "Metode", `: ${data.user?.bank_name}`],
        ["Hadir", `: ${data.total_attendance} Hari`, "Rekening", `: ${data.user?.bank_account}`],
      ],
      theme: "plain",
      styles: { fontSize: 10, cellPadding: 1 },
    });

    // Tabel Rincian
    autoTable(doc, {
      startY: 75,
      head: [["DESKRIPSI", "JUMLAH (IDR)"]],
      body: [
        ["Gaji Pokok", formatIDR(data.basic_salary)],
        ["Tunjangan Makan", formatIDR(mealTotal)],
        ["Tunjangan Transport", formatIDR(transportTotal)],
        ["Tunjangan Jabatan", formatIDR(fixedAllowance)],
        [{ content: "TOTAL BRUTO", styles: { fontStyle: 'bold' } }, formatIDR(totalBruto)],
        ["", ""],
        ["Potongan Terlambat", `-${formatIDR(totalDeductions)}`],
        [{ content: "TOTAL POTONGAN", styles: { fontStyle: 'bold' } }, `-${formatIDR(totalDeductions)}`],
        ["", ""],
        [{ content: "GAJI BERSIH (TAKE HOME PAY)", styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: formatIDR(data.net_salary), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 35, 91] }
    });

    doc.save(`Slip_Gaji_${data.user?.name}_${period}.pdf`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.noPrint}>
        <div className={styles.actionBar}>
          <button onClick={() => router.back()} className={styles.btnBack}>
            <FiArrowLeft /> Kembali
          </button>
          <div className={styles.btnGroup}>
            <button onClick={handleDownloadPDF} className={styles.btnDownload}>
              <FiDownload /> Unduh PDF
            </button>
            <button onClick={() => window.print()} className={styles.btnPrint}>
              <FiPrinter /> Cetak Cepat
            </button>
          </div>
        </div>
      </div>

      <div className={styles.payslipCard}>
        <header className={styles.header}>
          <div className={styles.companyInfo}>
            <h1>{data.user?.company?.name || "PT. NAMA PERUSAHAAN"}</h1>
            <p>{data.user?.company?.address || "Alamat Kantor"}</p>
          </div>
          <div className={styles.slipLabel}>
            <h2>SLIP GAJI KARYAWAN</h2>
            <p className={styles.periodText}>
              {new Date(0, data.month - 1).toLocaleString('id-ID', { month: 'long' })} {data.year}
            </p>
          </div>
        </header>

        <hr className={styles.divider} />

        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <label><FiUser /> Nama Karyawan</label>
            <p><strong>{data.user?.name}</strong></p>
          </div>
          <div className={styles.infoItem}>
            <label><FiBriefcase /> Jabatan</label>
            <p>{data.user?.position?.positionName || "Staff"}</p>
          </div>
          <div className={styles.infoItem}>
            <label><FiCreditCard /> Pembayaran</label>
            <p>{data.user?.bank_name} - {data.user?.bank_account}</p>
          </div>
          <div className={styles.infoItem}>
            <label>No. Referensi</label>
            <p>#PAY-{data.id.toString().padStart(6, '0')}</p>
          </div>
        </div>

        <div className={styles.attendanceSummary}>
          <div className={styles.attItem}>
            <FiCalendar /> <span>Total Hadir: <strong>{data.total_attendance} Hari</strong></span>
          </div>
          <div className={styles.attItem}>
            <FiClock /> <span>Total Telat: <strong>{data.total_late_mins} Menit</strong></span>
          </div>
        </div>

        <div className={styles.calculationGrid}>
          <div className={styles.calcColumn}>
            <h3>PENERIMAAN (+)</h3>
            <div className={styles.row}>
              <span>Gaji Pokok</span>
              <span>{formatIDR(data.basic_salary)}</span>
            </div>
            <div className={styles.row}>
              <div className={styles.subDetail}>
                <span>Tunjangan Makan</span>
                <small>{data.total_attendance} hari x {formatIDR(data.meal_allowance_snapshot)}</small>
              </div>
              <span>{formatIDR(mealTotal)}</span>
            </div>
            <div className={styles.row}>
              <div className={styles.subDetail}>
                <span>Tunjangan Transport</span>
                <small>{data.total_attendance} hari x {formatIDR(data.transport_allowance_snapshot)}</small>
              </div>
              <span>{formatIDR(transportTotal)}</span>
            </div>
            <div className={styles.row}>
              <span>Tunjangan Jabatan</span>
              <span>{formatIDR(fixedAllowance)}</span>
            </div>
            <div className={`${styles.row} ${styles.totalRowBruto}`}>
              <span>TOTAL BRUTO</span>
              <span>{formatIDR(totalBruto)}</span>
            </div>
          </div>

          <div className={styles.calcColumn}>
            <h3>POTONGAN (-)</h3>
            <div className={styles.row}>
              <div className={styles.subDetail}>
                <span>Denda Terlambat</span>
                <small>{data.total_late_mins} mnt x {formatIDR(data.late_deduction_rate_snapshot)}</small>
              </div>
              <span className={styles.textRed}>-{formatIDR(totalDeductions)}</span>
            </div>
            <div className={`${styles.row} ${styles.totalRowPotongan}`}>
              <span>TOTAL POTONGAN</span>
              <span className={styles.textRed}>-{formatIDR(totalDeductions)}</span>
            </div>
          </div>
        </div>

        <div className={styles.netSalarySection}>
          <div className={styles.netBox}>
            <p>GAJI BERSIH (TAKE HOME PAY)</p>
            <h1>{formatIDR(data.net_salary)}</h1>
          </div>
        </div>

        <footer className={styles.footer}>
          <p className={styles.electronicNote}>
            <FiInfo /> Slip gaji ini diterbitkan secara elektronik dan merupakan bukti sah.
          </p>
          <div className={styles.printDate}>
            Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
          </div>
        </footer>
      </div>
    </div>
  );
}