// app/layout.js
export const dynamic = 'force-dynamic'
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/layout/Header";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata = {
  title: "Iona Language App",
  description: "English to Spanish A1 course with personalized learning by Iona Language App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <Header />
          <main className="page-wrapper">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}