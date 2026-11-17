import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "WASPADAIN — Latihan Anti-Modus Penipuan Digital",
    template: "%s · WASPADAIN",
  },
  description:
    "Simulasi kejahatan siber multikanal untuk melatih kewaspadaan terhadap penipuan dan rekayasa sosial. Sandbox aman, data 100% sintetis.",
  applicationName: "WASPADAIN",
  authors: [{ name: "Muhammad Salman Alfarizi" }],
  keywords: [
    "simulasi phishing",
    "keamanan siber",
    "literasi digital",
    "penipuan online",
    "WASPADAIN",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF8EF",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            className: "font-sans",
          }}
        />
      </body>
    </html>
  );
}
