'use client';

import React from 'react';
import AdminLayout from '../layout';

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-4">لوحة تحكم</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">المستخدمون</h3>
            <p className="text-3xl font-bold text-emerald-600">150</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">الاختبارات</h3>
            <p className="text-3xl font-bold text-blue-600">1200</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">الجلسات</h3>
            <p className="text-3xl font-bold text-purple-600">3500</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}