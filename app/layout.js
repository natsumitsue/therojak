import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

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
  description: "Free online tools for everyone — compress images, generate QR codes, create strong passwords, convert images to PDF, generate invoices, track tasks, manage calendar events, check live gold price and MYR to USD exchange rate. Fast, free, no signup required.",
  keywords: "free online tools, image compressor, QR code generator, password generator, image to PDF, invoice generator, task tracker, calendar, gold price Malaysia, MYR USD exchange rate, free tools no signup",
  verification: {
    google: "votBtdZMXmhUhJYb_JM4Poj_SFsLYA778EGX2NRAXzw",
  },
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-4ML1DKDPTC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-4ML1DKDPTC');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
