'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '../styles/globals.css';

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            مرحباً بكم في منصة مُعين
          </h1>
          <p className="text-xl text-gray-200 mb-8">
            منصة متقدمة لحفظ وتقييم القرآن الكريم بالذكاء الاصطناعي
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-8 transform transition-transform hover:scale-105 duration-200">
            <h2 className="text-2xl font-bold text-emerald-600 mb-4">
              📖 التدريب على التلاوة
            </h2>
            <p className="text-gray-600 mb-6">
              تدريب على تلاوة السور القرآنية مع تقييم فوري بالذكاء الاصطناعي
            </p>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => router.push('/register')}
                className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-emerald-700 transition-colors duration-200 mr-4"
              >
                إنشاء حساب جديد
              </button>
              <button
                onClick={() => router.push('/login')}
                className="bg-white text-emerald-600 font-bold py-3 px-8 rounded-lg border-2 border-emerald-600 hover:bg-gray-50 transition-colors duration-200"
              >
                تسجيل الدخول
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 transform transition-transform hover:scale-105 duration-200">
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              🎙️ التقييم والاختبارات
            </h2>
            <p className="text-gray-600 mb-6">
              اختبارات تحفيظ وامتحانات قصيرة مع ملاحظات أداء
            </p>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                لوحة التحكم
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 transform transition-transform hover:scale-105 duration-200">
            <h2 className="text-2xl font-bold text-purple-600 mb-4">
              🏆 لوحة المتسابقين
            </h2>
            <p className="text-gray-600 mb-6">
              المتسابقون الأوائل في جميع المستويات
            </p>
            <div className="flex justify-center mt-6">
              <button
                onClick={() => window.open('https://moeen-api.onrender.com/health', '_blank')}
                className="bg-purple-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                حالة النظام
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500">
            🎉 منصة مُعين - نسخة 2.0.0 - جميع الحقوق محفوظة © 2024
          </p>
        </div>
      </section>
    </main>
  );
}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-emerald-700">مُعين</h1>
              <span className="mr-3 text-sm text-gray-500 hidden sm:inline">منصة حفظ وتقييم القرآن الكريم</span>
            </div>
            <nav className="flex space-x-reverse space-x-4">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-700 transition-colors">
                تسجيل الدخول
              </button>
              <button className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                ابدأ الآن
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-emerald-600">مُعين</span><br />
            منصة حفظ وتقييم القرآن الكريم
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            تعلم القرآن الكريم وتقييم تجويدك باستخدام أحدث تقنيات الذكاء الاصطناعي
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">حفظ متقدم</h3>
              <p className="text-gray-600">نظام حفظ متقدم مع تتبع التقدم وتقييم الأداء</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">تقييم بالذكاء الاصطناعي</h3>
              <p className="text-gray-600">تقييم دقيق للتجويد والنطق باستخدام الذكاء الاصطناعي</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">تحليل الأداء</h3>
              <p className="text-gray-600">إحصائيات مفصلة ومخططات التقدم لمساعدتك على التحسن</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">مجتمع تعليمي</h3>
              <p className="text-gray-600">تواصل مع الحفاظ والمتعلمين من جميع أنحاء العالم</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13 2.257a1 1 0 001.21.502l4.493 1.498a1 1 0 00.684-.949V15a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13 2.257a1 1 0 001.21.502l4.493 1.498a1 1 0 00.684-.949V9a2 2 0 012-2h3.28z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">تطبيق الهاتف</h3>
              <p className="text-gray-600">تعلم أينما كنت مع تطبيق الموبايل المتكامل</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-emerald-100 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">دعم 24/7</h3>
              <p className="text-gray-600">فريق دعم فني متخصص متاح على مدار الساعة</p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16">
            <div className="bg-emerald-600 rounded-2xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">ابدأ رحلتك اليوم</h2>
              <p className="text-xl mb-8 text-emerald-50">
                انضم إلى آلاف الحفاظ الذين يستخدمون منصة مُعين لحفظ القرآن الكريم
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors">
                  تجربة مجانية
                </button>
                <button className="bg-emerald-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-800 transition-colors">
                  الاشتراك المميز
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">مُعين</h3>
              <p className="text-gray-400 mb-4">
                منصة متقدمة لحفظ وتقييم القرآن الكريم بالذكاء الاصطناعي
              </p>
              <p className="text-gray-500 text-sm">
                © 2024 مُعين. جميع الحقوق محفوظة.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">روابط سريعة</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">حول المنصة</a></li>
                <li><a href="#" className="hover:text-white transition-colors">المميزات</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الأسعار</a></li>
                <li><a href="#" className="hover:text-white transition-colors">المدونة</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">الدعم</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">مركز المساعدة</a></li>
                <li><a href="#" className="hover:text-white transition-colors">اتصل بنا</a></li>
                <li><a href="#" className="hover:text-white transition-colors">الشروط والأحكام</a></li>
                <li><a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}