import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xiaomi Smarter Living — Media Event Virtual Experience",
  description:
    "A cinematic virtual walkthrough of the Xiaomi Smarter Living Media Event — explore every experience zone before the venue is built.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
