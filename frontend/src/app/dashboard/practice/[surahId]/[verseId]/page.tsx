'use client';

import React from 'react';

export default function PracticePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-4">التدريب على التلاوة</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-xl text-center mb-4">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
          <p className="text-lg text-center text-gray-600">In the name of Allah, the Most Gracious, the Most Merciful</p>
          <div className="mt-6 text-center">
            <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg">
              بدء التسجيل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}