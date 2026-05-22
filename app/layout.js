import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "TheRojak - Free Online Tools",
  description: "Free online tools for everyone. Compress images, generate QR codes, create strong passwords and more. No signup required.",
  keywords: "free online tools, image compressor, QR generator, password generator, free tools",
  openGraph: {
    title: "TheRojak - Free Online Tools",
    description: "Free online tools for everyone. No signup required.",
    url: "https://therojak.com",
    siteName: "TheRojak",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}