import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Arabic fonts configuration
const cairoFont = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const tajawalFont = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "مُعين - منصة حفظ وتقييم القرآن الكريم",
  description: "منصة متقدمة لحفظ وتقييم القرآن الكريم بالذكاء الاصطناعي وتقييم التجويد",
  keywords: ["قرآن", "حفظ", "تجويد", "ذكاء اصطناعي", "مُعين", "قرآن كريم", "تعلم القرآن"],
  authors: [{ name: "فريق مُعين" }],
  creator: "مُعين",
  publisher: "مُعين",
  robots: "index, follow",
  openGraph: {
    title: "مُعين - منصة حفظ وتقييم القرآن الكريم",
    description: "منصة متقدمة لحفظ وتقييم القرآن الكريم بالذكاء الاصطناعي",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "مُعين - منصة حفظ وتقييم القرآن الكريم",
    description: "منصة متقدمة لحفظ وتقييم القرآن الكريم بالذكاء الاصطناعي",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${cairoFont.variable} ${tajawalFont.variable} font-cairo antialiased`}
        style={{
          fontFamily: 'var(--font-cairo), var(--font-tajawal), system-ui, -apple-system, sans-serif',
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}