import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartMask Dev",
  description: "Image background remover with a smart mask",
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

