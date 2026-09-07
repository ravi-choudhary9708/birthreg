import { Inter } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import AccessibilityTopBar from "@/components/AccessibilityTopBar";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: "Birth Certificate Portal — Government of Bihar | Madhubani District",
  description: "Official Birth Certificate Portal initiated by the Government of Bihar for Madhubani District. Apply online, track status, and download certificates securely. Serving all hospitals and PHCs in Madhubani, Bihar.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={inter.className} suppressHydrationWarning>
      <body style={{ minHeight: "100vh", background: "#ffffff" }} suppressHydrationWarning>
        <AccessibilityTopBar />
        <SmoothScroll>
          <main id="main-section" tabIndex={-1} style={{ outline: "none" }}>
            {children}
          </main>
        </SmoothScroll>
      </body>
    </html>
  );
}
