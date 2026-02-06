"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import styles from "./log.module.css";
import { FiActivity, FiSearch, FiCalendar, FiUser, FiBriefcase, FiX } from "react-icons/fi";

interface AuditLog {
  id: number;
  action: string;
  details: string;
  target: string | null;
  created_at: string;
  user: { name: string; role: string } | null;
  company: { name: string } | null;
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // --- LOGIKA FILTER FRONTEND (Double Check) ---
  // Memastikan hanya log yang mengandung kata kunci yang dirender
  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;

    const query = search.toLowerCase();
    return logs.filter((log) => {
      return (
        log.action.toLowerCase().includes(query) ||
        log.details.toLowerCase().includes(query) ||
        log.user?.name.toLowerCase().includes(query) ||
        log.user?.role.toLowerCase().includes(query) ||
        log.company?.name.toLowerCase().includes(query)
      );
    });
  }, [logs, search]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const endpoint = role === "superadmin" ? "system" : "me";
      
      const res = await fetch(`http://localhost:5000/api/audit/${endpoint}?search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const result = await res.json();
      if (result.success) {
        setLogs(result.data);
      }
    } catch (error) {
      console.error("Fetch logs error:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchLogs();
    }, 500); 
    return () => clearTimeout(delayDebounceFn);
  }, [fetchLogs]);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className={styles.highlight}>{part}</mark>
      ) : part
    );
  };

  const getBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('LOGOUT')) return styles.danger;
    if (act.includes('UPDATE') || act.includes('LOGIN')) return styles.warning;
    if (act.includes('CREATE') || act.includes('REGISTER')) return styles.success;
    return styles.info;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1><FiActivity /> System Audit Logs</h1>
          <p>
            {search 
              ? `Menampilkan ${filteredLogs.length} hasil untuk "${search}"` 
              : `Memantau jejak aktivitas ${localStorage.getItem("role") === "superadmin" ? "Global" : "Internal"}`}
          </p>
        </div>
        <div className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <FiSearch />
            <input 
              type="text" 
              placeholder="Cari aksi, user, atau role..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch("")}>
                <FiX />
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loaderArea}><div className={styles.spinner}></div></div>
      ) : (
        <div className={styles.timeline}>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <div key={log.id} className={styles.logCard}>
                <div className={styles.logSidebar}>
                  <FiCalendar />
                  <span className={styles.dateText}>
                    {new Date(log.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                  </span>
                  <span className={styles.timeText}>
                    {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className={styles.logContent}>
                  <div className={styles.logHeader}>
                    <span className={`${styles.badge} ${getBadgeClass(log.action)}`}>
                      {highlightText(log.action.replace('_', ' '), search)}
                    </span>
                    {log.company && (
                      <span className={styles.companyTag}>
                        <FiBriefcase /> {highlightText(log.company.name, search)}
                      </span>
                    )}
                  </div>
                  
                  <p className={styles.details}>{highlightText(log.details, search)}</p>
                  
                  <div className={styles.footer}>
                    <FiUser /> 
                    {/* Highlight juga bagian Role di sini */}
                    <strong>{highlightText(log.user?.name || "System", search)}</strong> 
                    <small>({highlightText(log.user?.role || "Automated", search)})</small>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noData}>
              <div className={styles.emptyIcon}>🔍</div>
              <p>Tidak ada hasil untuk <strong>"{search}"</strong></p>
              <button onClick={() => setSearch("")} className={styles.resetLink}>Hapus pencarian</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}