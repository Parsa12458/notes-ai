'use client';

import React, { useState } from 'react';
import { getFullMediaUrl } from '@/lib/api';
import DevignerBadge from '@/components/DevignerBadge';
import { Music, FileText, CheckCircle2, Clock, Download, ChevronDown, ChevronUp } from 'lucide-react';

export default function AudioChunksView({ sessionStatus }) {
  const [expandedChunk, setExpandedChunk] = useState(null);

  if (!sessionStatus || !sessionStatus.chunks || sessionStatus.chunks.length === 0) {
    return (
      <div className="bg-white/80 rounded-2xl border border-gray-100 p-10 text-center">
        <Music className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h4 className="text-gray-800 font-semibold mb-1">فایل صوتی یافت نشد</h4>
        <p className="text-sm text-gray-400">
          تکه‌های صوتی آپلود شده برای این جلسه در اینجا نمایش داده می‌شوند.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">تکه‌های صوتی و متن پیاده‌شده</h3>
            <p className="text-xs text-gray-500">
              صدای ضبط شده زنگ کلاس در قطعات مجزا ذخیره و توسط مدل Whisper پردازش شده است.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DevignerBadge variant="emerald" dot>
              {sessionStatus.chunks_transcribed || 0} پیاده‌شده
            </DevignerBadge>
            <DevignerBadge variant="neutral">
              مجموع {sessionStatus.chunks_total || sessionStatus.chunks.length} تکه
            </DevignerBadge>
          </div>
        </div>
      </div>

      {/* Chunks List */}
      <div className="space-y-3">
        {sessionStatus.chunks.map((chunk) => {
          const isTranscribed = chunk.status === 'TRANSCRIBED';
          const isExpanded = expandedChunk === chunk.id;
          const audioUrl = getFullMediaUrl(chunk.audio_file_url);
          const transcriptUrl = getFullMediaUrl(chunk.transcript_file_url);

          return (
            <div
              key={chunk.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-4 transition-all duration-200 shadow-2xs hover:border-primary-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-700 shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      تکه صوتی شماره {chunk.chunk_index}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      {isTranscribed ? (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {chunk.status_display || 'متن پیاده شد'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Clock className="w-3.5 h-3.5" />
                          {chunk.status_display || 'در حال پردازش...'}
                        </span>
                      )}
                      {chunk.duration_seconds && (
                        <span>· {Math.round(chunk.duration_seconds)} ثانیه</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {audioUrl && (
                    <a
                      href={audioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-gray-500" />
                      دانلود صوت
                    </a>
                  )}

                  {transcriptUrl && (
                    <button
                      type="button"
                      onClick={() => setExpandedChunk(isExpanded ? null : chunk.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-xs font-semibold text-primary-700 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      متن پیاده‌شده
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Inline Audio Player */}
              {audioUrl && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <audio
                    controls
                    preload="none"
                    src={audioUrl}
                    className="w-full h-8 rounded-lg accent-primary-600"
                  />
                </div>
              )}

              {/* Expandable Transcript Preview */}
              {isExpanded && transcriptUrl && (
                <div className="mt-3 pt-3 border-t border-gray-100 bg-gray-50/70 p-3 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700">
                      فایل رونوشت متنی:
                    </span>
                    <a
                      href={transcriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      مشاهده فایل متن کامل
                    </a>
                  </div>
                  <div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200/70 font-mono direction-rtl text-right">
                    متن در آدرس <code className="text-primary-700">{chunk.transcript_file_url}</code> ذخیره شده است.
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

