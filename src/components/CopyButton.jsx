'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyButton({ text, className = '', label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="کپی متن"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all duration-200 cursor-pointer ${
        copied
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
          : 'bg-white/80 hover:bg-gray-100/90 text-gray-600 hover:text-gray-900 border-gray-200'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50 duration-200" />
          <span>کپی شد!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-gray-500" />
          <span>{label || 'کپی'}</span>
        </>
      )}
    </button>
  );
}

