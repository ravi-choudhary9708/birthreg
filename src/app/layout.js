import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Birth Certificate Portal — Madhubani District",
  description: "Apply online for birth certificates, track your application status, and download your certificate securely. Serving all hospitals and PHCs in Madhubani, Bihar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body style={{ minHeight: "100vh", background: "#ffffff" }}>
        {children}
      </body>
    </html>
  );
}
