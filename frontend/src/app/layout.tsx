import "./globals.css";
import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast"; //

export const metadata = {
  title: "HRIS System",
  description: "Human Resource Information System App",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true}>
        {/* Toaster diletakkan di sini agar bisa diakses seluruh halaman */}
        <Toaster 
          position="top-right" 
          reverseOrder={false} 
          toastOptions={{
            duration: 3000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}