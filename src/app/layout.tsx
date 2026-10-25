import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { SCHOOL_DETAILS } from '@/lib/supabase';
import { 
  GraduationCap, 
  LayoutDashboard, 
  ReceiptIndianRupee, 
  ScanLine, 
  PhoneCall, 
  MapPin, 
  School
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'SJM Senior Secondary School — ERP & Fee Management',
  description: 'Rural School Management, Smart Fee Collection with Thermal Receipts, and AI Register Scanner for SJM Senior Secondary School, Guruwali, Amritsar (PSEB)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased">
        {/* Top Announcement Bar */}
        <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 no-print flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 font-medium text-amber-400">
              <School className="w-3.5 h-3.5" />
              {SCHOOL_DETAILS.board}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-red-400" />
              {SCHOOL_DETAILS.address}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href={`tel:${SCHOOL_DETAILS.contact}`} 
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span>Helpline: <strong className="text-white">{SCHOOL_DETAILS.contact}</strong></span>
            </a>
          </div>
        </div>

        {/* Main Header / Navigation */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm no-print">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Brand Logo & Name */}
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
                    {SCHOOL_DETAILS.name}
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Rural School ERP & Fee Portal
                  </p>
                </div>
              </Link>

              {/* Navigation Tabs */}
              <nav className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-600" />
                  <span className="hidden md:inline">Dashboard</span>
                </Link>

                <Link
                  href="/fees"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <ReceiptIndianRupee className="w-4 h-4 text-emerald-600" />
                  <span>Fee Collection</span>
                </Link>

                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200"
                >
                  <ScanLine className="w-4 h-4 text-purple-600" />
                  <span className="font-bold">AI Scanner</span>
                  <span className="bg-purple-600 text-white text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide hidden sm:inline">
                    Gemini
                  </span>
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>© {new Date().getFullYear()} {SCHOOL_DETAILS.name}. PSEB Rural School Management System.</span>
            <span className="text-slate-400">Guruwali, Amritsar • Ph: {SCHOOL_DETAILS.contact}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
