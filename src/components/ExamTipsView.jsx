'use client';

import React from 'react';
import DevignerBadge from '@/components/DevignerBadge';
import CopyButton from '@/components/CopyButton';
import { AlertTriangle, Flame, Info, Quote } from 'lucide-react';

export default function ExamTipsView({ tips = [] }) {
  if (!tips || tips.length === 0) {
    return (
      <div className="bg-white/80 rounded-2xl border border-gray-100 p-10 text-center">
        <Info className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <h4 className="text-gray-800 font-semibold mb-1">نکته امتحانی ثبت نشده است</h4>
        <p className="text-sm text-gray-400">
          استاد در این جلسه جمله تأکیدی صریحی برای آزمون بیان نکرده است.
        </p>
      </div>
    );
  }

  const getBadgeVariant = (importance) => {
    switch (importance) {
      case 'CRITICAL':
        return 'rose';
      case 'IMPORTANT':
        return 'amber';
      default:
        return 'purple';
    }
  };

  const getIcon = (importance) => {
    switch (importance) {
      case 'CRITICAL':
        return <Flame className="w-4 h-4 text-rose-500 animate-pulse" />;
      case 'IMPORTANT':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <Info className="w-4 h-4 text-primary-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>شکارچی نکات امتحانی استاد</span>
            <span className="text-xs font-normal text-gray-400">
              (استخراج خودکار جملات تأکیدی)
            </span>
          </h3>
        </div>
        <DevignerBadge variant="rose" count={tips.length} dot>
          {tips.filter((t) => t.importance === 'CRITICAL').length} نکته قطعی
        </DevignerBadge>
      </div>

      <div className="grid gap-3.5">
        {tips.map((tip) => {
          const isCritical = tip.importance === 'CRITICAL';
          return (
            <div
              key={tip.id}
              className={`relative bg-white rounded-2xl border p-5 transition-all duration-300 hover:shadow-md ${
                isCritical
                  ? 'border-rose-200/90 shadow-sm shadow-rose-100/50 bg-gradient-to-br from-rose-50/20 to-white'
                  : 'border-gray-200/80 hover:border-primary-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {getIcon(tip.importance)}
                  <DevignerBadge
                    variant={getBadgeVariant(tip.importance)}
                    size="sm"
                  >
                    {tip.importance_display || (isCritical ? 'حیاتی (سوال قطعی)' : 'مهم')}
                  </DevignerBadge>
                </div>
                <CopyButton
                  text={`${tip.tip_text}\n\nنقل قول استاد: ${tip.teacher_quote}`}
                  label="کپی نکته"
                />
              </div>

              {/* Main tip text */}
              <p className="text-gray-900 font-semibold text-sm sm:text-base leading-relaxed mb-3">
                {tip.tip_text}
              </p>

              {/* Teacher quote */}
              {tip.teacher_quote && (
                <div className="flex items-start gap-2.5 bg-gray-50/90 border border-gray-100 rounded-xl p-3 text-xs sm:text-sm text-gray-600">
                  <Quote className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                  <p className="italic leading-relaxed">
                    «{tip.teacher_quote}»
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

