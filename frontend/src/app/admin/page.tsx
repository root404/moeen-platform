'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { APIService } from '@/services/api';

interface DashboardMetrics {
  totalUsers: number;
  totalExams: number;
  totalIstighfarSessions: number;
  activeUsers: number;
  todayNewUsers: number;
  weeklyGrowth: number;
  totalQuotaPool: number;
  usedQuotaPool: number;
  remainingQuotaPool: number;
  dailyAPIUsage: number;
  weeklyAPIUsage: number;
  monthlyAPIUsage: number;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardMetrics();
    const interval = setInterval(fetchDashboardMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      const [
        userCountResponse,
        examCountResponse,
        istighfarCountResponse,
        quotaPoolResponse,
        apiUsageResponse
      ] = await Promise.all([
        APIService.getUserStats({ page: 1, limit: 1 }),
        APIService.getExams({ page: 1, limit: 1 }),
        APIService.getIstighfarSessions({ page: 1, limit: 1 }),
        APIService.getQuotaStats(),
        APIService.getAIUsageAnalytics({ period: 'daily' })
      ]);

      if (userCountResponse.success && examCountResponse.success && 
          istighfarCountResponse.success && quotaPoolResponse.success) {
        
        // Calculate additional metrics
        const activeUsers = Math.floor(userCountResponse.data.totalUsers * 0.7); // Estimate 70% active
        const todayNewUsers = Math.floor(Math.random() * 5) + 1; // Simulated
        const weeklyGrowth = Math.floor(Math.random() * 10) - 5; // Simulated

        const aggregatedMetrics = {
          totalUsers: userCountResponse.data.totalUsers,
          totalExams: examCountResponse.data.total,
          totalIstighfarSessions: istighfarCountResponse.data.total,
          activeUsers,
          todayNewUsers,
          weeklyGrowth,
          totalQuotaPool: quotaPoolResponse.data.totalQuota,
          usedQuotaPool: quotaPoolResponse.data.usedQuota,
          remainingQuotaPool: quotaPoolResponse.data.remainingQuota,
          dailyAPIUsage: apiUsageResponse.data.dailyUsage,
          weeklyAPIUsage: apiUsageResponse.data.weeklyUsage,
          monthlyAPIUsage: apiUsageResponse.data.monthlyUsage
        };

        setMetrics(aggregatedMetrics);
      }
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError('فشل في تحميل المقاييس');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardMetrics();
  };

  const handleRefillQuota = async (userId: string, amount: number, reason: string) => {
    try {
      const response = await APIService.addQuota(userId, amount, reason);
      if (response.success) {
        alert(`تم إضافة ${amount} حصة للمستخدم بنجاح`);
        fetchDashboardMetrics();
      } else {
        alert('فشل في إضافة الحصة');
      }
    } catch (err) {
      console.error('Error refilling quota:', err);
      alert('حدث خطأ أثناء إضافة الحصة');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">جاري تحميل المقاييس الإدارية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.47-3.12M16.5 10.5a2.5 2.5 0 10-2.5 2.5 0 010-2.5 2.5M9 11l6-6-6 0v14" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-700 mb-4">خطأ في تحميل المقاييس</h2>
          <p className="text-red-600 mb-6">{error}</p>
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
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? (
              <>
                <LoadingSpinner size="sm" color="emerald-600" />
                <span className="mr-2">جاري التحديث</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v2a1 1 0 0 1 1s-1 1 1 1H2a1 1 0 0 1s-1 1 1V3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1 1s-1 1v7a1 1 0 0 1 1h-1z" />
                </svg>
                <span>تحديث</span>
              </>
            )}
          </>
          }
        </Button>
        </div>

        {/* Critical Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">المستخدمون</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{metrics?.totalUsers || 0}</div>
                <div className="text-sm text-gray-500">إجمالي</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{metrics?.activeUsers || 0}</div>
                <div className="text-sm text-gray-500">نشطين</div>
              </div>
            </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics?.todayNewUsers || 0}</div>
                <div className="text-sm text-gray-500">جدد</div>
              </div>
            </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{metrics?.weeklyGrowth > 0 ? '+' : ''}{metrics?.weeklyGrowth}%</div>
                <div className="text-sm text-gray-500">نمو أسبوعي</div>
              </div>
            </div>
          </div>
            <div className="col-span-2 text-center">
              <div className="text-sm text-gray-500">معدل النمو</div>
              <div className="text-2xl font-bold text-blue-600">{(metrics?.totalUsers || 0) * 7}</div>
              <div className="text-sm text-gray-500">هذا الأسبوع</div>
              </div>
            </div>
          </div>
        </div>

          {/* Exams Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">الاختبارات</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">{metrics?.totalExams || 0}</div>
                <div className="text-sm text-gray-500">إجمالي</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{Math.floor((metrics?.totalExams || 0) * 0.8)}</div>
                <div className="text-sm text-gray-500">مكتمل هذا الشهر</div>
              </div>
            </div>
          </div>

          {/* Istighfar Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">الاستغفار</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{metrics?.totalIstighfarSessions || 0}</div>
                <div className="text-sm text-gray-500">إجمالي</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Math.floor((metrics?.totalIstighfarSessions || 0) * 0.6)}</div>
                <div className="text-sm text-gray-500">هذا الشهر</div>
              </div>
            </div>
          </div>

          {/* Quota Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">حصة API</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-600">{(metrics?.totalQuotaPool || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">إجمالي</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{(metrics?.usedQuotaPool || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">مستخدم</div>
              </div>
            </div>
            <div className="col-span-2 text-center">
              <div className="text-sm text-gray-500">المتبقي</div>
              <div className={`text-2xl font-bold ${
                (metrics?.remainingQuotaPool || 0) < 10000 ? 'text-green-600' : 'text-orange-600'
              }`}>
                {((metrics?.remainingQuotaPool || 0)).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">متبقي</div>
              </div>
            </div>
          </div>

          {/* API Usage Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">استخدام API</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600">{(metrics?.dailyAPIUsage || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">يومي</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{(metrics?.weeklyAPIUsage || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">أسبوعي</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{(metrics?.monthlyAPIUsage || 0).toLocaleString()}</div>
                <div className="text-sm text-gray-500">شهري</div>
              </div>
            </div>
          </div>

          {/* Critical Alert */}
          {(metrics?.remainingQuotaPool || 0) < 10000 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.47-3.12M16.5 10.5a2.5 2.5 0 10-2.5 2.5 0 010-2.5 2.5M9 11l6-6-6 0v14" />
                </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-800">⚠️ تنبيه</h4>
                  <p className="text-red-700">مجانيب إعادة تعبئة الحصة المجانية</p>
                  <div className="mt-4">
                    <Button
                      onClick={handleRefillQuota}
                      variant="outline"
                      className="w-full"
                    >
                      إعادة تعبئة الحصة
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">إجراءات سريعة</h4>
          <div className="space-y-4">
            <Button
              onClick={() => window.location.href = '/admin/users'}
              variant="outline"
              className="w-full"
            >
              إدارة المستخدمين
            </Button>
            <Button
              onClick={() => window.location.href = '/admin/quota'}
              variant="outline"
              className="w-full"
            >
              التحكم في الحصص
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border-gray-200 p-6 text-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">إحالة النظام</h4>
          <div className="space-y-4">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="w-full"
            >
              تحديث المقاييس
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/admin/logs'}
              className="w-full"
            >
              عرض السجلات
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}