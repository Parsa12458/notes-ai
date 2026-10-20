'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import {
  getCourses,
  getCurrentBell,
  createCourse,
  createSession,
  uploadChunk,
  finalizeSession,
  getSessionStatus,
} from '@/lib/api';
import DevignerBadge from '@/components/DevignerBadge';
import ProcessingPipeline from '@/components/ProcessingPipeline';
import AddCourseModal from '@/components/AddCourseModal';
import {
  Mic,
  Square,
  Upload,
  CheckCircle,
  Loader2,
  AlertCircle,
  ChevronDown,
  FileAudio,
  Bell,
  Radio,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';

export default function RecordPage() {
  const [courses, setCourses] = useState([]);
  const [currentBell, setCurrentBell] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);

  // Add course modal
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);

  const handleCourseCreated = (newCourse) => {
    setCourses((prev) => [...prev, newCourse]);
    setSelectedCourse(newCourse.id);
  };

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [chunkIndex, setChunkIndex] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedChunks, setUploadedChunks] = useState(0);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);

  // File upload
  const fileInputRef = useRef(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('setup'); // 'setup' | 'recording' | 'done'

  useEffect(() => {
    getCourses()
      .then((data) => {
        setCourses(data || []);
        if (data && data.length > 0 && !selectedCourse) {
          setSelectedCourse(data[0].id);
        }
      })
      .catch(() => {});

    getCurrentBell()
      .then((bell) => {
        if (bell && bell.detected) {
          setCurrentBell(bell);
          if (bell.course_id) {
            setSelectedCourse(bell.course_id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Poll session status while in recording mode
  useEffect(() => {
    if (!sessionId || step !== 'recording') return;
    const poll = setInterval(() => {
      getSessionStatus(sessionId)
        .then(setSessionStatus)
        .catch(() => {});
    }, 4000);
    return () => clearInterval(poll);
  }, [sessionId, step]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };



  const handleStartSession = async () => {
    if (!selectedCourse) {
      setError('لطفاً یک درس را انتخاب کنید');
      return;
    }
    if (!sessionTitle.trim()) {
      setError('عنوان جلسه را وارد کنید (مثلاً: جلسه اول - مقدمه)');
      return;
    }
    setError('');
    setCreatingSession(true);
    try {
      const session = await createSession(selectedCourse, sessionTitle.trim());
      setSessionId(session.id);
      setStep('recording');
    } catch (err) {
      setError(err?.message || 'خطا در ایجاد جلسه در سرور. لطفاً مجدداً امتحان کنید.');
    } finally {
      setCreatingSession(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setError('');
    } catch {
      setError('دسترسی به میکروفون داده نشد یا میکروفون در دسترس نیست.');
    }
  };

  const stopAndUpload = useCallback(async () => {
    if (!mediaRecorderRef.current || !sessionId) return;

    const recorder = mediaRecorderRef.current;
    setIsRecording(false);

    return new Promise((resolve) => {
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) {
          setUploading(true);
          try {
            const newIndex = chunkIndex + 1;
            await uploadChunk(sessionId, blob, newIndex, recordingTime);
            setChunkIndex(newIndex);
            setUploadedChunks((c) => c + 1);
            // Refresh status
            getSessionStatus(sessionId).then(setSessionStatus).catch(() => {});
          } catch {
            setError('خطا در ارسال تکه صوتی به سرور');
          } finally {
            setUploading(false);
          }
        }
        recorder.stream.getTracks().forEach((t) => t.stop());
        resolve();
      };
      recorder.stop();
    });
  }, [sessionId, chunkIndex, recordingTime]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !sessionId) return;
    setUploadingFile(true);
    setError('');
    try {
      const newIndex = chunkIndex + 1;
      await uploadChunk(sessionId, file, newIndex);
      setChunkIndex(newIndex);
      setUploadedChunks((c) => c + 1);
      // Refresh status
      getSessionStatus(sessionId).then(setSessionStatus).catch(() => {});
    } catch {
      setError('خطا در آپلود فایل صوتی');
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFinalize = async () => {
    if (!sessionId) return;
    setFinalizing(true);
    setError('');
    try {
      await finalizeSession(sessionId);
      setFinalized(false);
      setStep('done');
    } catch (err) {
      setError(err?.message || 'خطا در نهایی‌سازی جلسه. لطفاً مجدداً تلاش کنید.');
    } finally {
      setFinalizing(false);
    }
  };

  const selectedCourseObj = courses.find((c) => c.id === selectedCourse);

  return (
    <>
      <Header />
      <main className="pt-16 pb-12 min-h-dvh px-4 sm:px-6">
        <div className="max-w-xl mx-auto pt-6 page-transition">
          {/* STEP 1: SETUP */}
          {step === 'setup' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Mic className="w-8 h-8 text-rose-500" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  ضبط صدای کلاس درس
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  کلاس رو مشخص کن؛ هوش مصنوعی صوت رو به جزوه تبدیل می‌کنه.
                </p>
              </div>

              {/* Automatic Bell Detection Banner */}
              {currentBell && currentBell.detected && (
                <div className="bg-gradient-to-r from-primary-50 via-purple-50 to-white rounded-2xl border border-primary-200/80 p-4 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary-700">
                          زنگ جاری مدرسه تشخیص داده شد!
                        </span>
                        <DevignerBadge variant="purple" size="sm">
                          خودکار
                        </DevignerBadge>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                        {currentBell.course_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {currentBell.classroom} · ساعت {currentBell.start_time} تا {currentBell.end_time}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 block">
                    انتخاب درس:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCourseModalOpen(true)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن درس جدید</span>
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCourseDropdown(!showCourseDropdown)}
                    className="w-full flex items-center justify-between bg-white border border-gray-200/90 rounded-2xl px-4 py-3.5 text-sm hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all shadow-2xs cursor-pointer"
                  >
                    <span className={selectedCourseObj ? 'font-semibold text-gray-900' : 'text-gray-400'}>
                      {selectedCourseObj ? (
                        <span className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: selectedCourseObj.color || '#7C3AED' }}
                          />
                          {selectedCourseObj.name} {selectedCourseObj.teacher_name ? `(${selectedCourseObj.teacher_name})` : ''}
                        </span>
                      ) : (
                        'یک درس را انتخاب کنید...'
                      )}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showCourseDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                      {courses.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCourse(c.id);
                            setShowCourseDropdown(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-right cursor-pointer border-b border-gray-50 last:border-b-0"
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: c.color || '#7C3AED' }}
                          >
                            {c.name ? c.name.charAt(0) : 'د'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                            <p className="text-xs text-gray-400 truncate">
                              {c.teacher_name || 'مدرس عمومی'} {c.classroom_name ? `· ${c.classroom_name}` : ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Session Title Input */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">
                  عنوان جلسه:
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="مثلاً: جلسه اول - گراف‌ها و ماتریس مجاورت"
                  className="w-full bg-white border border-gray-200/90 rounded-2xl px-4 py-3.5 text-sm placeholder:text-gray-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all shadow-2xs text-right"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-600 text-xs sm:text-sm bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleStartSession}
                disabled={creatingSession}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {creatingSession ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>در حال ایجاد جلسه در سرور...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4" />
                    <span>شروع زنگ و ورود به محیط ضبط</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: RECORDING WORKSPACE */}
          {step === 'recording' && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold mb-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  زنگ فعال کلاسی
                </div>
                <h1 className="text-xl font-black text-gray-900">{sessionTitle}</h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  درس: {selectedCourseObj?.name} · استاد: {selectedCourseObj?.teacher_name || 'عمومی'}
                </p>
              </div>

              {/* Main Record Control Card */}
              <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm flex flex-col items-center gap-6">
                {/* Big Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={isRecording ? stopAndUpload : startRecording}
                    className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 hover:bg-rose-600 text-white recording-pulse'
                        : 'bg-primary-600 hover:bg-primary-700 text-white hover:scale-105'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-8 h-8 fill-white" />
                        <span className="text-[10px] font-bold mt-1">اتمام تکه</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-9 h-9" />
                        <span className="text-[10px] font-bold mt-1">شروع ضبط</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Animated Soundwave Visualizer */}
                {isRecording ? (
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-mono font-black text-gray-900 tracking-wider">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="flex items-center justify-center gap-1 h-8">
                      {[40, 75, 25, 90, 60, 30, 85, 50, 95, 35, 70, 45, 80, 20].map((h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-primary-500 rounded-full animate-pulse"
                          style={{
                            height: `${h}%`,
                            animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-rose-600 font-semibold flex items-center justify-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      صدای کلاس در حال ضبط است (تکه #{chunkIndex + 1})
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-400">
                    برای شروع ضبط صدای استاد، روی دکمه میکروفون بزنید.
                  </div>
                )}

                {/* Upload File Alternative */}
                <div className="w-full border-t border-gray-100 pt-5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingFile || isRecording}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 rounded-2xl text-xs sm:text-sm text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {uploadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    ) : (
                      <FileAudio className="w-4 h-4 text-primary-600" />
                    )}
                    <span>
                      {uploadingFile ? 'در حال ارسال فایل صوتی...' : 'یا فایل ضبط‌شده را انتخاب و آپلود کن (m4a, mp3, wav)'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Status & Live Chunks Card */}
              <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">تکه‌های صوتی ارسال‌شده:</span>
                  <DevignerBadge variant="purple" size="sm" count={uploadedChunks}>
                    {uploadedChunks} تکه
                  </DevignerBadge>
                </div>

                {uploading && (
                  <div className="flex items-center gap-2 text-xs text-primary-700 bg-primary-50 p-2.5 rounded-xl border border-primary-200">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                    در حال ارسال قطعه صوتی به سرور NoteAi...
                  </div>
                )}

                {sessionStatus && (
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-gray-100">
                    <span className="text-gray-500">پردازش رونوشت (Whisper STT):</span>
                    <span className="font-semibold text-emerald-600">
                      {sessionStatus.chunks_transcribed || 0} از {sessionStatus.chunks_total || sessionStatus.chunks?.length || 0} تکه
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-600 text-xs sm:text-sm bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Finalize Button */}
              {uploadedChunks > 0 && !isRecording && (
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={finalizing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {finalizing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      پایپلاین Map-Reduce در حال تولید جزوه، نکات امتحانی و کوئیز...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      پایان زنگ کلاسی و تولید جزوه نهایی (Finalize)
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* STEP 3: DONE WITH LIVE PROCESSING PIPELINE */}
          {step === 'done' && (
            <div className="space-y-6">
              <ProcessingPipeline
                sessionId={sessionId}
                courseId={selectedCourse}
                initialStatus={sessionStatus}
                onCompleted={() => {
                  setFinalized(true);
                }}
              />

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link
                  href={`/archive/${selectedCourse}/${sessionId}`}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3.5 rounded-2xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <span>ورود به اتاق مطالعه و مشاهده جزوه</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setStep('setup');
                    setSessionId(null);
                    setSessionTitle('');
                    setUploadedChunks(0);
                    setChunkIndex(0);
                    setFinalized(false);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3.5 rounded-2xl text-sm transition-colors cursor-pointer"
                >
                  ضبط جلسه جدید
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isAddCourseModalOpen}
        onClose={() => setIsAddCourseModalOpen(false)}
        onCourseCreated={handleCourseCreated}
      />
    </>
  );
}

