"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./set.module.css";
import { API_URL } from "../../../../utils/api";
import Image from "next/image";
import Link from "next/link";

import eyeHideIcon from "../../../../../public/clarity_eye-hide-solid.png";
import eyeShowIcon from "../../../../../public/clarity_eye-show-solid.png";

export default function SetNewPasswordPage() {
  const params = useParams();
  const token = params?.token; 
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password.length < 6) {
      return setMessage("Password must be at least 6 characters.");
    }

    if (password !== confirmPassword) {
      return setMessage("Passwords do not match.");
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password reset successful! Redirecting to login...");
        localStorage.removeItem("resetEmail");
        setTimeout(() => router.push("/Auth/login"), 2000);
      } else {
        setMessage(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.right}>
        <Image src="/logo.png" alt="HRIS Logo" width={300} height={300} className={styles.logo} priority />
      </div>

      <div className={styles.left}>
        <div className={styles.formContainer}>
          <h2 className={styles.title}>Set New Password</h2>
          <p className={styles.subtitle}>Please enter your new password below.</p>

          {message && (
            <div className={`${styles.messageBox} ${message.includes('successful') ? styles.success : styles.error}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleReset} className={styles.form}>
            <label className={styles.labelField}>New Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                className={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                className={styles.toggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {/* Menggunakan Image komponen untuk ikon */}
                <Image 
                  src={showPassword ? eyeShowIcon : eyeHideIcon} 
                  alt="Toggle Password" 
                  width={20} 
                  height={20} 
                />
              </button>
            </div>

            <label className={styles.labelField}>Confirm Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirm ? "text" : "password"}
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button 
                type="button"
                className={styles.toggle}
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {/* Menggunakan Image komponen untuk ikon */}
                <Image 
                  src={showConfirm ? eyeShowIcon : eyeHideIcon} 
                  alt="Toggle Confirm Password" 
                  width={20} 
                  height={20} 
                />
              </button>
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "SAVING..." : "RESET PASSWORD"}
            </button>
          </form>

          <p className={styles.footerText}>
            <Link href="/Auth/login" className={styles.link}>
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}