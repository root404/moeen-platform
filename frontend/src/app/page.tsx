'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleRegister = () => {
    router.push('/register');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  const handleHealthCheck = () => {
    window.open('https://moeen-api.onrender.com/health', '_blank');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-16">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-emerald-600 mb-4">
            مرحباً بكم في منصة مُعين
          </h1>
          <p className="text-xl text-gray-200">
            منصة متقدمة لحفظ وتقييم القرآن الكريم بالذكاء الاصطناعي وتقييم التجويد
          </p>
        </header>

        <section className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            ابدأ رحلتك في حفظ وتقييم القرآن الكريم
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            استخدم أحدث التقنيات مع الذكاء الاصطناعي لتقييم قراءتكم بدقة وموثوقية
          </p>
        </section>

        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 transform transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-3xl">📖</span>
                </div>
                <h3 className="text-xl font-bold text-emerald-700">التدريب على التلاوة</h3>
                <p className="text-gray-600">تدريب على تلاوة السور القرآنية مع تقييم فوري باستخدام الذكاء الاصطناعي</p>
              </div>
              <button
                onClick={handleDashboard}
                className="mt-4 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                ابدأ التدريب
              </button>
            </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 transform transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-3xl">🎙️</span>
                </div>
                <h3 className="text-xl font-bold text-blue-700">التقييم الذكي</h3>
                <p className="text-gray-600">احصل على تقييم أدائك القرآنية مع تحليل فوري وتغذية فورية</p>
              </div>
              <button
                onClick={handleDashboard}
                className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                عرض التقييمات
              </button>
            </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 transform transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-3xl">🏆</span>
                </div>
                <h3 className="text-xl font-bold text-purple-700">لوحة التحكم</h3>
                <p className="text-gray-600">إدارة المستخدمين، الإحصائيات، والإعدادات العامة للنظام</p>
              </div>
              <button
                onClick={handleDashboard}
                className="mt-4 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                لوحة التحكم
              </button>
            </div>
            </div>
          </div>
        </section>

        <section className="text-center mb-16">
          <div className="inline-flex gap-4 mb-8">
            <button
              onClick={handleLogin}
              className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors duration-200"
              >
                تسجيل الدخول
              </button>
            <button
              onClick={handleRegister}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                إنشاء حساب جديد
              </button>
          </div>
        </section>

        <section className="text-center">
          <div className="mb-8">
            <button
              onClick={handleHealthCheck}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors duration-200 text-sm"
              >
                فحص حالة النظام
              </button>
          </div>
          <p className="text-gray-500 text-sm">
            يتوفر النظام بشكل مستمر
          </p>
        </section>

        <footer className="mt-16 border-t border-gray-200 pt-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-500">
              🎉 منصة مُعين - نسخة 2.0.0 - جميع الحقوق محفوظة © 2024
            </p>
            <p className="text-gray-400 text-sm">
              منصة متقدمة لحفظ وتقييم القرآن الكريم بالذكاء الاصطناعي
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}