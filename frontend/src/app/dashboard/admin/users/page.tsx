"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// Tambahkan FiEye untuk tombol Lihat Detail
import { FiArrowLeft, FiSearch, FiFilter, FiTrash2, FiEdit, FiUserCheck, FiBriefcase, FiPlus, FiEye } from "react-icons/fi";
import styles from "./users.module.css";
import Swal from "sweetalert2";

interface Position {
  id: number;
  positionName: string;
  _count?: { users: number };
}

interface User {
  id: number;
  name: string;
  email: string;
  employeeId: string;
  role: "superadmin" | "admin" | "employee";
  status: "Active" | "Inactive";
  profile_image: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder_name: string | null;
  position: { positionName: string } | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const IMAGE_BASE_URL = "http://localhost:5000/public/profiles/";

function UserManagementContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleFilter = searchParams.get("role");

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/Auth/login");

    setLoading(true);
    try {
      const [resUsers, resPos] = await Promise.all([
        fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/positions/summary`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const userData = await resUsers.json();
      const posData = await resPos.json();
      
      if (userData.success) {
        let filtered = userData.data;
        if (roleFilter) {
          filtered = filtered.filter((u: User) => u.role.toLowerCase() === roleFilter.toLowerCase());
        }
        setUsers(filtered);
      }

      if (posData.success) {
        setPositions(posData.data);
      }
    } catch (err) {
      Swal.fire("Error", "Gagal menyambungkan ke server", "error");
    } finally {
      setLoading(false);
    }
  }, [roleFilter, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Hapus Pengguna?',
      text: `Data ${name} akan dinonaktifkan (Soft Delete).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Nonaktifkan!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        // Sesuai rute backend: /users/delete/:id
        const res = await fetch(`${API_BASE}/users/delete/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          Swal.fire('Berhasil!', 'Karyawan telah dinonaktifkan', 'success');
          fetchData();
        }
      } catch (err) {
        Swal.fire('Error', 'Gagal memproses permintaan', 'error');
      }
    }
  };

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Sinkronisasi Data Karyawan...</p>
    </div>
  );

  return (
    <div className={styles.container}>
      <header className={styles.header}>
         <div className={styles.headerLeft}>
           <button onClick={() => router.push('/dashboard/admin')} className={styles.backBtn}>
             <FiArrowLeft /> Dashboard
           </button>
           <h1 className={styles.title}>Employee Management</h1>
         </div>
         <div className={styles.headerActions}>
            <button onClick={() => router.push('/dashboard/admin/positions')} className={styles.posBtn}>
             <FiBriefcase /> Jabatan
            </button>
            <button onClick={() => router.push('/dashboard/admin/users/create')} className={styles.addBtn}>
             <FiPlus /> Tambah Karyawan
            </button>
         </div>
      </header>

      <div className={styles.positionGrid}>
        {positions.slice(0, 4).map((pos, idx) => (
          <div key={pos.id} className={`${styles.posCard} ${styles[`cardColor${idx}`]}`}>
            <div className={styles.posIcon}><FiUserCheck /></div>
            <div className={styles.posInfo}>
              <span className={styles.posLabel}>{pos.positionName}</span>
              <h3 className={styles.posCount}>{pos._count?.users || 0} Orang</h3>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actionBar}>
        <div className={styles.searchWrapper}>
          <FiSearch className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Cari Nama, NIK, atau Email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterInfo}>
          <FiFilter /> 
          <span>Total: <strong>{filteredUsers.length}</strong> Karyawan</span>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.userTable}>
            <thead>
              <tr>
                <th>Karyawan</th>
                <th>Jabatan & Role</th>
                <th>Email & Rekening</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className={styles.userCell}>
                      <img 
                        className={styles.avatarImg}
                        src={user.profile_image 
                          ? `${IMAGE_BASE_URL}${user.profile_image}?t=${new Date().getTime()}` 
                          : `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                        alt={user.name} 
                      />
                      <div className={styles.nameGroup}>
                        <span className={styles.userName}>{user.name}</span>
                        <span className={styles.userEmail}>{user.employeeId || "No NIK"}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.roleGroup}>
                      <span className={styles.positionText}>{user.position?.positionName || "-"}</span>
                      <span className={`${styles.roleBadge} ${styles[user.role.toLowerCase()]}`}>{user.role}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.bankCell}>
                      <div className={styles.bankName}>{user.email}</div>
                      <div className={styles.bankAccount}>{user.bank_name || 'Bank'}: {user.bank_account || '-'}</div>
                    </div>
                  </td>
                  <td>
                    <span className={user.status === 'Active' ? styles.statusActive : styles.statusInactive}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      {/* TOMBOL BARU: VIEW DETAIL */}
                      <button 
                        className={styles.viewBtn} 
                        onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                        title="Lihat Profil Lengkap"
                      >
                        <FiEye />
                      </button>

                      <button className={styles.editBtn} onClick={() => router.push(`/dashboard/admin/users/edit/${user.id}`)}>
                        <FiEdit />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(user.id, user.name)}>
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
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<div className={styles.loadingContainer}>Loading Data...</div>}>
      <UserManagementContent />
    </Suspense>
  );
}