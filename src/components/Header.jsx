'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Mic, Archive, Sparkles, FileText } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/record', label: 'ضبط کلاس', icon: Mic },
  { href: '/archive', label: 'آرشیو جلسات', icon: Archive },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 inset-x-0 z-50 glass border-b border-gray-200/60 transition-all duration-200">
      <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-500 flex items-center justify-center text-white shadow-sm shadow-primary-500/20 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
            <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-black text-gray-900 tracking-tight leading-none">
              Notes <span className="text-primary-600">AI</span>
            </span>
            <span className="text-[9px] text-gray-400 font-medium">جزوه هوشمند کلاسی</span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1 bg-gray-100/70 p-1 rounded-full border border-gray-200/60">
            <Link
              href="/"
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                pathname === '/'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              خانه
            </Link>
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

