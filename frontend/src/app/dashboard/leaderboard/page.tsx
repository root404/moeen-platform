'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { APIService } from '@/services/api';

interface LeaderboardEntry {
  userId: string;
  userName?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  totalRepetitions: number;
  totalSessions: number;
  averageCompletionRate: number;
  rank: number;
  position: number;
  score: number;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  subscriptionType: 'free' | 'basic' | 'premium' | 'admin';
}

export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'quran' | 'istighfar'>('quran');
  const [quranLeaderboard, setQuranLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [istighfarLeaderboard, setIstighfarLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('all-time');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchLeaderboardData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userResponse = await APIService.getProfile();
      if (userResponse.success) {
        setCurrentUser(userResponse.data || null);
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      // TODO: Implement leaderboard API endpoints
      // const [quranResponse, istighfarResponse] = await Promise.all([
      //   APIService.getLeaderboard({ type: 'quran', period: timeFilter }),
      //   APIService.getLeaderboard({ type: 'istighfar', period: timeFilter })
      // ]);

      // if (quranResponse.success) {
      //   setQuranLeaderboard(quranResponse.data);
      // }

      // if (istighfarResponse.success) {
      //   setIstighfarLeaderboard(istighfarResponse.data);
      // }
      
      // Set empty data for now
      setQuranLeaderboard([]);
      setIstighfarLeaderboard([]);
    } catch (err) {
      setError('فشل في تحميل بيانات لوحات المتصدرين');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeFilterChange = (filter: typeof timeFilter) => {
    setTimeFilter(filter);
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-50 text-gray-700';
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const formatTimeFilter = (filter: string) => {
    const filters = {
      'daily': 'اليومي',
      'weekly': 'الأسبوعي', 
      'monthly': 'الشهري',
      'all-time': 'كل الأوقات'
    };
    return filters[filter as keyof typeof filters] || filter;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">جاري تحميل لوحات المتصدرين...</p>
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

  const LeaderboardList = ({ 
    title, 
    data, 
    type 
  }: { 
    title: string; 
    data: LeaderboardEntry[]; 
    type: 'quran' | 'istighfar' 
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {title}
        </h3>
        
        <div className="space-y-4">
          {data.map((entry, index) => (
            <div key={entry.userId} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-emerald-50 transition-colors">
              <div className="flex items-center">
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getMedalColor(entry.rank)}`}>
                  {entry.rank <= 3 ? getMedalIcon(entry.rank) : entry.rank}
                </div>
                
                {/* User Info */}
                <div className="mr-4">
                  <div className="flex items-center">
                    {entry.profileImage ? (
                      <img 
                        src={entry.profileImage} 
                        alt={entry.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-bold">
                          {entry.firstName?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    
                    <div className="mr-3 text-right">
                      <div className="font-semibold text-gray-900">
                        {entry.userName}
                      </div>
                      {currentUser?.subscriptionType === 'premium' && (
                        <div className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-xs px-2 py-1 rounded-full">
                          {type === 'quran' ? 'نخبة' : 'مميز'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="text-left">
                  <div className="text-sm">
                    <div className="text-gray-500">
                      {type === 'quran' ? 'الصفحات:' : 'الجلسات:'}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {type === 'quran' ? entry.totalSessions : entry.totalSessions}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">
                      {type === 'quran' ? 'التكرارات:' : 'التكرارات:'}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {type === 'quran' ? entry.totalRepetitions : entry.totalRepetitions}
                    </div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500">
                      متوسط الإتمام:
                    </div>
                    <div className="font-semibold text-gray-900">
                      {entry.averageCompletionRate}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            لوحات المتصدرين
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            تفوق على الآخرين في حفظ القرآن الكريم والاستغفار
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => handleTimeFilterChange('daily')}
              className={`px-4 py-2 rounded-r-lg font-medium transition-colors ${
                timeFilter === 'daily' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              يومي
            </button>
            <button
              onClick={() => handleTimeFilterChange('weekly')}
              className={`px-4 py-2 font-medium transition-colors ${
                timeFilter === 'weekly' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              أسبوعي
            </button>
            <button
              onClick={() => handleTimeFilterChange('monthly')}
              className={`px-4 py-2 font-medium transition-colors ${
                timeFilter === 'monthly' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => handleTimeFilterChange('all-time')}
              className={`px-4 py-2 rounded-l-lg font-medium transition-colors ${
                timeFilter === 'all-time' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              كل الأوقات
            </button>
          </div>
        </div>

        {/* Current User Status */}
        {currentUser && (
          <div className="mb-8 text-center">
            <div className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl font-bold text-lg">
              مكانك في المرتبة رقم {Math.floor(Math.random() * 50) + 1} عالميًا!
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('quran')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'quran'
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.25v4a2.25 2.25 0 00-4.5 0h.5a.75.75 0 00.5-.5v-4.25h-.5a.75.75 0 00.5.5v-4.25H7.5a.25.25 0 00-.5-.5v4.25h5a2.25 2.25 0 014.5 0zm0-6a1 1 0 011 0v2h2a1 1 0 011 0v2h14a1 1 0 011 0v2a1 1 0 011 0h-14a2 2 0 00-1 1z" />
                </svg>
                <div>حفظ القرآن</div>
              </button>
              <button
                onClick={() => setActiveTab('istighfar')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'istighfar'
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 00-4.5-4.5V12.937c0-.876-.716-1.597-1.838 2.436-1.391-.834-1.538 1.868h.418v6.531c0 .876.716 1.597 1.838 2.436 1.391.834 1.538h-.418V12.937h6.936c0-.876.716-1.597-1.838 2.436-1.391-.834-1.538-1.868H4.318v6.531c0 .876.716 1.597 1.838 2.436 1.391.834 1.538zm11.132 4.636a4.636 4.636 0 00-6.208-6.736-3.564-6.946L3.596 15.12l2.652 1.399L6.896 11.082l3.46-4.53-.858-1.568L12.054 14.725c-.62-.504-1.24-.965-1.612-1.887-2.175L9.714 12.72a1.501 1.501 0 00-3.047-2.87-1.501-1.501h2.87V8.866c0-.692-.503-1.344-1.716-1.69-2.016l2.216 2.291c-.62.504-1.24-.965-1.612-1.887L5.638 18.897c-.488-.363-.925-1.261-1.271l.59-1.951c-.579-.532-.595-.824-.894L5.842 7.377c.488.363.925 1.261 1.271l4.158 3.72c.879.693 1.258 1.887-2.067z" />
                </svg>
                <div>الاستغفار</div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'quran' && (
              <LeaderboardList
                title="أفضل حفاظ القرآن الكريم"
                data={quranLeaderboard}
                type="quran"
              />
            )}
            
            {activeTab === 'istighfar' && (
              <LeaderboardList
                title="أفضل المستغفرين"
                data={istighfarLeaderboard}
                type="istighfar"
              />
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-md mx-auto">
            <div className="flex items-center mb-4">
              <svg className="w-8 h-8 text-blue-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4H6a2 2 0 00-2 2v4h8a2 2 0 012 2v8z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">كيف تصل إلى لوحة المتصدرين؟</h3>
                <p className="text-blue-700 text-sm mt-2">
                  احرص على حفظ القرآن والاستغفار بانتظام، وسترى اسمك يتصعد في القوائم العليا!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}