'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionStatus, getNoteBySession, finalizeSession } from '@/lib/api';
import DevignerBadge from '@/components/DevignerBadge';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Radio,
  Cpu,
  Flame,
  HelpCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  FileText,
} from 'lucide-react';

/**
 * ProcessingPipeline Component
 * 
 * Provides an Apple/Linear-grade step-by-step live progress experience
 * while AI generates the Markdown note, exam tips, quiz questions, and flashcards.
 * 
 * Designed with a spacious vertical hierarchy so Persian text NEVER wraps into narrow columns.
 * Zero font-mono on Persian text to avoid disconnected cursive letter glitches.
 */
export default function ProcessingPipeline({
  sessionId,
  courseId,
  initialStatus,
  onCompleted,
}) {
  const [status, setStatus] = useState(initialStatus || null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [checking, setChecking] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [activityLogs, setActivityLogs] = useState([
    {
      time: '00:00',
      text: 'درخواست پردازش و نهایی‌سازی به سرور NoteAi ارسال شد.',
      level: 'info',
    },
  ]);

  const pollTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);
  const completedFiredRef = useRef(false);

  // Timer for elapsed time
  useEffect(() => {
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  const addLog = useCallback((text, level = 'info') => {
    setActivityLogs((prev) => {
      if (prev.some((item) => item.text === text)) return prev;
      const min = Math.floor(elapsedSeconds / 60);
      const sec = elapsedSeconds % 60;
      const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      return [...prev, { time: timeStr, text, level }];
    });
  }, [elapsedSeconds]);

  const checkStatus = useCallback(async () => {
    if (!sessionId || isCompleted || completedFiredRef.current) return;
    setChecking(true);
    setErrorMsg('');

    try {
      // 1. ONLY query the session status endpoint. Never poll notes/by-session when has_note is false!
      const statusData = await getSessionStatus(sessionId);
      setStatus(statusData);

      // Check for failure
      if (statusData?.status === 'FAILED') {
        setIsFailed(true);
        addLog('خطایی در پردازش صوت در سمت سرور گزارش شد.', 'error');
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
        return;
      }

      // Track milestones in activity logs
      const chunksTotal = statusData?.chunks_total || statusData?.chunks?.length || 1;
      const chunksTranscribed = statusData?.chunks_transcribed || 0;

      if (chunksTranscribed > 0) {
        addLog(`رونویسی گفتار به متن Whisper: ${chunksTranscribed} از ${chunksTotal} تکه پیاده‌سازی شد.`);
      }

      if (chunksTranscribed >= chunksTotal && !statusData?.has_note) {
        addLog('رونویسی صوت‌ها به پایان رسید؛ پایپلاین Map-Reduce در حال تدوین جزوه ساختاریافته است.');
      }

      if (statusData?.has_note) {
        addLog('جزوه نهایی مارک‌داون با فرمول‌ها و مباحث تحلیلی با موفقیت ثبت شد.');
      }

      // 2. Only when `has_note === true` or status is `COMPLETED`, fetch the note safely
      if (statusData?.has_note === true || statusData?.status === 'COMPLETED') {
        addLog('استخراج سوالات کوئیز و فلش‌کارت‌ها تکمیل شد. آماده بارگذاری.');
        setIsCompleted(true);
        completedFiredRef.current = true;

        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);

        // Fetch the generated note (guaranteed 200 OK!)
        try {
          const completedNote = await getNoteBySession(sessionId);
          if (onCompleted) {
            onCompleted(completedNote);
          }
        } catch {
          if (onCompleted) {
            onCompleted(null);
          }
        }
      }
    } catch (err) {
      const msg = err?.message || 'ارتباط با سرور برای لحظاتی قطع شد؛ در حال تلاش مجدد...';
      setErrorMsg(msg);
    } finally {
      setChecking(false);
    }
  }, [sessionId, isCompleted, onCompleted, addLog]);

  // Polling interval (every 3 seconds)
  useEffect(() => {
    checkStatus();

    pollTimerRef.current = setInterval(() => {
      checkStatus();
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkStatus]);

  // Handle retry if failed
  const handleRetry = async () => {
    if (!sessionId) return;
    setRetrying(true);
    setIsFailed(false);
    setErrorMsg('');
    addLog('تلاش مجدد برای پردازش و نهایی‌سازی جلسه آغاز شد.');

    try {
      await finalizeSession(sessionId);
      pollTimerRef.current = setInterval(() => {
        checkStatus();
      }, 3000);
      checkStatus();
    } catch (err) {
      setIsFailed(true);
      setErrorMsg(err?.message || 'خطا در اجرای مجدد پردازش');
    } finally {
      setRetrying(false);
    }
  };

  // Metrics calculation
  const chunksTotal = status?.chunks_total || status?.chunks?.length || 1;
  const chunksTranscribed = status?.chunks_transcribed || 0;
  const sttDone = chunksTotal > 0 && chunksTranscribed >= chunksTotal;
  const noteDone = Boolean(status?.has_note || isCompleted);
  const quizDone = Boolean(status?.has_quiz || isCompleted);

  // Calculate realistic progress percentage
  let progressPercentage = 20;
  if (sttDone) {
    progressPercentage = 55;
  } else if (chunksTotal > 0) {
    progressPercentage = 20 + Math.round((chunksTranscribed / chunksTotal) * 35);
  }
  if (noteDone) {
    progressPercentage = 85;
  }
  if (quizDone || isCompleted) {
    progressPercentage = 100;
  }

  // 4 Standard Stages with rich sub-state
  const stages = [
    {
      id: 1,
      title: '۱. ثبت و تجمیع صوت زنگ کلاسی',
      desc: `${chunksTotal} تکه صوتی کلاسی در فضای ابری ثبت شد.`,
      icon: Radio,
      done: true,
      active: false,
    },
    {
      id: 2,
      title: '۲. تبدیل گفتار به متن (Whisper Speech-to-Text)',
      desc: sttDone
        ? `هر ${chunksTotal} تکه صوتی با دقت بالا رونویسی شدند.`
        : `در حال استخراج دقیق متن گفتگوهای کلاس... (${chunksTranscribed} از ${chunksTotal} تکه)`,
      icon: Cpu,
      done: sttDone,
      active: !sttDone && !isFailed,
    },
    {
      id: 3,
      title: '۳. پایپلاین Map-Reduce و تدوین جزوه استاندارد',
      desc: noteDone
        ? 'جزوه نهایی مارک‌داون با فرمول‌های LaTeX و جداول تحلیلی تدوین شد.'
        : sttDone
        ? 'هوش مصنوعی در حال حذف حواشی، ساختاربندی علمی، فرمول‌ها و نگارش خلاصه است...'
        : 'در صف پردازش پس از رونویسی صوت...',
      icon: Sparkles,
      done: noteDone,
      active: sttDone && !noteDone && !isFailed,
    },
    {
      id: 4,
      title: '۴. استخراج نکات امتحانی و آزمون ۴ گزینه‌ای و فلش‌کارت',
      desc: quizDone
        ? 'نکات تاکیدی استاد، ۵ سوال تستی سنجش یادگیری و فلش‌کارت‌ها آماده شدند.'
        : noteDone
        ? 'در حال استخراج نکات امتحانی تاکیدشده توسط استاد و طراحی آزمون...'
        : 'در صف تحلیل پس از تدوین جزوه...',
      icon: Flame,
      done: quizDone,
      active: noteDone && !quizDone && !isFailed,
    },
  ];

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) {
      return `${m} دقیقه و ${s} ثانیه`;
    }
    return `${s} ثانیه`;
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-7 md:p-8 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Top Animated Shimmering Gradient Accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 transition-all duration-500 ${
          isFailed
            ? 'bg-rose-500'
            : isCompleted
            ? 'bg-emerald-500'
            : 'bg-gradient-to-r from-primary-500 via-purple-600 to-pink-500 animate-pulse'
        }`}
      />

      {/* ── ROW 1: Dedicated Top Utility Bar (Pills & Timers) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
        {/* Right Status Pill */}
        <div className="flex items-center gap-2">
          {isFailed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 border border-rose-200 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>خطا در پردازش</span>
            </span>
          ) : isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>پردازش با موفقیت تکمیل شد</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 border border-purple-200 text-purple-700">
              <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
              <span>پردازش زنده هوش مصنوعی</span>
            </span>
          )}
        </div>

        {/* Left Timer & Manual Refresh */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>زمان سپری‌شده: {formatElapsed(elapsedSeconds)}</span>
          </div>

          {!isCompleted && !isFailed && (
            <button
              type="button"
              onClick={checkStatus}
              disabled={checking}
              title="بررسی دستی وضعیت"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-primary-600' : ''}`} />
              <span className="hidden sm:inline">{checking ? 'در حال بررسی...' : 'بررسی مجدد'}</span>
            </button>
          )}

          {isFailed && (
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'تلاش مجدد...' : 'تلاش مجدد'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── ROW 2: Spacious Hero Header (Full Width — Never Narrowly Wrapped!) ── */}
      <div className="flex items-start gap-4 py-5 border-b border-gray-100">
        {/* Big AI Icon */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
            isFailed
              ? 'bg-rose-50 border border-rose-200 text-rose-600'
              : isCompleted
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
              : 'bg-gradient-to-br from-primary-50 to-purple-50 border border-primary-200/90 text-primary-600'
          }`}
        >
          {isFailed ? (
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          ) : (
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          )}
        </div>

        {/* Title & Description with 100% available width */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-snug">
            {isFailed
              ? 'خطا در پردازش صوت و تولید جزوه'
              : isCompleted
              ? 'جزوه ساختاریافته و آزمون کلاسی آماده شد!'
              : 'هوش مصنوعی در حال تولید جزوه و آزمون کلاسی است...'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
            {isFailed
              ? 'پردازش صوت به دلیل خطای سرور با وقفه مواجه شد. می‌توانید با دکمه تلاش مجدد، پردازش را از سر بگیرید.'
              : isCompleted
              ? 'تمامی مراحل با موفقیت به پایان رسید و جزوه با فرمول‌های علمی و آزمون تستی آماده مطالعه است.'
              : 'سیستم به صورت خودکار گام‌های رونویسی و نگارش جزوه را انجام می‌دهد؛ نیازی به رفرش صفحه ندارید.'}
          </p>
        </div>
      </div>

      {/* ── ROW 3: Progress Bar & Percentage ── */}
      <div className="py-5">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-gray-700">میزان پیشرفت پایپلاین هوش مصنوعی</span>
          <span className="text-primary-700 bg-primary-50 border border-primary-200/60 px-2.5 py-0.5 rounded-lg text-xs font-bold">
            {progressPercentage}٪
          </span>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden p-0.5 border border-gray-200/70">
          <div
            className={`h-full rounded-full transition-all duration-700 relative overflow-hidden ${
              isFailed
                ? 'bg-rose-500'
                : isCompleted
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-primary-500 via-purple-600 to-emerald-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          >
            {!isCompleted && !isFailed && (
              <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] -skew-x-12" />
            )}
          </div>
        </div>

        {!isCompleted && !isFailed && (
          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-ping" />
            <span>مدت زمان تخمینی معمولاً بین ۳۰ الی ۶۰ ثانیه بسته به حجم درس است.</span>
          </p>
        )}
      </div>

      {/* ── ROW 4: Stepper Stages (4 Clean Horizontal Cards) ── */}
      <div className="space-y-3 pb-5">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              className={`flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl transition-all duration-300 ${
                stage.done
                  ? 'bg-emerald-50/40 border border-emerald-100/90'
                  : stage.active
                  ? 'bg-primary-50/70 border border-primary-200 shadow-2xs ring-1 ring-primary-100'
                  : 'bg-gray-50/50 border border-gray-100 opacity-60'
              }`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  stage.done
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : stage.active
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stage.done ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : stage.active ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">{stage.title}</h4>
                  {stage.active && (
                    <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full animate-pulse">
                      در حال پردازش...
                    </span>
                  )}
                  {stage.done && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      تکمیل شد
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Soft Error Message Banner */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── ROW 5: Live Activity Feed (Expandable Drawer) ── */}
      <div className="border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 hover:text-gray-800 py-1 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ListOrdered className="w-3.5 h-3.5 text-primary-600" />
            <span>مشاهده گزارش رخدادهای لحظه‌ای ({activityLogs.length} رویداد)</span>
          </div>
          {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLogs && (
          <div className="mt-3 bg-gray-900 text-gray-200 rounded-2xl p-4 text-[11px] space-y-2 max-h-48 overflow-y-auto">
            {activityLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="font-mono text-gray-500 select-none text-[10px] pt-0.5">[{log.time}]</span>
                <span
                  className={
                    log.level === 'error'
                      ? 'text-rose-400 font-semibold'
                      : log.level === 'warn'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ROW 6: Bottom Completion Celebration Card ── */}
      {isCompleted && (
        <div className="mt-5 pt-4 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تمام مراحل ساخت جزوه، نکات امتحانی و کوئیز تستی با موفقیت به پایان رسید.</span>
          </div>

          <button
            type="button"
            onClick={() => onCompleted && onCompleted()}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-xs cursor-pointer shrink-0"
          >
            <span>مشاهده جزوه و شروع مطالعه</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}
    </div>
  );
}
