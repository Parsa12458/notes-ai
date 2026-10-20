'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { getCourses, getSessions } from '@/lib/api';
import DevignerBadge from '@/components/DevignerBadge';
import {
  ArrowRight,
  Calendar,
  FileText,
  HelpCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Mic,
  ChevronLeft,
  RefreshCw,
} from 'lucide-react';

export default function CourseSessionsPage() {
  const params = useParams();
  const courseId = Number(params.courseId);
  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollIntervalRef = useRef(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [coursesData, sessionsData] = await Promise.all([
        getCourses().catch(() => []),
        getSessions(courseId).catch(() => []),
      ]);

      setCourse((coursesData || []).find((c) => c.id === courseId) || null);
      setSessions(sessionsData || []);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-poll if any session is in PROCESSING or RECORDING
  useEffect(() => {
    const hasActiveSession = sessions.some(
      (s) => s.status === 'PROCESSING' || s.status === 'RECORDING' || s.status === 'PENDING'
    );

    if (hasActiveSession) {
      pollIntervalRef.current = setInterval(() => {
        loadData(true);
      }, 5000);
    } else {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [sessions, loadData]);

  const getStatusBadge = (status, statusDisplay) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <DevignerBadge variant="emerald" size="sm" dot>
            {statusDisplay || 'پایان یافته'}
          </DevignerBadge>
        );
      case 'PROCESSING':
        return (
          <DevignerBadge variant="purple" size="sm" dot>
            {statusDisplay || 'در حال پردازش...'}
          </DevignerBadge>
        );
      case 'RECORDING':
        return (
          <DevignerBadge variant="rose" size="sm" dot>
            {statusDisplay || 'در حال ضبط'}
          </DevignerBadge>
        );
      default:
        return (
          <DevignerBadge variant="neutral" size="sm">
            {statusDisplay || 'ثبت شده'}
          </DevignerBadge>
        );
    }
  };

  return (
    <>
      <Header />
      <main className="pt-16 pb-12 min-h-dvh px-4 sm:px-6">
        <div className="max-w-2xl mx-auto pt-6 page-transition">
          {/* Breadcrumb */}
          <Link
            href="/archive"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-primary-600 transition-colors mb-6"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به لیست همه دروس</span>
          </Link>

          {/* Course Master Header */}
          {course && (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shrink-0 shadow-sm"
                  style={{ backgroundColor: course.color || '#7C3AED' }}
                >
                  {course.name ? course.name.charAt(0) : 'د'}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {course.name}
                    </h1>
                    {course.code && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono">
                        {course.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400">
                    {course.teacher_name ? `مدرس: ${course.teacher_name}` : 'مدرس: ثبت نشده'}
                    {course.classroom_name ? ` · کلاس: ${course.classroom_name}` : ''}
                  </p>
                </div>
              </div>

              <Link
                href="/record"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs shrink-0"
              >
                <Mic className="w-4 h-4" />
                <span>ضبط جلسه جدید</span>
              </Link>
            </div>
          )}

          {/* Sessions Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                جلسات ثبت‌شده این درس
              </h2>
              <DevignerBadge variant="purple" size="sm" count={sessions.length}>
                {sessions.length} جلسه
              </DevignerBadge>
            </div>

            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={refreshing}
              title="بروزرسانی وضعیت جلسات"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-600' : ''}`} />
              <span>{refreshing ? 'بروزرسانی...' : 'بروزرسانی وضعیت'}</span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-gray-100 p-5 shadow-2xs space-y-3 animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-48 h-4 bg-gray-200 rounded" />
                    <div className="w-20 h-5 bg-gray-100 rounded-full" />
                  </div>
                  <div className="w-32 h-3 bg-gray-100 rounded" />
                </div>
              ))}
              <div className="text-center py-4 text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                <span>در حال دریافت لیست جلسات...</span>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-sm">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-800">هنوز جلسه‌ای برای این درس ثبت نشده</h3>
              <p className="text-xs text-gray-400 mt-1">
                می‌توانید همین حالا صدای زنگ این کلاس را ضبط و جزوه دریافت کنید.
              </p>
              <Link
                href="/record"
                className="inline-flex items-center gap-2 mt-4 text-xs sm:text-sm font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl border border-primary-200 transition-colors"
              >
                <Mic className="w-4 h-4" />
                <span>شروع ضبط این کلاس</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const chunksCount = session.chunks_total || session.chunks_count || 0;
                const isProcessing = session.status === 'PROCESSING' || session.status === 'PENDING';

                return (
                  <Link
                    key={session.id}
                    href={`/archive/${courseId}/${session.id}`}
                    className={`group flex items-center gap-4 bg-white rounded-3xl border p-5 transition-all duration-300 ${
                      isProcessing
                        ? 'border-purple-200/90 bg-purple-50/10 hover:border-primary-400'
                        : 'border-gray-200/80 hover:border-primary-300 hover:shadow-md hover:shadow-primary/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                          {session.title}
                        </h3>
                        {getStatusBadge(session.status, session.status_display)}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                        {session.created_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(session.created_at).toLocaleDateString('fa-IR')}
                          </span>
                        )}
                        {chunksCount > 0 && (
                          <span>· {chunksCount} تکه صوتی</span>
                        )}
                      </div>

                      {/* Features badges available in this session */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {session.has_note ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                            <FileText className="w-3 h-3" /> جزوه مارکداون
                          </span>
                        ) : isProcessing ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200/60 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" /> در حال تولید هوشمند...
                          </span>
                        ) : null}

                        {session.has_quiz && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200/60">
                            <HelpCircle className="w-3 h-3" /> آزمون تستی
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200/60">
                          چت RAG
                        </span>
                      </div>
                    </div>

                    <div className="w-9 h-9 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors shrink-0">
                      <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

