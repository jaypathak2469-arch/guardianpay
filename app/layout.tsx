import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Devanagari, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-hi",
});
const tamil = Noto_Sans_Tamil({ subsets: ["tamil", "latin"], variable: "--font-ta" });

export const metadata: Metadata = {
  title: "GuardianPay — Fraud protection for vulnerable customers",
  description: "Hackathon prototype that intercepts social-engineering fraud during digital payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${noto.variable} ${devanagari.variable} ${tamil.variable} antialiased`}
        style={{ fontFamily: "var(--font-sans), var(--font-hi), var(--font-ta), ui-sans-serif, system-ui" }}
      >
        {children}
      </body>
    </html>
  );
}
