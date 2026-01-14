'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { APIService } from '@/services/api';

interface Surah {
  id: number;
  number: number;
  name: string;
  arabicName: string;
  englishName: string;
  ayahs: number;
  juz: number;
  revelationType: 'mekkan' | 'medinan';
}

export default function DashboardPage() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await APIService.getSurahs({ limit: 114 });
        if (response.success) {
          setSurahs(response.data.items);
        } else {
          setError('فشل في تحميل السور');
        }
      } catch (err) {
        setError('حدث خطأ أثناء تحميل السور');
      } finally {
        setLoading(false);
      }
    };

    fetchSurahs();
  }, []);

  // Group surahs by juz for better organization
  const groupByJuz = (surahs: Surah[]) => {
    const grouped: { [key: number]: Surah[] } = {};
    
    surahs.forEach(surah => {
      const juzKey = surah.juz || 0;
      if (!grouped[juzKey]) {
        grouped[juzKey] = [];
      }
      grouped[juzKey].push(surah);
    });
    
    return grouped;
  };

  const surahsByJuz = groupByJuz(surahs);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">جاري تحميل السور...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">حدث خطأ</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          اختار سورة للتدريب
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          اختر السورة التي تريد تدريبها على حفظها وتقييم تجويدك بالذكاء الاصطناعي
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
          <div className="text-3xl font-bold text-emerald-600 mb-2">114</div>
          <div className="text-gray-900 font-semibold">إجمالي السور</div>
          <div className="text-gray-600 text-sm">سور القرآن الكريم</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
          <div className="text-3xl font-bold text-blue-600 mb-2">30</div>
          <div className="text-gray-900 font-semibold">الأجزاء</div>
          <div className="text-gray-600 text-sm">أجزاء القرآن</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
          <div className="text-3xl font-bold text-purple-600 mb-2">6236</div>
          <div className="text-gray-900 font-semibold">إجمالي الآيات</div>
          <div className="text-gray-600 text-sm">آيات القرآن الكريم</div>
        </div>
      </div>

      {/* Surahs Grid */}
      <div className="space-y-8">
        {/* Juz 1 - المكية */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-emerald-700">الجزء الأول (السور المكية)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(surahsByJuz[1] || []).map((surah) => (
              <Link
                key={surah.id}
                href={`/dashboard/practice/${surah.id}`}
                className="block bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-lg font-bold text-gray-900 group-hover:text-emerald-700">
                      {surah.arabicName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {surah.englishName}
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                    {surah.number}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الآيات:</span>
                    <span className="font-medium text-gray-900">{surah.ayahs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">نوع الوحي:</span>
                    <span className="font-medium text-gray-900">
                      {surah.revelationType === 'mekkan' ? 'مكي' : 'مدني'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">الجزء:</span>
                    <span className="font-medium text-gray-900">الجزء {surah.juz}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center pt-4">
                  <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                    ابدأ التدريب
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Other Juzs */}
        {[2, 3, 4, 5, 6, 7, 8, 9, 10].filter(juzNum => surahsByJuz[juzNum]?.length > 0).map(juzNum => (
          <div key={juzNum}>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-emerald-700">
              الجزء {juzNum}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {(surahsByJuz[juzNum] || []).map((surah) => (
                <Link
                  key={surah.id}
                  href={`/dashboard/practice/${surah.id}`}
                  className="block bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-lg font-bold text-gray-900 group-hover:text-emerald-700">
                        {surah.arabicName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {surah.englishName}
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                      {surah.number}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">الآيات:</span>
                      <span className="font-medium text-gray-900">{surah.ayahs}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">نوع الوحي:</span>
                      <span className="font-medium text-gray-900">
                        {surah.revelationType === 'mekkan' ? 'مكي' : 'مدني'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center pt-4">
                    <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                      ابدأ التدريب
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}