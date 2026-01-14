'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import LoadingSpinner from '@/components/LoadingSpinner';
import { APIService } from '@/services/api';
import { User } from '@/types';

interface UserStats {
  totalMemorized: number;
  totalExams: number;
  averageScore: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
}

export default function ProfilePage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userResponse = await APIService.getProfile();
      // TODO: Implement getUserStats API endpoint
      // const statsResponse = await APIService.getUserStats();

      if (userResponse.success) {
        setUser(userResponse.data || null);
        setFormData({
          firstName: userResponse.data?.firstName || '',
          lastName: userResponse.data?.lastName || '',
          phone: userResponse.data?.phone || '',
          country: userResponse.data?.country || ''
        });
      }

      // TODO: Set user stats when API is implemented
      // if (statsResponse.success) {
      //   setUserStats(statsResponse.data);
      // }
    } catch (err) {
      setError('فشل في تحميل بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      country: user?.country || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await APIService.updateProfile(formData);

      if (response.success) {
        setUser(response.data || null);
        setIsEditing(false);
        
        // TODO: Refresh stats after profile update when API is implemented
        // const statsResponse = await APIService.getUserStats();
        // if (statsResponse.success) {
        //   setStats(statsResponse.data);
        // }
      } else {
        setError('فشل في تحديث الملف الشخصي');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type and size (max 5MB)
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف كبير جداً. الحد الأقصى 5 ميجابايت');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        const response = await APIService.updateProfile({
          profileImage: base64Image
        });

        if (response.success && response.data) {
          setUser(prev => ({
            ...prev!,
            profileImage: response.data?.profileImage
          }));
        } else {
          setError('فشل في رفع الصورة');
        }
        setSaving(false);
      };

      reader.onerror = () => {
        setError('فشل في قراءة الملف');
        setSaving(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('فشل في رفع الصورة');
      setSaving(false);
    }
  };

  const getSubscriptionBadge = (type: string) => {
    switch (type) {
      case 'premium': return 'bg-gradient-to-r from-purple-600 to-emerald-600 text-white';
      case 'basic': return 'bg-gradient-to-r from-blue-600 to-blue-500 text-white';
      case 'admin': return 'bg-gradient-to-r from-red-600 to-orange-600 text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getSubscriptionLabel = (type: string) => {
    switch (type) {
      case 'premium': return 'نخبة مميزة';
      case 'basic': return 'نخبة أساسية';
      case 'admin': return 'مدير';
      default: return 'مجانية';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.47-3.12M16.5 10.5a2.5 2.5 0 10-2.5 2.5 0 010-2.5 2.5M9 11l6-6-6 0v14" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            الملف الشخصي
          </h1>
          <p className="text-xl text-gray-600">
            إدارة معلوماتك وإحصائيات أدائك
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                {/* Profile Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      معلومات الشخصية
                    </h2>
                    <p className="text-gray-600">
                      {user?.email}
                    </p>
                  </div>
                  {!isEditing && (
                    <Button
                      onClick={handleEdit}
                      variant="outline"
                      size="sm"
                    >
                      تعديل
                    </Button>
                  )}
                </div>

                {/* Profile Image */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {user?.profileImage ? (
                      <img 
                        src={user.profileImage}
                        alt={user.firstName}
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-gray-300 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 01-4-4v16a4 4 0 01-4 4zm4 0a4 4 0 0118 0H6a4 4 0 0118 0v12a4 4 0 0118 0H6z" />
                        </svg>
                      </div>
                    )}
                    
                    {isEditing && (
                      <div className="absolute bottom-0 right-0">
                        <label className="bg-emerald-600 text-white px-3 py-2 rounded-full cursor-pointer hover:bg-emerald-700 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17a1 1 0 011-1h1a1 1 0 0111v1a1 1 0 0111h1a1 1 0 0111v1a1 1 0 0111-1.663.932l3-3 3-3M16 12a1 1 0 00-1.414 1.414L16 8.586a1 1 0 00-1.414-1.414v4a1 1 0 001.414 1.414H17a1 1 0 00-1.414-1.414z" />
                          </svg>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* User Details Form */}
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="الاسم الأول"
                        name="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                        required
                      />
                      <Input
                        label="الاسم الأخير"
                        name="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }))}
                        required
                      />
                    </div>
                    <div className="space-y-4">
                      <Input
                        label="رقم الهاتف"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                        placeholder="+966 500 123 4567"
                      />
                      <Input
                        label="الدولة"
                        name="country"
                        value={formData.country}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          country: e.target.value
                        }))}
                        placeholder="المملكة العربية السعودية"
                      />
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">الاسم:</span>
                      <span className="font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">البريد الإلكتروني:</span>
                      <span className="font-medium text-gray-900">{user?.email}</span>
                    </div>
                    {user?.phone && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">الهاتف:</span>
                        <span className="font-medium text-gray-900">{user?.phone}</span>
                      </div>
                    )}
                    {user?.country && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">الدولة:</span>
                        <span className="font-medium text-gray-900">{user?.country}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">تاريخ الإنضمام:</span>
                      <span className="font-medium text-gray-900">
                        {user?.createdAt ? formatDate(user.createdAt.toISOString()) : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  {isEditing && (
                    <>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="flex-1"
                      >
                        {saving ? (
                          <>
                            <LoadingSpinner size="sm" color="white" />
                            <span className="mr-3">جاري الحفظ...</span>
                          </>
                        ) : 'حفظ التغييرات'
                      }
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        disabled={saving}
                        className="flex-1"
                      >
                        إلغاء
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  الإحصائيات
                </h2>

                {stats ? (
                  <div className="space-y-6">
                    {/* Main Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-emerald-600 mb-2">
                          {stats.totalMemorized}
                        </div>
                        <div className="text-sm text-gray-600">الصفحات المحفوظة</div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {stats.totalExams}
                        </div>
                        <div className="text-sm text-gray-600">الاختبارات المجريبة</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-purple-50 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {Math.round(stats.averageScore)}%
                        </div>
                        <div className="text-sm text-gray-600">متوسط الدرجات</div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-orange-600 mb-2">
                          {stats.totalSessions}
                        </div>
                        <div className="text-sm text-gray-600">إجمالي الجلسات</div>
                      </div>
                    </div>

                    {/* Streaks */}
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        سلسلة الإنجاز
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-yellow-50 rounded-xl p-6 text-center">
                          <div className="text-2xl font-bold text-yellow-700 mb-2">
                            {stats.currentStreak}
                          </div>
                          <div className="text-sm text-gray-600">الأيام الحالية</div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-6 text-center">
                          <div className="text-2xl font-bold text-red-700 mb-2">
                            {stats.longestStreak}
                          </div>
                          <div className="text-sm text-gray-600">الأطول سلسلة</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Status */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  حالة الاشتراك
                </h2>
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl text-center ${getSubscriptionBadge(user?.subscriptionType || 'free')}`}>
                    <div className="text-2xl font-bold mb-2">
                      {getSubscriptionLabel(user?.subscriptionType || 'free')}
                    </div>
                    <div className="text-sm">
                      {user?.subscriptionType === 'free' ? 'ترقيت إلى النسخة المجانية' : 
                       user?.subscriptionType === 'basic' ? 'اشتراك أساسي يبدأ تاريخ الانتهاء: 30 يونيو 2024' :
                       user?.subscriptionType === 'premium' ? 'اشتراك متميز - لا يوجد تاريخ انتهاء' :
                       'مدير النظام'}
                    </div>
                  </div>

                  {user?.subscriptionType === 'free' && (
                    <Button className="w-full mt-4">
                      ترقية إلى النسخة المميزة
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}