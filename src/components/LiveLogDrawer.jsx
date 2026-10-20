'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Copy, Trash2, ChevronUp, ChevronDown, Check, Cloud, CheckCircle2 } from 'lucide-react';
import DevignerBadge from '@/components/DevignerBadge';
import { BASE } from '@/lib/api';

export default function LiveLogDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSupported, setIsSupported] = useState(null);
  const lastIdRef = useRef(0);
  const terminalEndRef = useRef(null);

  useEffect(() => {
    if (isSupported === false) return;
    if (!isOpen && isSupported !== null) return;

    let interval;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`${BASE}/api/v1/logs/?since=${lastIdRef.current}`);
        if (res.status === 404) {
          setIsSupported(false);
          return;
        }
        if (!res.ok) return;

        setIsSupported(true);
        const data = await res.json();
        if (data.logs && data.logs.length > 0) {
          setLogs((prev) => [...prev, ...data.logs]);
          const maxId = Math.max(...data.logs.map((l) => l.id));
          if (maxId > lastIdRef.current) {
            lastIdRef.current = maxId;
          }
        }
      } catch {
        // Backend offline or network blip
      }
    };

    fetchLogs();
    if (isOpen) {
      interval = setInterval(fetchLogs, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isSupported]);

  useEffect(() => {
    if (autoScroll && isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen, autoScroll]);

  const handleClear = async () => {
    try {
      await fetch(`${BASE}/api/v1/logs/clear/`, { method: 'POST' });
    } catch {}
    setLogs([]);
    lastIdRef.current = 0;
  };

  const handleCopy = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.level}] ${l.name}: ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterLevel === 'ALL') return true;
    return l.level === filterLevel;
  });

  const isRemote = BASE.includes('onrender.com');

  return (
    <>
      {/* Floating Trigger Button at bottom-left */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-gray-900/90 hover:bg-gray-900 text-white shadow-lg backdrop-blur-md border border-gray-700/80 text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>کنسول وضعیت بک‌اند</span>
          <DevignerBadge variant="emerald" size="sm" dot count={logs.length}>
            {isRemote ? 'Render Cloud' : 'لوکال'}
          </DevignerBadge>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Slide-up Terminal Drawer */}
      {isOpen && (
        <div className="fixed bottom-16 left-4 right-4 sm:right-auto sm:w-[680px] max-h-[460px] h-[460px] z-50 bg-[#0B0F19] text-gray-100 rounded-3xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-[#111827] border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-gray-200">
                وضعیت بک‌اند NoteAi ({BASE})
              </span>
              <span className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                آنلاین
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {logs.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleCopy}
                    title="کپی لاگ‌ها"
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleClear}
                    title="پاکسازی لاگ‌ها"
                    className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="بستن پنجره"
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Subheader Filters (if logs available) */}
          {logs.length > 0 && (
            <div className="px-4 py-2 bg-[#0B0F19] border-b border-gray-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                {['ALL', 'INFO', 'WARNING', 'ERROR'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFilterLevel(lvl)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                      filterLevel === lvl
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-1 text-[11px] text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-gray-700 accent-emerald-500"
                />
                اسکرول خودکار
              </label>
            </div>
          )}

          {/* Terminal Body */}
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 select-text direction-ltr text-left">
            {isSupported === false ? (
              <div className="space-y-4 text-gray-300 py-3">
                <div className="flex items-center gap-2 text-emerald-400 font-sans font-semibold text-sm">
                  <Cloud className="w-5 h-5" />
                  <span>متصل به سرور ابری Render ({BASE})</span>
                </div>
                <div className="bg-[#111827] border border-gray-800 rounded-2xl p-4 space-y-2 text-xs font-sans text-gray-300">
                  <p className="text-gray-200 font-medium">
                    بک‌اند پلتفرم هوشمند NoteAi با موفقیت روی هاست Render متصل و فعال است.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-400 text-[11px] leading-relaxed">
                    <li>
                      <span className="text-gray-200">اندپوینت‌های فعال:</span> دروس کلاسی، ضبط و ارسال چانک‌ها، نهایی‌سازی Map-Reduce، استخراج نکات امتحانی، آزمون‌ساز و دستیار هوشمند RAG.
                    </li>
                    <li>
                      <span className="text-gray-200">محیط استقرار:</span> سرور پروداکشن Gunicorn در محیط ابری Render.
                    </li>
                    <li>
                      <span className="text-gray-200">توضیح لاگ زنده:</span> استریم بلادرنگ خط فرمان جنگو ویژه تست‌های محلی لوکال‌هاست است. در محیط پروداکشن، لاگ‌ها در داشبورد Render ذخیره می‌شوند.
                    </li>
                  </ul>
                </div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-gray-500 py-6 text-center font-sans text-xs">
                در انتظار دریافت لاگ‌های جدید از سرور...
              </div>
            ) : (
              filteredLogs.map((log) => {
                let badgeClass = 'text-gray-400';
                if (log.level === 'ERROR') badgeClass = 'text-rose-400 font-bold';
                else if (log.level === 'WARNING') badgeClass = 'text-amber-400 font-bold';
                else if (log.level === 'INFO') badgeClass = 'text-emerald-400';

                return (
                  <div key={log.id} className="leading-relaxed hover:bg-gray-800/40 p-1 rounded">
                    <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                    <span className={`mr-2 ${badgeClass}`}>[{log.level}]</span>
                    <span className="text-purple-400 mr-2">{log.name}:</span>
                    <span className="text-gray-200 whitespace-pre-wrap">{log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      )}
    </>
  );
}

