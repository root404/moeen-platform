import './globals.css';
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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