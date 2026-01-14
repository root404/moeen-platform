'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { APIService } from '@/services/api';

interface IstighfarSession {
  id: string;
  userId: string;
  durationSeconds: number;
  countedRepetitions: number;
  targetRepetitions: number;
  sessionType: 'personal' | 'guided' | 'challenge';
  startTime: Date;
  endTime?: Date;
  completionRate?: number;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export default function IstighfarPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<IstighfarSession[]>([]);
  const [activeSession, setActiveSession] = useState<IstighfarSession | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentCount, setCurrentCount] = useState(0);
  const [targetCount, setTargetCount] = useState(33);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<'personal' | 'guided' | 'challenge'>('personal');
  const [customTarget, setCustomTarget] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning && activeSession) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000);
        const remaining = Math.max(0, 1800 - elapsed); // 30 minutes max
        setTimeLeft(remaining);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, activeSession]);

  const fetchSessions = async () => {
    try {
      const response = await APIService.getIstighfarSessions({
        sessionType
      });
      
      if (response.success && response.data) {
        setSessions(response.data.items || []);
      } else {
        setError('فشل في تحميل جلسات الاستغفار');
      }
    } catch (err) {
      setError('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    const target = sessionType === 'personal' ? 
      parseInt(customTarget) || targetCount : 
      targetCount;

    if (!target || target < 1) {
      setError('يرجى إدخال عدد التكرارات (على الأقل 1)');
      return;
    }

    try {
      const response = await APIService.createIstighfarSession({
        targetRepetitions: target,
        sessionType,
        notes: sessionType === 'personal' ? `جلسة شخصية - الهدف: ${target} استغفارة` : ''
      });

      if (response.success) {
        // Start the session
        const startResponse = await APIService.startIstighfarSession(response.data.id);
        if (startResponse.success) {
          setActiveSession({
            ...response.data,
            startTime: new Date(startResponse.data.startTime)
          });
          setCurrentCount(0);
          setIsRunning(true);
          setTimeLeft(1800); // 30 minutes in seconds
          setError(null);
        }
      }
    } catch (err: any) {
      setError('فشل في بدء الجلسة');
    }
  };

  const stopSession = async () => {
    if (!activeSession) return;

    try {
      const finalDuration = Math.floor((Date.now() - new Date(activeSession.startTime).getTime()) / 1000);
      const finalRepetitions = currentCount;
      const completionRate = Math.min(100, Math.round((finalRepetitions / activeSession.targetRepetitions) * 100));

      const response = await APIService.completeIstighfarSession(activeSession.id, {
        finalDuration,
        finalRepetitions
      });

      if (response.success) {
        setActiveSession(null);
        setIsRunning(false);
        setTimeLeft(0);
        setCurrentCount(0);
        
        // Refresh sessions list
        fetchSessions();
      }
    } catch (err: any) {
      setError('فشل في إنهاء الجلسة');
    }
  };

  const handleIncrement = () => {
    if (currentCount < targetCount) {
      setCurrentCount(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (currentCount > 0) {
      setCurrentCount(prev => prev - 1);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case 'personal': return 'bg-emerald-600 text-white';
      case 'guided': return 'bg-blue-600 text-white';
      case 'challenge': return 'bg-purple-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'personal': return 'شخصي';
      case 'guided': return 'موجه';
      case 'challenge': return 'تحدي';
      default: return type;
    }
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 100) return 'text-emerald-600';
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 80) return 'text-blue-500';
    if (rate >= 70) return 'text-yellow-500';
    return 'text-orange-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">جاري تحميل جلسات الاستغفار...</p>
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            جلسات الاستغفار
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ذكر الله وادعوه بقلب خاشع وطاهر
          </p>
        </div>

        {/* Session Type Selector */}
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setSessionType('personal')}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  sessionType === 'personal' 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                شخصي
              </button>
              <button
                onClick={() => setSessionType('guided')}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  sessionType === 'guided' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                موجه
              </button>
              <button
                onClick={() => setSessionType('challenge')}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  sessionType === 'challenge' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                تحدي
              </button>
            </div>
          </div>

          {/* Personal Session Setup */}
          {sessionType === 'personal' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  جلسة استغفار شخصية
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      عدد التكرارات المستهدف
                    </label>
                    <div className="flex items-center justify-center space-x-4">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={customTarget || targetCount}
                        onChange={(e) => {
                          setCustomTarget(e.target.value);
                          setTargetCount(parseInt(e.target.value) || 33);
                        }}
                        className="w-24 px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        dir="ltr"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setTargetCount(33)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          33
                        </button>
                        <button
                          onClick={() => setTargetCount(66)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          66
                        </button>
                        <button
                          onClick={() => setTargetCount(99)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          99
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    اختر عدد التكرارات أو حدد هدفًا مخصصًا
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Session Area */}
        {!activeSession ? (
          /* Session Setup - Not Started */
          <div className="text-center">
            <Button
              onClick={startSession}
              disabled={sessionType === 'personal' && (!customTarget && targetCount === 33)}
              size="lg"
              className="w-full max-w-md"
            >
              {sessionType === 'personal' ? 'ابدأ جلسة شخصية' : 
               sessionType === 'guided' ? 'ابدأ جلسة موجهة' : 'ابدأ جلسة تحدي'}
            </Button>
          </div>
        ) : (
          /* Active Session */
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              {/* Session Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSessionTypeColor(sessionType)}`}>
                    {getSessionTypeLabel(sessionType)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mr-3">
                    {sessionType === 'personal' ? 'جلسة شخصية' : 
                     sessionType === 'guided' ? 'جلسة موجهة' : 'جلسة تحدي'}
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-500 text-sm">
                    الوقت المتبقي:
                  </span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 text-sm">
                    التقدم:
                  </span>
                  <span className={`text-lg font-bold ${getCompletionRateColor(
                    Math.round((currentCount / activeSession.targetRepetitions) * 100)
                  )}`}>
                    {currentCount} / {activeSession.targetRepetitions}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-emerald-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (currentCount / activeSession.targetRepetitions) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Counter Controls */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-4 bg-gray-100 rounded-xl p-6">
                  <button
                    onClick={handleDecrement}
                    disabled={currentCount === 0}
                    className="w-16 h-16 bg-red-500 text-white rounded-full text-2xl font-bold hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                  </button>
                  <div className="text-4xl font-bold text-gray-900 mx-8">
                    {currentCount}
                  </div>
                  <button
                    onClick={handleIncrement}
                    disabled={currentCount >= activeSession.targetRepetitions}
                    className="w-16 h-16 bg-emerald-600 text-white rounded-full text-2xl font-bold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  استخدم + أو - لزيادة أو نقصان العدد
                </p>
              </div>

              {/* Stop Button */}
              <div className="text-center">
                <Button
                  onClick={stopSession}
                  variant="outline"
                  size="lg"
                  className="w-full max-w-md"
                >
                  إنهاء الجلسة
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            الجلسات السابقة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.slice(0, 9).map((session) => (
              <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSessionTypeColor(session.sessionType)}`}>
                      {getSessionTypeLabel(session.sessionType)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mr-3">
                      جلسة الاستغفار
                    </h3>
                  </div>
                  <div className="text-right text-sm">
                    {new Date(session.createdAt).toLocaleDateString('ar-SA')}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">التكرارات:</span>
                    <span className="font-medium text-gray-900">
                      {session.countedRepetitions} / {session.targetRepetitions}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">المدة:</span>
                    <span className="font-medium text-gray-900">
                      {session.durationSeconds ? Math.floor(session.durationSeconds / 60) : 0} دقيقة
                    </span>
                  </div>
                  {session.completionRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">الإتمام:</span>
                      <span className={`font-bold ${getCompletionRateColor(session.completionRate)}`}>
                        {session.completionRate}%
                      </span>
                    </div>
                  )}
                </div>
                
                {session.notes && (
                  <div className="pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">ملاحظات:</span> {session.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}