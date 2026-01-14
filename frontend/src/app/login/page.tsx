'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Link from 'next/link';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Implement authentication logic
    console.log('Login attempt:', formData);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-grow flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">مرحباً بعودتك</h1>
                <p className="text-gray-600">سجل الدخول إلى حسابك في منصة مُعين</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Input
                    label="البريد الإلكتروني"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                    helperText="نحن لن نشارك بريدك الإلكتروني مع أي شخص"
                  />
                </div>

                <div>
                  <Input
                    label="كلمة المرور"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="•••••••••"
                    required
                    helperText="استخدم كلمة مرور قوية على الأقل 8 أحرف"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="ml-2 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="mr-2 text-sm text-gray-700">تذكرني</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-500 font-medium">
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent"></div>
                      <span className="mr-3">جاري تسجيل الدخول...</span>
                    </div>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">أو</span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23.2c-3.08 0-5.94-.87-8.36-2.34l-3.57 2.77c2.03 1.71 4.67 2.74 7.48 2.74 2.21 0 4.29-.43 6.08-1.21l3.57 2.77c2.42-1.47 4.28-3.85 5.36-6.83L12 23.2z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C2 7.95 2.46 8.9 2.96 10.04v3.95c0 1.18.38 2.12 1.08 2.79l2.8-2.08z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1.44 12.31 1.44V5.38C12 2.43 9.73 0 6.72 0C6.4 0 6.07.01 5.76.04L2.28 3.88c.83-.51 1.8-.8 2.83-.8z"/>
                  </svg>
                  <span className="text-sm font-medium">جوجل</span>
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 ml-2" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12s5.374 12 12 12 12-5.373 12-12S18.626 0 12 0zm4.941 12.168c0-1.077-.342-1.815-.705-2.396h2.445c.064 1.14.087 2.32.087 3.526v.282c0 .082-.04.164-.125.244-.125-1.255 0-2.316-.37-3.138-.583l.842-2.414c.85.636 2.197 1.17 3.532 1.17 3.027 0 5.763-1.838 5.763-4.87l-.583-1.688c-.23-.665-.483-1.393-.756-2.168h2.418c.267 1.095.406 2.254.406 3.424 0 3.653-1.095 5.567-3.27 5.567-.706 0-1.39-.12-2.035-.34z"/>
                  </svg>
                  <span className="text-sm font-medium">فيسبوك</span>
                </button>
              </div>

              {/* Sign Up Link */}
              <div className="text-center mt-6">
                <p className="text-sm text-gray-600">
                  ليس لديك حساب؟{' '}
                  <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
                    سجل الآن
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}