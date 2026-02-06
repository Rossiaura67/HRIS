"use client";

import React, { useState } from "react";
import styles from "./forgot.module.css";
import { API_URL } from "../../../utils/api";
import Image from "next/image";
import logo from "../../../../public/logo.png";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); 
  const router = useRouter();

  const handleForgot = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Endpoint disesuaikan dengan backend: router.post("/forgot-password", ...)
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        // Simpan email untuk ditampilkan di halaman check-email sebagai konfirmasi
        localStorage.setItem("resetEmail", email);
        
        // Navigasi ke rute folder: app/Auth/check-email
        router.push("/Auth/check-email");
      } else {
        // Mengambil pesan error dari backend
        setMessage(data.message || "Failed to send reset link.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.right}>
        <Image src={logo} alt="HRIS Logo" className={styles.logo} priority />
      </div>
      <div className={styles.left}>
        <div className={styles.formContainer}>
          <h2>Forgot Password</h2>
          <p>Enter your email to reset your password.</p>

          {message && <div className={styles.errorText}>{message}</div>}

          <form onSubmit={handleForgot}>
            <label>Email</label>
            <input
              type="email" 
              name="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className={styles.btn} 
              disabled={loading} 
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className={styles.footerText}>
            Remember your password?{" "}
            <Link href="/Auth/login" className={styles.link}>
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}