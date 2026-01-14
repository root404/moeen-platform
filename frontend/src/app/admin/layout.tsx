'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, getUser } from '@/services/api';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { token } = getAuthToken();
      const user = getUser();
      
      if (!token || !user) {
        router.push('/login');
        return;
      }

      // Check if user has admin role
      if (user.subscriptionType === 'admin') {
        setIsAdmin(true);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.47-3.12M16.5 10.5a2.5 2.5 0 10-2.5 2.5 0 010-2.5 2.5M9 11l6-6-6 0v14" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">محدود الوصول</h2>
          <p className="text-gray-600 mb-6">
            عذراً، لا يمكنك الوصول إلى لوحة التحكم. هذه الصفحة متاحة فقط لمديري النظام.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700"
          >
            العودة للوحة المستخدم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">م</span>
              </div>
              <div className="mr-3">
                <h1 className="text-xl font-bold text-red-700">لوحة التحكم</h1>
                <p className="text-sm text-gray-500">نظام إدارة مُعين</p>
              </div>
            </div>
            <nav className="flex items-center space-x-reverse space-x-6">
              <a
                href="/admin"
                className="px-4 py-2 text-red-700 hover:bg-red-50 font-medium transition-colors rounded-lg"
              >
                نظرة عامة
              </a>
              <a
                href="/admin/users"
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium transition-colors rounded-lg"
              >
                إدارة المستخدمين
              </a>
              <a
                href="/admin/quota"
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium transition-colors rounded-lg"
              >
                التحكم في الحصص
              </a>
              <a
                href="/admin/logs"
                className="px-4 py-2 text-gray-700 hover:bg-gray-50 font-medium transition-colors rounded-lg"
              >
                سجلات النظام
              </a>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-colors rounded-lg"
              >
                خروج
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              لوحة تحكم النظام
            </h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-600 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.47-3.12M16.5 10.5a2.5 2.5 0 10-2.5 2.5 0 010-2.5 2.5M9 11l6-6-6 0v14" />
                </svg>
                <span className="mr-3 text-red-700 font-medium">وضع مهم:</span>
                <span className="text-red-600">هذه المنطقة مخصصة للمديرين فقط</span>
              </div>
            </div>
            </div>
          </div>

          {children}
        </div>
      </main>

      {/* Admin Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-bold mb-4">نظام إدارة مُعين</h3>
              <p className="text-gray-400 text-sm mb-4">
                لوحة تحكم مركزية لإدارة المستخدمين والمحتوى والنظام
              </p>
              <p className="text-gray-500 text-xs">
                © 2024 مُعين. جميع الحقوق محفوظة.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">روابط سريعة</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/admin" className="hover:text-white transition-colors">نظرة عامة</a></li>
                <li><a href="/admin/users" className="hover:text-white transition-colors">إدارة المستخدمين</a></li>
                <li><a href="/admin/quota" className="hover:text-white transition-colors">التحكم في الحصص</a></li>
                <li><a href="/admin/logs" className="hover:text-white transition-colors">سجلات النظام</a></li>
                <li><a href="/" className="hover:text-white transition-colors">العودة للمنصة الرئيسية</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">الدعم الفني</h4>
              <ul className="space-y-2 text-gray-400">
                <li> البريد الإلكتروني: support@moeen.com</li>
                <li> الهاتف: +966 500 123 4567</li>
                <li> المستخدمين: 24/7 دعم فني</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}