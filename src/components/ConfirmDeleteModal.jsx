'use client';

import React from 'react';
import Modal from '@/components/Modal';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأیید حذف',
  itemTitle,
  description = 'این عملیات غیرقابل بازگشت است و تمامی داده‌ها، جلسات، جزوات و آزمون‌های مرتبط به طور کامل پاک خواهند شد.',
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">
              آیا از حذف {itemTitle ? `«${itemTitle}»` : 'این مورد'} اطمینان دارید؟
            </h4>
            <p className="text-xs text-rose-700 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال حذف...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>بله، حذف کن</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

