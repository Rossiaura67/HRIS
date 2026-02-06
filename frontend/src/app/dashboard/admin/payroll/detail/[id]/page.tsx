"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiPrinter, FiDownload } from "react-icons/fi";
import styles from "./detail.module.css";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// SINKRONISASI: Endpoint base URL
const API_BASE = "http://localhost:5000/api/payroll";

export default function PayrollDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const slipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role"); // Ambil role untuk menentukan endpoint
      
      try {
        // SINKRONISASI RUTE: 
        // Jika admin, gunakan /api/payroll/:id
        // Jika employee, gunakan /api/payroll/me/:id
        const endpoint = role === "admin" ? `${API_BASE}/${id}` : `${API_BASE}/me/${id}`;
        
        const res = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          Swal.fire("Gagal", result.message, "error");
          router.back();
        }
      } catch (err) {
        Swal.fire("Error", "Gagal menyinkronkan data dengan server", "error");
      }
    };
    fetchDetail();
  }, [id, router]);

  const formatIDR = (num: any) => 
    new Intl.NumberFormat("id-ID", { 
        style: "currency", 
        currency: "IDR", 
        maximumFractionDigits: 0 
    }).format(Number(num || 0));

  // Fungsi Export PDF (html2canvas)
  const handleDownloadPDF = async () => {
    if (!slipRef.current) return;

    Swal.fire({
      title: 'Menyiapkan Dokumen...',
      text: 'Mengonversi slip ke format PDF kualitas tinggi',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const element = slipRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Slip_Gaji_${data.user?.name}_${data.month}_${data.year}.pdf`);

      Swal.close();
    } catch (error) {
      Swal.close();
      Swal.fire("Gagal", "Format PDF gagal dibuat", "error");
    }
  };

  if (!data) return <div className={styles.loading}>Menghubungkan ke sistem payroll...</div>;

  return (
    <div className={styles.slipContainer}>
      <header className={styles.slipNav}>
        <div className={styles.navLeft}>
          <button onClick={() => router.back()} className={styles.backBtn}>
            <FiArrowLeft /> Kembali
          </button>
        </div>
        <div className={styles.navRight}>
          <button onClick={handleDownloadPDF} className={styles.downloadBtn}>
            <FiDownload /> Simpan PDF
          </button>
          <button onClick={() => window.print()} className={styles.printBtn}>
            <FiPrinter /> Cetak Slip
          </button>
        </div>
      </header>

      {/* Area Slip Gaji */}
      <div className={styles.slipPaper} ref={slipRef}>
        <div className={styles.slipHeader}>
          <div className={styles.companyLogo}>
             {/* Jika ada logo perusahaan di database */}
             {data.company?.logo ? (
                <img src={`http://localhost:5000/uploads/logos/${data.company.logo}`} alt="Logo" />
             ) : (
                <div className={styles.placeholderLogo}>LOGO</div>
             )}
          </div>
          <div className={styles.companyInfo}>
            <h2>{data.company?.name}</h2>
            <p>{data.company?.address || "Alamat belum diatur"}</p>
          </div>
          <div className={styles.slipTitle}>
            <h3>SLIP GAJI</h3>
            <p>Periode: {data.month} - {data.year}</p>
          </div>
        </div>

        <div className={styles.employeeGrid}>
          <div><label>Nama Karyawan</label> <p>{data.user?.name}</p></div>
          <div><label>ID Karyawan (NIK)</label> <p>{data.user?.employeeId || "-"}</p></div>
          <div><label>Jabatan</label> <p>{data.user?.position?.positionName}</p></div>
          <div><label>Metode Pembayaran</label> <p>{data.user?.bank_name} ({data.user?.bank_account})</p></div>
        </div>

        <div className={styles.salaryGrid}>
          <div className={styles.salaryCol}>
            <h4>Penerimaan (+)</h4>
            <div className={styles.salaryRow}><span>Gaji Pokok</span> <span>{formatIDR(data.basic_salary)}</span></div>
            <div className={styles.salaryRow}><span>Tunjangan Jabatan</span> <span>{formatIDR(data.allowances)}</span></div>
            <div className={styles.salaryRow}><span>Tunjangan Makan & Transp</span> <span>{formatIDR(Number(data.meal_allowance_snapshot) + Number(data.transport_allowance_snapshot))}</span></div>
            <div className={styles.salaryRow}><span>Kehadiran ({data.total_attendance} hari)</span> <span>Sudah Masuk Gaji</span></div>
          </div>
          <div className={styles.salaryCol}>
            <h4>Potongan (-)</h4>
            <div className={styles.salaryRow}><span>Denda Keterlambatan</span> <span>{formatIDR(data.deductions)}</span></div>
            <div className={styles.salaryRow}><span>Total Terlambat</span> <span>{data.total_late_mins} Menit</span></div>
          </div>
        </div>

        <div className={styles.netBox}>
          <span>TOTAL GAJI DITERIMA (NETO)</span>
          <strong>{formatIDR(data.net_salary)}</strong>
        </div>

        <div className={styles.footerSignature}>
          <div className={styles.sign}>
            <p>Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
            <div className={styles.signSpace}></div>
            <p>( ____________________ )</p>
            <p>HR Department</p>
          </div>
          <div className={styles.sign}>
            <p>Penerima,</p>
            <div className={styles.signSpace}></div>
            <p>( {data.user?.name} )</p>
          </div>
        </div>
      </div>
    </div>
  );
}