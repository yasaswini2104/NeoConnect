import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/lib/auth';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'NeoConnect — Staff Feedback Platform',
  description: 'Transparent, accountable staff feedback and complaint management.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="noise">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a26',
              color: '#e2e8f0',
              border: '1px solid #2a2a3d',
              fontFamily: 'DM Sans, sans-serif',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#1a1a26' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#1a1a26' } },
          }}
        />
      </body>
    </html>
  );
}
