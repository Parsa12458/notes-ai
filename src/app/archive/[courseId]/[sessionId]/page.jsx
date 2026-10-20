'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  getCourses,
  getSessions,
  getNoteBySession,
  getQuizzes,
  getFlashcards,
  getSessionStatus,
  getNoteDownloadUrl,
  getFullMediaUrl,
} from '@/lib/api';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import ExamTipsView from '@/components/ExamTipsView';
import QuizView from '@/components/QuizView';
import FlashcardsView from '@/components/FlashcardsView';
import RagChatView from '@/components/RagChatView';
import AudioChunksView from '@/components/AudioChunksView';
import ProcessingPipeline from '@/components/ProcessingPipeline';
import DevignerBadge from '@/components/DevignerBadge';
import CopyButton from '@/components/CopyButton';
import {
  ArrowRight,
  FileText,
  Flame,
  HelpCircle,
  Layers,
  MessageSquare,
  Music,
  Download,
  Calendar,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function SessionDetailPage() {
  const params = useParams();
  const courseId = Number(params.courseId);
  const sessionId = Number(params.sessionId);

  const [activeTab, setActiveTab] = useState('note');
  const [course, setCourse] = useState(null);
  const [session, setSession] = useState(null);
  const [note, setNote] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [sessionStatus, setSessionStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const pollTimerRef = useRef(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setError('');
    try {
      const [coursesData, sessionsData] = await Promise.all([
        getCourses().catch(() => []),
        getSessions(courseId).catch(() => []),
      ]);

      const currentCourse = (coursesData || []).find((c) => c.id === courseId) || null;
      const currentSession = (sessionsData || []).find((s) => s.id === sessionId) || null;

      setCourse(currentCourse);
      setSession(currentSession);

      // Fetch session-specific items in parallel
      const [noteRes, quizRes, flashRes, statusRes] = await Promise.allSettled([
        getNoteBySession(sessionId),
        getQuizzes(sessionId),
        getFlashcards(sessionId),
        getSessionStatus(sessionId),
      ]);

      if (noteRes.status === 'fulfilled' && noteRes.value) {
        setNote(noteRes.value);
      }
      if (quizRes.status === 'fulfilled') {
        setQuizzes(quizRes.value || []);
      }
      if (flashRes.status === 'fulfilled') {
        setFlashcards(flashRes.value || []);
      }
      if (statusRes.status === 'fulfilled') {
        setSessionStatus(statusRes.value || null);
      }
    } catch {
      setError('خطا در دریافت اطلاعات جلسه');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId, sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadData();
    }
  }, [sessionId, loadData]);

  // Handle pipeline auto-completed
  const handlePipelineCompleted = useCallback(
    async (completedNote) => {
      if (completedNote) {
        setNote(completedNote);
      }
      // Re-fetch quizzes, flashcards and final session data
      await loadData(true);
    },
    [loadData]
  );

  const isStillProcessing =
    !note &&
    (session?.status === 'PROCESSING' ||
      session?.status === 'PENDING' ||
      sessionStatus?.status === 'PROCESSING' ||
      sessionStatus?.status === 'PENDING' ||
      !sessionStatus?.has_note);

  const tabs = [
    { key: 'note', label: 'جزوه و خلاصه', icon: FileText },
    { key: 'tips', label: 'نکات امتحانی', icon: Flame, count: note?.exam_tips?.length },
    { key: 'quiz', label: 'آزمون تستی', icon: HelpCircle, count: quizzes.length },
    { key: 'flashcards', label: 'فلش‌کارت‌ها', icon: Layers, count: flashcards.length },
    { key: 'chat', label: 'دستیار هوشمند (RAG)', icon: MessageSquare },
    { key: 'audio', label: 'صوت و تکه‌ها', icon: Music, count: sessionStatus?.chunks?.length },
  ];

  const downloadUrl = note?.id
    ? getNoteDownloadUrl(note.id)
    : note?.note_file_url
    ? getFullMediaUrl(note.note_file_url)
    : '';

  return (
    <>
      <Header />
      <main className="pt-16 pb-12 min-h-dvh px-4 sm:px-6">
        <div className="max-w-4xl mx-auto pt-4 page-transition">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-6">
            <Link href="/archive" className="hover:text-primary-600 transition-colors">
              آرشیو دروس
            </Link>
            <span>/</span>
            <Link
              href={`/archive/${courseId}`}
              className="hover:text-primary-600 transition-colors truncate max-w-[150px]"
            >
              {course?.name || 'درس'}
            </Link>
            <span>/</span>
            <span className="text-gray-700 font-medium truncate max-w-[200px]">
              {note?.title || session?.title || `جلسه ${sessionId}`}
            </span>
          </div>

          {/* Session Master Banner Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {course && (
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold text-white shadow-2xs"
                      style={{ backgroundColor: course.color || '#7C3AED' }}
                    >
                      {course.name}
                    </span>
                  )}
                  {session?.created_at && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(session.created_at).toLocaleDateString('fa-IR')}
                    </span>
                  )}
                  <DevignerBadge
                    variant={note ? 'emerald' : isStillProcessing ? 'purple' : 'neutral'}
                    dot
                  >
                    {note
                      ? 'جزوه آماده مطالعه'
                      : isStillProcessing
                      ? 'در حال پردازش هوش مصنوعی...'
                      : session?.status_display || 'ثبت شده'}
                  </DevignerBadge>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  {note?.title || session?.title || `جلسه ${sessionId}`}
                </h1>

                {course && (
                  <p className="text-xs sm:text-sm text-gray-500">
                    {course.teacher_name ? `مدرس: ${course.teacher_name}` : 'مدرس: ثبت نشده'}
                    {course.classroom_name ? ` · محل تشکیل: ${course.classroom_name}` : ''}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadData(false)}
                  disabled={refreshing}
                  title="بروزرسانی داده‌های این جلسه"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-600' : ''}`} />
                  <span>{refreshing ? 'بروزرسانی...' : 'بروزرسانی'}</span>
                </button>

                {note?.content_markdown && (
                  <CopyButton
                    text={note.content_markdown}
                    label="کپی متن جزوه"
                    className="py-2 px-3.5"
                  />
                )}

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-primary-200 bg-primary-50 hover:bg-primary-100 text-xs font-semibold text-primary-700 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    دانلود فایل Markdown (.md)
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Devigner UI Segmented Tabs */}
          <div className="sticky top-16 z-30 mb-6 py-2 bg-[#FAFAFC]/90 backdrop-blur-md">
            <div className="flex items-center gap-1.5 p-1.5 bg-white/90 border border-gray-200/80 rounded-2xl shadow-2xs overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full transition-colors ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-16 text-center shadow-sm space-y-4">
              <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">در حال دریافت داده‌های جلسه از سرور...</h3>
                <p className="text-xs text-gray-400">لطفاً چند لحظه شکیبا باشید.</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : (
            <div className="min-h-[400px]">
              {/* TAB 1: NOTE & SUMMARY */}
              {activeTab === 'note' && (
                <div className="space-y-6">
                  {/* If note is NOT ready yet, render the LIVE PROCESSING PIPELINE! */}
                  {!note ? (
                    <ProcessingPipeline
                      sessionId={sessionId}
                      courseId={courseId}
                      initialStatus={sessionStatus}
                      onCompleted={handlePipelineCompleted}
                    />
                  ) : (
                    <>
                      {/* Executive Summary Card */}
                      {note.executive_summary && (
                        <div className="bg-gradient-to-br from-primary-50/60 to-purple-50/20 rounded-3xl border border-primary-200/70 p-6 shadow-2xs">
                          <div className="flex items-center gap-2 text-primary-700 font-bold text-sm mb-2">
                            <Sparkles className="w-4 h-4" />
                            خلاصه اجرایی جلسه
                          </div>
                          <p className="text-sm sm:text-base text-gray-800 leading-relaxed font-medium">
                            {note.executive_summary}
                          </p>
                        </div>
                      )}

                      {/* Key Topics Tags */}
                      {note.key_topics && note.key_topics.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
                          <span className="text-xs font-bold text-gray-500 ml-1">مباحث اصلی:</span>
                          {note.key_topics.map((topic, i) => (
                            <DevignerBadge key={i} variant="purple" size="md">
                              {topic}
                            </DevignerBadge>
                          ))}
                        </div>
                      )}

                      {/* Full Markdown Note */}
                      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 shadow-sm">
                        {note.content_markdown ? (
                          <MarkdownRenderer content={note.content_markdown} />
                        ) : (
                          <div className="text-center py-12 text-gray-400">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p>متن جزوه این جلسه یافت نشد.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 2: EXAM TIPS */}
              {activeTab === 'tips' && (
                <div className="space-y-6">
                  {!note && isStillProcessing && (
                    <div className="mb-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                      <span>نکات امتحانی همگام با پایان پردازش صوت جلسه استخراج و نمایش داده می‌شوند.</span>
                    </div>
                  )}
                  <ExamTipsView tips={note?.exam_tips || []} />
                </div>
              )}

              {/* TAB 3: QUIZ */}
              {activeTab === 'quiz' && (
                <div className="space-y-6">
                  {!note && isStillProcessing && (
                    <div className="mb-4 p-4 rounded-2xl bg-primary-50 border border-primary-200 text-primary-800 text-xs flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600 shrink-0" />
                      <span>آزمون ۴ گزینه‌ای پس از تحلیل متن جلسه به صورت هوشمند تولید خواهد شد.</span>
                    </div>
                  )}
                  <QuizView quizzes={quizzes} />
                </div>
              )}

              {/* TAB 4: FLASHCARDS */}
              {activeTab === 'flashcards' && (
                <div className="space-y-6">
                  {!note && isStillProcessing && (
                    <div className="mb-4 p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800 text-xs flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600 shrink-0" />
                      <span>فلش‌کارت‌های مرور سریع به همراه جزوه به طور خودکار بارگذاری می‌شوند.</span>
                    </div>
                  )}
                  <FlashcardsView flashcards={flashcards} />
                </div>
              )}

              {/* TAB 5: RAG CHAT */}
              {activeTab === 'chat' && (
                <RagChatView
                  courseId={courseId}
                  sessionId={sessionId}
                  sessionTitle={note?.title || session?.title || `جلسه ${sessionId}`}
                />
              )}

              {/* TAB 6: AUDIO & CHUNKS */}
              {activeTab === 'audio' && (
                <AudioChunksView sessionStatus={sessionStatus} />
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

