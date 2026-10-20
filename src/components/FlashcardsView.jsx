'use client';

import React, { useState } from 'react';
import DevignerBadge from '@/components/DevignerBadge';
import { ChevronLeft, ChevronRight, Rotate3D, Layers, Sparkles } from 'lucide-react';

export default function FlashcardsView({ flashcards = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="bg-white/80 rounded-2xl border border-gray-100 p-10 text-center">
        <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h4 className="text-gray-800 font-semibold mb-1">فلش‌کارتی برای این جلسه یافت نشد</h4>
        <p className="text-sm text-gray-400">
          فلش‌کارت‌های مرور سریع شب امتحان پس از پایان پردازش جلسه ایجاد می‌شوند.
        </p>
      </div>
    );
  }

  const current = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header & Topic */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-bold text-gray-800">فلش‌کارت مرور سریع</span>
          {current.topic && (
            <DevignerBadge variant="purple" size="sm">
              {current.topic}
            </DevignerBadge>
          )}
        </div>

        <span className="font-mono text-xs text-gray-500 bg-gray-100/80 px-2.5 py-1 rounded-full">
          {currentIndex + 1} / {flashcards.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-primary-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* 3D Interactive Flip Card */}
      <div
        onClick={handleFlip}
        className="group perspective-1000 w-full min-h-[260px] sm:min-h-[280px] cursor-pointer select-none"
      >
        <div
          className={`relative w-full h-full min-h-[260px] sm:min-h-[280px] transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-8 flex flex-col justify-between hover:border-primary-300 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                روی کارت (پرسش یا مفهوم)
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Rotate3D className="w-3.5 h-3.5" />
                کلیک برای دیدن پاسخ
              </span>
            </div>

            <div className="my-auto text-center py-4">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed">
                {current.front_text}
              </h3>
            </div>

            <div className="text-center text-[11px] text-gray-400">
              برای چرخش کارت روی آن ضربه بزنید
            </div>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/90 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
                پشت کارت (پاسخ تشریحی)
              </span>
              <span className="text-xs text-white/70 flex items-center gap-1">
                <Rotate3D className="w-3.5 h-3.5" />
                پاسخ استاد
              </span>
            </div>

            <div className="my-auto text-center py-4">
              <p className="text-sm sm:text-base leading-relaxed text-white/95 font-medium">
                {current.back_text}
              </p>
            </div>

            <div className="text-center text-[11px] text-white/60">
              برای بازگشت به سوال کلیک کنید
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handlePrev}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition-colors cursor-pointer shadow-2xs"
        >
          <ChevronRight className="w-4 h-4" />
          <span>قبلی</span>
        </button>

        <button
          type="button"
          onClick={handleFlip}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary-50 hover:bg-primary-100 text-xs sm:text-sm font-semibold text-primary-700 transition-colors cursor-pointer border border-primary-200/60"
        >
          <Rotate3D className="w-4 h-4" />
          <span>چرخش کارت</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-xs sm:text-sm font-semibold text-gray-700 transition-colors cursor-pointer shadow-2xs"
        >
          <span>بعدی</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

