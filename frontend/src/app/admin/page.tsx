'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/app/admin/layout';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

interface DashboardMetrics {
  totalUsers: number;
  totalExams: number;
  totalSessions: number;
  systemHealth: string;
}

export default function AdminPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalExams: 0,
    totalSessions: 0,
    systemHealth: 'loading'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading metrics
    setTimeout(() => {
      setMetrics({
        totalUsers: 150,
        totalExams: 1200,
        totalSessions: 3500,
        systemHealth: 'healthy'
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              لوحة تحكم مُعين
            </h1>
            <p className="text-gray-600">
              نظام إدارة منصة حفظ وتقييم القرآن الكريم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                إجمالي المستخدمين
              </h3>
              <p className="text-3xl font-bold text-emerald-600">
                {metrics.totalUsers.toLocaleString('ar-SA')}
              </p>
              <p className="text-sm text-gray-500">مستخدم نشط</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                إجمالي الاختبارات
              </h3>
              <p className="text-3xl font-bold text-blue-600">
                {metrics.totalExams.toLocaleString('ar-SA')}
              </p>
              <p className="text-sm text-gray-500">اختبار مكتمل</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                جلسات الاستغفار
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {metrics.totalSessions.toLocaleString('ar-SA')}
              </p>
              <p className="text-sm text-gray-500">جلسة هذا الشهر</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                حالة النظام
              </h3>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  metrics.systemHealth === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`font-medium ${
                  metrics.systemHealth === 'healthy' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.systemHealth === 'healthy' ? 'سليم' : 'هناك مشكلة'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              تحديث البيانات
            </Button>
          </div>
        </div>
      </AdminLayout>
    </div>
  );
}