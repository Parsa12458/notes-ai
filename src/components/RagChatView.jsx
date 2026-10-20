'use client';

import React, { useState, useRef, useEffect } from 'react';
import { askQuestion } from '@/lib/api';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import DevignerBadge from '@/components/DevignerBadge';
import { Send, Sparkles, User, Bot, BookOpen, Loader2, Calendar } from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'استاد در این جلسه روی چه سوالات یا فرمول‌هایی تأکید کرد؟',
  'خلاصه مباحث تدریس شده در این جلسه چیست؟',
  'فرمول‌های کلیدی این جلسه را با فرمت ریاضی نمایش بده.',
  'یک مثال حل شده شبیه مباحث کلاس برایم مطرح کن.',
];

export default function RagChatView({ courseId, sessionId, sessionTitle }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `سلام! من دستیار هوشمند مطالعه شما برای **${sessionTitle || 'این جلسه'}** هستم (مشابه NotebookLM گوگل).\nهر سوالی درباره مباحث تدریس شده، نکات کلاسی یا فرمول‌های این جلسه دارید بپرسید تا با ارجاع به منبع پاسخ دهم.`,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || loading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuestion('');
    setLoading(true);
    setError('');

    try {
      const res = await askQuestion(courseId, q, sessionId);

      const aiMessage = {
        id: res.message_id || Date.now() + 1,
        sender: 'ai',
        text: res.answer,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setError('خطا در دریافت پاسخ هوش مصنوعی. لطفاً مجدداً امتحان کنید.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col h-[640px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>گفت‌وگوی هوشمند با درس (RAG)</span>
              <DevignerBadge variant="purple" size="sm">
                مشابه NotebookLM
              </DevignerBadge>
            </h3>
            <p className="text-[11px] text-gray-500">پاسخ مستند فقط بر اساس محتوای همین کلاس</p>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold ${
                  isUser
                    ? 'bg-primary-600 text-white'
                    : 'bg-primary-100 text-primary-700 border border-primary-200/60'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble */}
              <div
                className={`rounded-2xl p-4 text-xs sm:text-sm shadow-2xs ${
                  isUser
                    ? 'bg-primary-600 text-white rounded-tr-xs'
                    : 'bg-gray-50/90 text-gray-800 border border-gray-200/70 rounded-tl-xs'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                ) : (
                  <div>
                    <MarkdownRenderer content={msg.text} />

                    {/* Citations / Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200/70 space-y-1.5">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-primary-700">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>منابع و استنادات درس:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((src, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] bg-white text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs"
                            >
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span>{src.session_title || `جلسه ${src.session_id}`}</span>
                              {src.date && <span className="text-gray-400">({src.date})</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={`text-[10px] mt-2 font-mono ${
                    isUser ? 'text-primary-100 text-left' : 'text-gray-400 text-left'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading / Typing indicator */}
        {loading && (
          <div className="flex gap-3 max-w-[80%] ml-auto animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-50/90 border border-gray-200/70 rounded-2xl p-4 text-xs text-gray-600 flex items-center gap-3 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-primary-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-primary-600 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-gray-500 font-medium">هوش مصنوعی در حال تحلیل جزوه و استخراج پاسخ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested quick questions pill chips */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/40 overflow-x-auto no-scrollbar flex items-center gap-2">
        <span className="text-[11px] text-gray-400 font-semibold shrink-0">پیشنهادات:</span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => handleSend(q)}
            className="text-[11px] bg-white border border-gray-200/90 text-gray-700 hover:border-primary-400 hover:text-primary-700 px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input form */}
      <div className="p-4 border-t border-gray-100 bg-white">
        {error && (
          <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2 mb-2 text-right">
            {error}
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={loading}
            placeholder="سوال خود را درباره مفاهیم تدریس شده در این جلسه بپرسید..."
            className="flex-1 bg-gray-50/80 border border-gray-200/80 rounded-2xl px-4 py-3 text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-100 transition-all text-right"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || loading}
            className="w-11 h-11 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center shrink-0 transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rotate-180" />}
          </button>
        </form>
      </div>
    </div>
  );
}

