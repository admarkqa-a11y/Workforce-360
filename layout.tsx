import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workforce360 | NAJCO",
  description: "Workforce, Projects, Maintenance and manpower hours for NAJCO.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
