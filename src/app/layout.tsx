import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CoachOS — Fitness Coaching Platform",
  description: "Professionelle Coaching-Plattform für Fitness & Bodybuilding",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full bg-[#0a0f1a] text-[#f0f4ff] antialiased">
        {children}
      </body>
    </html>
  );
}
