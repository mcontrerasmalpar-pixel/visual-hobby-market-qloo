import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Visual Hobby Market // Qloo Cozy Indie Market",
  description:
    "Transform passive visual inspiration (Pinterest boards, screenshots) into active lifestyle hobbies powered by Qloo Taste AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[#BAE6FD] selection:text-[#4A3531]">
        {children}
      </body>
    </html>
  );
}
