'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getCourses, deleteCourse } from '@/lib/api';
import DevignerBadge from '@/components/DevignerBadge';
import AddCourseModal from '@/components/AddCourseModal';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
import {
  Archive,
  ArrowLeft,
  BookOpen,
  Search,
  User,
  MapPin,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';

export default function ArchivePage() {
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data || []);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  const handleCourseCreated = (newCourse) => {
    setCourses((prev) => [newCourse, ...prev]);
    setActionSuccess(`درس «${newCourse.name}» با موفقیت افزوده شد.`);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleDeleteClick = (e, course) => {
    e.preventDefault();
    e.stopPropagation();
    setCourseToDelete(course);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setDeleting(true);
    try {
      await deleteCourse(courseToDelete.id);
      setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
      setActionSuccess(`درس «${courseToDelete.name}» با موفقیت حذف شد.`);
      setCourseToDelete(null);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err?.message || 'خطا در حذف درس.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.teacher_name && c.teacher_name.toLowerCase().includes(q)) ||
      (c.classroom_name && c.classroom_name.toLowerCase().includes(q)) ||
      (c.code && c.code.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Header />
      <main className="pt-16 pb-12 min-h-dvh px-4 sm:px-6">
        <div className="max-w-2xl mx-auto pt-6 page-transition">
          {/* Header Title */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto mb-4 text-primary-600 shadow-sm">
              <Archive className="w-8 h-8" />
            </div>
            <div className="inline-flex items-center gap-2 mb-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                آرشیو دروس و جلسات
              </h1>
              <DevignerBadge variant="purple" size="sm" count={courses.length}>
                {courses.length} درس
              </DevignerBadge>
            </div>
            <p className="text-xs sm:text-sm text-gray-400">
              برای مشاهده جلسات، جزوه‌ها، آزمون‌ها و چت RAG، ابتدا درس خود را انتخاب کنید یا درس جدید بیفزایید.
            </p>
          </div>

          {/* Success Banner */}
          {actionSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
              <span>{actionSuccess}</span>
              <button
                type="button"
                onClick={() => setActionSuccess('')}
                className="text-emerald-600 hover:text-emerald-900 text-xs cursor-pointer"
              >
                بستن
              </button>
            </div>
          )}

          {/* Action Bar (Search, Add Course, Refresh) */}
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جست‌وجو در نام درس، استاد یا کلاس..."
                className="w-full bg-white border border-gray-200/90 rounded-2xl pr-11 pl-4 py-3 text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all shadow-2xs text-right"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Add Course Button */}
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن درس جدید</span>
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                title="بروزرسانی لیست دروس"
                className="p-3 bg-white hover:bg-gray-50 border border-gray-200/90 rounded-2xl text-gray-600 hover:text-gray-900 transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* Loading Skeletons */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl border border-gray-100 p-5 shadow-2xs flex items-center gap-4 animate-pulse"
                >
                  <div className="w-13 h-13 rounded-2xl bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 bg-gray-200 rounded" />
                    <div className="w-48 h-3 bg-gray-100 rounded" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
                </div>
              ))}
              <div className="text-center py-4 text-xs text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                <span>در حال استعلام دروس از سرور NoteAi...</span>
              </div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-sm space-y-4">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-gray-800">درسی یافت نشد</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {searchQuery
                    ? 'با این عبارت جست‌وجو درسی ثبت نشده است.'
                    : 'هنوز درسی در سامانه ثبت نشده است. می‌توانید اولین درس را اضافه کنید.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ایجاد اولین درس کلاسی</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="group relative flex items-center gap-4 bg-white rounded-3xl border border-gray-200/80 p-5 hover:border-primary-300 hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
                >
                  <Link
                    href={`/archive/${course.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div
                      className="w-13 h-13 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-sm"
                      style={{ backgroundColor: course.color || '#7C3AED' }}
                    >
                      {course.name ? course.name.charAt(0) : 'د'}
                    </div>

                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate group-hover:text-primary-600 transition-colors">
                          {course.name}
                        </h3>
                        {course.code && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-mono">
                            {course.code}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-gray-400" />
                          {course.teacher_name || 'مدرس عمومی'}
                        </span>
                        {course.classroom_name && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {course.classroom_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Actions: Delete Button & Arrow */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClick(e, course)}
                      title="حذف این درس"
                      className="p-2 rounded-xl text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <Link
                      href={`/archive/${course.id}`}
                      className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-primary-50 flex items-center justify-center transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Course Modal */}
      <AddCourseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCourseCreated={handleCourseCreated}
      />

      {/* Confirm Delete Course Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(courseToDelete)}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="حذف درس"
        itemTitle={courseToDelete?.name}
        description="آیا از حذف این درس مطمئن هستید؟ با حذف درس، تمامی جلسات، ویس‌های کلاسی، جزوات مارکداون و آزمون‌های مربوطه برای همیشه پاک خواهند شد."
        loading={deleting}
      />
    </>
  );
}
