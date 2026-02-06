"use client";

import React, { useState } from "react";
import styles from "./register.module.css"; 
import Image from "next/image";
import logo from "../../../../public/logo.png";
import eyeHideIcon from "../../../../public/clarity_eye-hide-solid.png"; 
import eyeShowIcon from "../../../../public/clarity_eye-show-solid.png";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "", 
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      alert("Password dan Konfirmasi Password tidak cocok!");
      setLoading(false);
      return;
    }

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          email: formData.email,
          companyName: formData.companyName, 
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registrasi Berhasil! Silakan Login.");
        router.push("/Auth/login");
      } else {
        // Menangani array error dari express-validator atau string message biasa
        const errorMsg = data.errors ? data.errors[0].msg : data.message;
        alert(errorMsg || "Gagal mendaftar");
      }
    } catch (err) {
      console.error("Error saat register:", err);
      alert("Terjadi kesalahan koneksi ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.left}>
        <Image src={logo} alt="Logo" className={styles.logo} priority />
      </div>

      <div className={styles.right}>
        <div className={styles.formContainer}>
          <h2 className={styles.title}>Sign Up</h2>
          <p className={styles.subtitle}>Create your account and manage employees.</p>

          <form onSubmit={handleSubmit}>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.labelField}>First Name</label>
                <input 
                  type="text" 
                  name="firstName" 
                  className={styles.input} 
                  onChange={handleChange} 
                  value={formData.firstName}
                  required 
                />
              </div>
              <div className={styles.field}>
                <label className={styles.labelField}>Last Name</label>
                <input 
                  type="text" 
                  name="lastName" 
                  className={styles.input} 
                  onChange={handleChange} 
                  value={formData.lastName}
                  required 
                />
              </div>
            </div>

            <label className={styles.labelField}>Email Address</label>
            <input 
              type="email" 
              name="email" 
              className={styles.input} 
              onChange={handleChange} 
              value={formData.email}
              required 
            />

            <label className={styles.labelField}>Company Name</label>
            <input 
              type="text" 
              name="companyName" 
              className={styles.input} 
              onChange={handleChange} 
              value={formData.companyName}
              required 
            />

            <label className={styles.labelField}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className={styles.input}
                onChange={handleChange}
                value={formData.password}
                required
              />
              <span className={styles.toggle} onClick={() => setShowPassword(!showPassword)}>
                <Image src={showPassword ? eyeShowIcon : eyeHideIcon} alt="Toggle" width={20} height={20} />
              </span>
            </div>

            <label className={styles.labelField}>Confirm Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                className={styles.input}
                onChange={handleChange} // SEBELUMNYA TIDAK ADA
                value={formData.confirmPassword}
                required
              />
            </div>

            <div className={styles.checkboxRow}>
              <input type="checkbox" id="agree" required />
              <label htmlFor="agree">I agree to the terms of use</label>
            </div>

            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? "PROCESSING..." : "SIGN UP"}
            </button>
          </form>

          <p className={styles.footerText}>
            Already have an account? 
            <Link href="/Auth/login" className={styles.link}> Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}