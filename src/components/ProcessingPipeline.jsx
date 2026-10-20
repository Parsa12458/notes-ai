'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionStatus, getNoteBySession } from '@/lib/api';
import DevignerBadge from '@/components/DevignerBadge';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Mic,
  Cpu,
  Flame,
  HelpCircle,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';

/**
 * ProcessingPipeline Component
 * Provides real-time polling and rich visual feedback while AI generates notes,
 * tips, quizzes, and flashcards so the user NEVER needs to manually reload the page.
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
  const [error, setError] = useState('');
  const pollTimerRef = useRef(null);
  const elapsedTimerRef = useRef(null);

  // Elapsed time counter
  useEffect(() => {
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, []);

  const checkStatus = useCallback(async () => {
    if (!sessionId || isCompleted) return;
    setChecking(true);
    try {
      const [statusRes, noteRes] = await Promise.allSettled([
        getSessionStatus(sessionId),
        getNoteBySession(sessionId),
      ]);

      let newStatus = null;
      let newNote = null;

      if (statusRes.status === 'fulfilled') {
        newStatus = statusRes.value;
        setStatus(newStatus);
      }

      if (noteRes.status === 'fulfilled' && noteRes.value) {
        newNote = noteRes.value;
      }

      // Completion conditions:
      // 1. note is returned
      // 2. newStatus indicates COMPLETED or has_note === true
      const done =
        Boolean(newNote && newNote.id) ||
        newStatus?.has_note === true ||
        newStatus?.status === 'COMPLETED';

      if (done) {
        setIsCompleted(true);
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
        if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
        if (onCompleted) {
          onCompleted(newNote);
        }
      }
    } catch (err) {
      // Don't show hard error on transient network blip; keep polling
      console.warn('Poll status error:', err);
    } finally {
      setChecking(false);
    }
  }, [sessionId, isCompleted, onCompleted]);

  // Automatic polling interval (every 3.5 seconds)
  useEffect(() => {
    checkStatus();

    pollTimerRef.current = setInterval(() => {
      checkStatus();
    }, 3500);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkStatus]);

  const chunksTranscribed = status?.chunks_transcribed || 0;
  const chunksTotal = status?.chunks_total || status?.chunks?.length || 1;
  const sttDone = chunksTotal > 0 && chunksTranscribed >= chunksTotal;

  // Pipeline stages calculation
  const stages = [
    {
      id: 1,
      title: 'دریافت و تجمیع صوت زنگ کلاس',
      desc: `${chunksTotal} تکه صوتی در سیستم ثبت شد`,
      icon: Mic,
      done: true,
      active: false,
    },
    {
      id: 2,
      title: 'تبدیل گفتار به متن (Whisper STT)',
      desc: sttDone
        ? `هر ${chunksTotal} تکه با موفقیت پیاده‌سازی شدند`
        : `پیاده‌سازی ${chunksTranscribed} از ${chunksTotal} تکه صوتی...`,
      icon: Cpu,
      done: sttDone,
      active: !sttDone,
    },
    {
      id: 3,
      title: 'پایپلاین Map-Reduce و نگارش جزوه',
      desc: 'حذف حواشی، ساختاربندی علمی، فرمول‌های LaTeX و جداول',
      icon: Sparkles,
      done: isCompleted,
      active: sttDone && !isCompleted,
    },
    {
      id: 4,
      title: 'شکار نکات امتحانی، کوئیز تستی و فلش‌کارت',
      desc: 'استخراج تأکیدات استاد و تولید سوالات ۴ گزینه‌ای و مرور سریع',
      icon: Flame,
      done: isCompleted,
      active: isCompleted,
    },
  ];

  const formatElapsed = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m > 0 ? `${m} دقیقه و ` : ''}${s} ثانیه`;
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all duration-300">
      {/* Top Animated Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 via-purple-600 to-pink-500 animate-pulse" />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 border border-primary-200/80 flex items-center justify-center text-primary-600 shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            ) : (
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-gray-900">
                {isCompleted ? 'جزوه و آزمون کلاسی آماده شد!' : 'هوش مصنوعی در حال تولید جزوه و آزمون است...'}
              </h3>
              <DevignerBadge
                variant={isCompleted ? 'emerald' : 'purple'}
                size="sm"
                dot
              >
                {isCompleted ? 'تکمیل شد' : 'در حال پردازش زنده'}
              </DevignerBadge>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {isCompleted
                ? 'تمام مراحل پردازش با موفقیت به پایان رسید. در حال بارگذاری محتوا...'
                : 'لطفاً شکیبا باشید؛ سیستم به صورت خودکار داده‌ها را بروزرسانی می‌کند (نیازی به رفرش مرورگر ندارید).'}
            </p>
          </div>
        </div>

        {/* Live Timer & Manual Check Button */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>زمان سپری‌شده: {formatElapsed(elapsedSeconds)}</span>
          </div>

          <button
            type="button"
            onClick={checkStatus}
            disabled={checking || isCompleted}
            title="بررسی دستی مجدد وضعیت"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-primary-600' : ''}`} />
            <span>{checking ? 'در حال استعلام...' : 'بررسی مجدد'}</span>
          </button>
        </div>
      </div>

      {/* Stepper Stages */}
      <div className="py-6 space-y-4">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              className={`flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 ${
                stage.done
                  ? 'bg-emerald-50/50 border border-emerald-100/80'
                  : stage.active
                  ? 'bg-primary-50/70 border border-primary-200 shadow-xs'
                  : 'bg-gray-50/40 border border-gray-100 opacity-60'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  stage.done
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : stage.active
                    ? 'bg-primary-600 text-white animate-pulse'
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
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-gray-900">{stage.title}</h4>
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
                <p className="text-xs text-gray-500 mt-0.5">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer live status tip */}
      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>ارتباط با سرور ابری برقرار است. به محض اتمام پردازش، جزوه به صورت زنده نمایش داده می‌شود.</span>
        </div>

        {isCompleted && (
          <button
            type="button"
            onClick={() => onCompleted && onCompleted()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-xs"
          >
            <span>نمایش جزوه و سوالات</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>
    </div>
  );
}

