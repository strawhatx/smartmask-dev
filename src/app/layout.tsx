import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Resizer - AI-Powered Image Resizing for Social Media",
  description: "Resize images for social media automatically. AI-powered image resizing for Instagram, Facebook, Twitter, TikTok and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

