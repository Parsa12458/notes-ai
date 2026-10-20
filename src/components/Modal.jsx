'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Card */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-3xl border border-gray-200/90 shadow-2xl p-6 sm:p-7 overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-right`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

