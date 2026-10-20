'use client';

import React, { useState, useEffect } from 'react';
import { submitQuiz, generateQuiz } from '@/lib/api';
import DevignerBadge from '@/components/DevignerBadge';
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  Send,
  HelpCircle,
  Loader2,
  Sparkles,
  Plus,
  AlertCircle,
} from 'lucide-react';

export default function QuizView({
  quizzes: initialQuizzes = [],
  sessionId,
  onQuizGenerated,
}) {
  const [quizzes, setQuizzes] = useState(initialQuizzes);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    setQuizzes(initialQuizzes);
  }, [initialQuizzes]);

  const handleGenerateQuiz = async () => {
    if (!sessionId) return;
    setGenerating(true);
    setGenerateError('');
    try {
      const title = `کوییز سنجش یادگیری ${quizzes.length + 1}`;
      const newQuiz = await generateQuiz(sessionId, title);
      const updated = [...quizzes, newQuiz];
      setQuizzes(updated);
      setActiveQuizIndex(updated.length - 1);
      handleReset();
      if (onQuizGenerated) {
        onQuizGenerated(newQuiz);
      }
    } catch (err) {
      setGenerateError(err?.message || 'خطا در تولید آزمون هوشمند. لطفاً مجدداً امتحان کنید.');
    } finally {
      setGenerating(false);
    }
  };

  if (!quizzes || quizzes.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-10 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto shadow-2xs">
          <HelpCircle className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-base font-bold text-gray-900">آزمونی برای این جلسه یافت نشد</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            می‌توانید همین حالا با هوش مصنوعی آزمون ۴ گزینه‌ای استاندارد بر اساس مفاهیم این جلسه تولید کنید.
          </p>
        </div>

        {generateError && (
          <div className="flex items-center justify-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generateError}</span>
          </div>
        )}

        {sessionId && (
          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateQuiz}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال تحلیل جزوه و ساخت سوالات تستی...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>تولید آزمون ۴ گزینه‌ای با هوش مصنوعی</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  const currentQuiz = quizzes[activeQuizIndex] || quizzes[0];
  const questions = currentQuiz?.questions || [];

  const handleSelectChoice = (questionId, choiceId) => {
    if (results) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setError('لطفاً نام و نام‌خانوادگی خود را وارد کنید');
      return;
    }

    const answersPayload = Object.entries(selectedAnswers).map(([qId, cId]) => ({
      question_id: Number(qId),
      selected_choice_id: cId,
    }));

    if (answersPayload.length === 0) {
      setError('لطفاً به حداقل یک سوال پاسخ دهید');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await submitQuiz(currentQuiz.id, studentName.trim(), answersPayload);
      setResults(res);
    } catch {
      // Local fallback calculation if backend submit route is temporarily offline
      let correct = 0;
      const detailed = questions.map((q) => {
        const selected = selectedAnswers[q.id];
        const correctChoice = q.choices?.find((c) => c.is_correct);
        const isCorrect = selected === correctChoice?.id;
        if (isCorrect) correct += 1;
        return {
          question_id: q.id,
          question_text: q.question_text,
          selected_choice_id: selected,
          is_correct: Boolean(isCorrect),
          explanation: q.explanation || 'بر اساس مفاهیم تدریس شده در جزوه.',
        };
      });

      const total = questions.length;
      setResults({
        student_name: studentName.trim(),
        total_questions: total,
        correct_answers: correct,
        score_percentage: Math.round((correct / (total || 1)) * 100),
        detailed_results: detailed,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setSelectedAnswers({});
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Quiz Header & Selector if multiple */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900">{currentQuiz.title}</h3>
              <DevignerBadge variant="purple" size="sm">
                {currentQuiz.total_questions || questions.length} سوال
              </DevignerBadge>
            </div>
            {currentQuiz.description && (
              <p className="text-xs sm:text-sm text-gray-500">{currentQuiz.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {quizzes.length > 1 && (
              <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl">
                {quizzes.map((q, idx) => (
                  <button
                    key={q.id || idx}
                    onClick={() => {
                      setActiveQuizIndex(idx);
                      handleReset();
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                      activeQuizIndex === idx
                        ? 'bg-white text-primary-700 shadow-sm font-semibold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    آزمون {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {sessionId && (
              <button
                type="button"
                disabled={generating}
                onClick={handleGenerateQuiz}
                title="تولید یک آزمون جدید برای این جلسه"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary-200 bg-primary-50 hover:bg-primary-100 text-xs font-semibold text-primary-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>{generating ? 'در حال ساخت...' : 'آزمون جدید'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {generateError && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{generateError}</span>
        </div>
      )}

      {/* Results Banner if submitted */}
      {results && (
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-3xl border border-emerald-200/80 p-6 sm:p-8 shadow-sm animate-in zoom-in-95 duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-right">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Award className="w-9 h-9" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-700">کارنامه دانش‌آموز:</span>
                <h4 className="text-xl font-black text-gray-900">{results.student_name}</h4>
                <p className="text-xs text-gray-500 mt-1">
                  پاسخ‌های صحیح: {results.correct_answers} از {results.total_questions} سوال
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 bg-white rounded-2xl border border-emerald-100 shadow-2xs">
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {results.score_percentage}%
                </div>
                <div className="text-[11px] text-gray-400">درصد نمره آزمون</div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>آزمون مجدد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {questions.map((q, qIndex) => {
          const selectedChoiceId = selectedAnswers[q.id];
          const detailedResult = results?.detailed_results?.find((r) => r.question_id === q.id);

          return (
            <div
              key={q.id || qIndex}
              className={`bg-white rounded-3xl border p-6 sm:p-7 transition-all duration-200 shadow-2xs ${
                detailedResult
                  ? detailedResult.is_correct
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-rose-200 bg-rose-50/10'
                  : 'border-gray-200/80 hover:border-primary-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {q.order || qIndex + 1}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed pt-0.5">
                    {q.question_text}
                  </h4>
                </div>

                {detailedResult && (
                  <DevignerBadge
                    variant={detailedResult.is_correct ? 'emerald' : 'rose'}
                    size="sm"
                    dot
                  >
                    {detailedResult.is_correct ? 'صحیح' : 'نادرست'}
                  </DevignerBadge>
                )}
              </div>

              {/* Choices */}
              <div className="space-y-2.5 mr-0 sm:mr-10">
                {q.choices?.map((choice) => {
                  const isSelected = selectedChoiceId === choice.id;
                  const isCorrectChoice = choice.is_correct;
                  const showResultState = Boolean(results);

                  let choiceStyles = 'border-gray-200 hover:border-primary-300 hover:bg-gray-50/60';

                  if (showResultState) {
                    if (isCorrectChoice) {
                      choiceStyles = 'border-emerald-400 bg-emerald-50/80 text-emerald-900 font-semibold';
                    } else if (isSelected && !isCorrectChoice) {
                      choiceStyles = 'border-rose-400 bg-rose-50/80 text-rose-900 line-through';
                    } else {
                      choiceStyles = 'border-gray-100 opacity-50';
                    }
                  } else if (isSelected) {
                    choiceStyles = 'border-primary-500 bg-primary-50 text-primary-900 font-semibold shadow-2xs';
                  }

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={Boolean(results)}
                      onClick={() => handleSelectChoice(q.id, choice.id)}
                      className={`w-full text-right p-3.5 rounded-2xl border transition-all text-xs sm:text-sm flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${choiceStyles}`}
                    >
                      <span className="leading-relaxed">{choice.choice_text}</span>
                      <div className="shrink-0">
                        {showResultState ? (
                          isCorrectChoice ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : isSelected ? (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-gray-300 block" />
                          )
                        ) : (
                          <span
                            className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center ${
                              isSelected ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Explanation (revealed after submission) */}
              {results && q.explanation && (
                <div className="mt-4 pt-3 border-t border-gray-100 mr-0 sm:mr-10 text-xs text-gray-600 bg-gray-50/70 p-3 rounded-xl">
                  <span className="font-bold text-gray-800 ml-1">تحلیل و پاسخ تشریحی:</span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit controls */}
        {!results && (
          <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                نام و نام‌خانوادگی دانش‌آموز:
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="مثلاً: علی محمدی"
                className="w-full bg-white border border-gray-200/90 rounded-2xl px-4 py-3 text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all shadow-2xs text-right"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال تصحیح آنلاین آزمون...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ثبت پاسخ‌ها و مشاهده نمره</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
