"use client";

import React, { useState, useEffect } from "react";
import styles from "./checkemail.module.css";
import { API_URL } from "../../../utils/api";
import Image from "next/image";
import logo from "../../../../public/logo.png";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckEmailPage() {
  // Gunakan state untuk menyimpan email agar aman dari hydration error
  const [email, setEmail] = useState<string | null>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedEmail = localStorage.getItem("resetEmail");
    if (!savedEmail) {
      router.push("/Auth/forgot");
    } else {
      setEmail(savedEmail);
    }
  }, [router]);

  const handleResend = async () => {
    if (!email) return setMessage("Email not found. Please try again.");

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Email resent successfully! Please check your inbox.");
      } else {
        setMessage(data.message || "Failed to resend email.");
      }
    } catch (err) {
      setMessage("Server error. Please try again later.");
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
          <h2>Check Your Email</h2>
          <p className={styles.subtext}>
            We’ve sent a password reset link to <strong>{email || "your email"}</strong>. 
            Please check your inbox.
          </p>

          {message && (
            <div className={message.includes("successfully") ? styles.successText : styles.errorText}>
              {message}
            </div>
          )}

          <button
            className={styles.btn}
            onClick={() => window.open("https://mail.google.com", "_blank")}
          >
            Open Gmail
          </button>

          <div className={styles.footerText}>
            <p>Didn’t receive the email?</p>
            {/* Menggunakan button lebih baik untuk aksesibilitas daripada span */}
            <button 
              className={loading ? styles.disabledLink : styles.resendBtn} 
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? "Sending..." : "Click here to resend"}
            </button>
          </div>

          <div className={styles.footerText}>
            <Link href="/Auth/login" className={styles.back}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}