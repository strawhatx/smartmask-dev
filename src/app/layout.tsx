import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartMask - Remove Image Background | Free & Automatic",
  description: "Remove image backgrounds automatically and get transparent PNGs in seconds. Free background removal tool powered by AI.",
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

