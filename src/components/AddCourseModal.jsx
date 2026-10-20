'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { createCourse } from '@/lib/api';
import { BookOpen, Loader2, Sparkles, AlertCircle } from 'lucide-react';

const COLOR_PRESETS = [
  { label: 'بنفش', hex: '#7C3AED' },
  { label: 'آبی', hex: '#2563EB' },
  { label: 'سبز زمردی', hex: '#059669' },
  { label: 'کهربایی', hex: '#D97706' },
  { label: 'رز قرمز', hex: '#E11D48' },
  { label: 'نیلی', hex: '#4F46E5' },
  { label: 'فیروزه‌ای', hex: '#0891B2' },
  { label: 'ارغوانی', hex: '#9333EA' },
];

export default function AddCourseModal({ isOpen, onClose, onCourseCreated }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(COLOR_PRESETS[0].hex);
  const [teacherName, setTeacherName] = useState('');
  const [classroomName, setClassroomName] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setCode('');
    setColor(COLOR_PRESETS[0].hex);
    setTeacherName('');
    setClassroomName('');
    setDescription('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('لطفاً نام درس را وارد کنید.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || undefined,
        color: color || '#7C3AED',
        description: description.trim() || undefined,
        teacher_name: teacherName.trim() || undefined,
        classroom_name: classroomName.trim() || undefined,
      };

      const newCourse = await createCourse(payload);
      resetForm();
      if (onCourseCreated) {
        onCourseCreated(newCourse);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'خطا در ثبت درس جدید. لطفاً مجدداً امتحان کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="افزودن درس جدید به سامانه" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Course Name */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1.5 block">
            نام درس <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً: ریاضیات گسسته، فیزیک ۳، شیمی..."
            className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-all text-right"
          />
        </div>

        {/* Course Code & Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 block">
              کد درس (اختیاری)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثلاً: MATH-12"
              className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-all font-mono text-right direction-ltr"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 block">
              رنگ شناسه درس
            </label>
            <div className="flex items-center gap-1.5 pt-1">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.hex)}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    color === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-primary-500' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Teacher & Classroom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 block">
              نام مدرس یا استاد (اختیاری)
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="مثلاً: دکتر محمدی"
              className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-all text-right"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 block">
              کلاس / پایه تحصیلی (اختیاری)
            </label>
            <input
              type="text"
              value={classroomName}
              onChange={(e) => setClassroomName(e.target.value)}
              placeholder="مثلاً: کلاس ۱۲ ریاضی - الف"
              className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-all text-right"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1.5 block">
            توضیحات و سرفصل‌های درس (اختیاری)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="مفاهیم اصلی و سرفصل‌های آموزشی این درس..."
            className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl p-3 text-xs sm:text-sm focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-all text-right resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            انصراف
          </button>

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال ثبت درس...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>افزودن درس</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

