"use client";

import React, { useState, useEffect } from "react";
import styles from "./login.module.css";
import { useRouter } from "next/navigation";
import { API_URL } from "../../../utils/api";
import Image from "next/image";
import Link from "next/link";

// Import Aset Ikon & Logo
import logo from "../../../../public/logo.png";
import eyeHideIcon from "../../../../public/clarity_eye-hide-solid.png"; 
import eyeShowIcon from "../../../../public/clarity_eye-show-solid.png"; 

// Google Auth
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load email jika "Remember Me" dicentang sebelumnya
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  const onLoginSuccess = (data: any) => {
    // 1. Simpan Data ke LocalStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("name", data.user.name);
    localStorage.setItem("companyId", data.user.companyId || ""); 
    localStorage.setItem("subscriptionStatus", data.user.isExpired ? "EXPIRED" : "ACTIVE");

    if (remember) {
      localStorage.setItem("rememberEmail", email);
    } else {
      localStorage.removeItem("rememberEmail");
    }

    setMessage("Login berhasil! Mengalihkan...");

    // 2. Redirect Berdasarkan Role
    const role = data.user.role?.toLowerCase();
    const roleRedirectMap: Record<string, string> = {
      employee: "/dashboard/employee",
      admin: "/dashboard/admin",
      superadmin: "/dashboard/superadmin",
    };

    setTimeout(() => {
      router.push(roleRedirectMap[role] || "/dashboard");
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data);
      } else {
        setMessage(data.message || "Email atau password salah.");
      }
    } catch (err) {
      setMessage("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse: any) => {
    setLoading(true);
    try {
      const backendRes = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }), 
      });

      const data = await backendRes.json();
      if (backendRes.ok) {
        onLoginSuccess(data);
      } else {
        setMessage(data.message || "Akun Google tidak terdaftar.");
      }
    } catch (err) {
      setMessage("Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId="269697838048-f02mcfcojl71hfmlgekfsmbdupdlmo7d.apps.googleusercontent.com">
      <div className={styles.wrapper}>
        <div className={styles.right}>
          <Image src={logo} alt="HRIS Logo" className={styles.logo} priority />
        </div>

        <div className={styles.left}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formHeaderTitle}>Sign In</h2>
              <p className={styles.formHeaderSubtitle}>Welcome back to HRIS cmlabs!</p>
            </div>
            
            {message && (
                <div className={`${styles.messageBox} ${message.includes('berhasil') ? styles.success : styles.error}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleLogin} className={styles.form}>
              <label className={styles.labelField}>Email Address</label>
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label className={styles.labelField}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {/* Perbaikan Ikon Show/Hide Password */}
                <button 
                  type="button" 
                  className={styles.toggle} 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <Image 
                    src={showPassword ? eyeShowIcon : eyeHideIcon} 
                    alt="Toggle Password" 
                    width={20} 
                    height={20} 
                  />
                </button>
              </div>

              <div className={styles.optionsRow}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)} 
                />
                <span>Remember Me</span>
              </label>
              <Link href="/Auth/forgot" className={styles.link}>
                Forgot Password?
              </Link>
            </div>

              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? "SIGNING IN..." : "SIGN IN"}
              </button>

              <div className={styles.divider}>
                <span>or</span>
              </div>

              <div className={styles.googleWrapper}>
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => setMessage("Login Google Gagal")}
                  useOneTap
                  theme="filled_blue"
                  width="100%"
                />
              </div>
            </form>

            <p className={styles.footerText}>
              Don’t have an account yet?{" "}
              <Link href="/Auth/register" className={styles.link}>Sign up here</Link>
            </p>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}