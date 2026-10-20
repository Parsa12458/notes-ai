'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getCourses, getCurrentBell } from '@/lib/api';
import DevignerBadge from '@/components/DevignerBadge';
import {
  Mic,
  Archive,
  Sparkles,
  BookOpen,
  Bell,
  Cpu,
  ChevronLeft,
  Loader2,
  FileText,
  HelpCircle,
  Layers,
  GraduationCap,
} from 'lucide-react';

export default function HomePage() {
  const [courses, setCourses] = useState([]);
  const [currentBell, setCurrentBell] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCourses().catch(() => []),
      getCurrentBell().catch(() => null),
    ])
      .then(([coursesData, bellData]) => {
        setCourses(coursesData || []);
        if (bellData && bellData.detected) {
          setCurrentBell(bellData);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className="pt-16 pb-16 min-h-dvh">
        {/* Glow Background Gradient (Apple Style) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(55%_65%_at_50%_0%,rgba(124,58,237,0.12),transparent_75%)]"
        />

        {/* Hero Section */}
        <section className="relative px-4 pt-10 pb-8 text-center max-w-2xl mx-auto page-transition">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-700 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>صدای کلاس، به جزوه تبدیل می‌شود</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">
            کلاس‌هات رو
            <br />
            به{' '}
            <span className="relative inline-block text-primary-600 px-2">
              جزوه
              <span
                className="absolute inset-x-0 bottom-1 h-3 bg-primary-100/70 -z-10 rounded-md transform -rotate-1"
                aria-hidden="true"
              />
            </span>{' '}
            تبدیل کن!
          </h1>

          <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-md mx-auto mb-8 font-normal">
            کافی‌ست کلاس رو ضبط کنی، بقیه رو به هوش مصنوعی بسپار.
          </p>

          {/* Current Bell Banner / Skeleton */}
          {loading ? (
            <div className="mb-8 p-4 rounded-2xl bg-white/70 border border-gray-200/60 shadow-2xs text-right flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100" />
                <div className="space-y-2">
                  <div className="w-24 h-3 bg-gray-200 rounded" />
                  <div className="w-40 h-4 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="w-20 h-7 bg-gray-100 rounded-xl" />
            </div>
          ) : currentBell && currentBell.detected ? (
            <div className="mb-8 p-4 rounded-2xl bg-white border border-primary-200/90 shadow-sm text-right flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary-700">زنگ جاری مدرسه</span>
                    <DevignerBadge variant="purple" size="sm">
                      هم‌اکنون
                    </DevignerBadge>
                  </div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">
                    {currentBell.course_name} ({currentBell.classroom})
                  </div>
                </div>
              </div>
              <Link
                href="/record"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-xl border border-primary-200 shrink-0"
              >
                <span>شروع ضبط</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : null}

          {/* Two Main Sections (ضبط کلاس & آرشیو جلسات) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
            {/* Record Card */}
            <Link
              href="/record"
              className="group relative bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-7 hover:border-primary-400 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                  <Mic className="w-6 h-6" />
                </div>
                <DevignerBadge variant="rose" size="sm" dot>
                  ضبط صدا
                </DevignerBadge>
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-1.5">
                ضبط کلاس درس
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-4">
                صدای زنگ کلاس را ضبط یا فایل صوتی را آپلود کنید تا در پایان جزوه آماده شود.
              </p>

              <div className="flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:translate-x-[-2px] transition-transform">
                <span>ورود به بخش ضبط</span>
                <ChevronLeft className="w-4 h-4" />
              </div>
            </Link>

            {/* Archive Card */}
            <Link
              href="/archive"
              className="group relative bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-7 hover:border-primary-400 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform">
                  <Archive className="w-6 h-6" />
                </div>
                <DevignerBadge variant="purple" size="sm" count={courses.length}>
                  کتابخانه
                </DevignerBadge>
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-1.5">
                آرشیو جلسات و جزوه‌ها
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-4">
                مشاهده جزوات کامل مارکداون، نکات امتحانی، کوییزهای ۴ گزینه‌ای و چت هوشمند.
              </p>

              <div className="flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:translate-x-[-2px] transition-transform">
                <span>مشاهده {courses.length > 0 ? `${courses.length} درس` : 'دروس'}</span>
                <ChevronLeft className="w-4 h-4" />
              </div>
            </Link>
          </div>

          {/* AI Features Highlight (Apple Grid Style) */}
          <div className="mt-12 text-right">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-center">
              ویژگی‌های هوشمند پلتفرم
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/70 text-center shadow-2xs">
                <FileText className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-gray-900 mb-0.5">جزوه مارکداون</h4>
                <p className="text-[10px] text-gray-400">فرمول‌های LaTeX و جداول</p>
              </div>

              <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/70 text-center shadow-2xs">
                <Sparkles className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-gray-900 mb-0.5">نکات امتحانی</h4>
                <p className="text-[10px] text-gray-400">شکار تأکیدات معلم</p>
              </div>

              <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/70 text-center shadow-2xs">
                <HelpCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-gray-900 mb-0.5">آزمون تستی</h4>
                <p className="text-[10px] text-gray-400">تصحیح آنلاین و کارنامه</p>
              </div>

              <div className="bg-white/80 p-4 rounded-2xl border border-gray-200/70 text-center shadow-2xs">
                <Cpu className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-gray-900 mb-0.5">دستیار درس RAG</h4>
                <p className="text-[10px] text-gray-400">مشابه NotebookLM</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

