'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AudioRecorder from '@/components/AudioRecorder';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { APIService } from '@/services/api';

interface Verse {
  id: string;
  number: number;
  arabicText: string;
  englishTranslation?: string;
  transliteration?: string;
}

interface ExamSession {
  id: string;
  status: 'draft' | 'active' | 'completed';
  score?: number;
  maxScore: number;
  mistakes?: Array<{
    type: 'missing' | 'extra' | 'incorrect' | 'pronunciation';
    expected: string;
    actual: string;
    position: string;
  }>;
  accuracy?: {
    wordAccuracy: number;
    tajweedAccuracy: number;
    fluencyScore: number;
  };
  suggestions?: string[];
}

export default function PracticeSessionPage() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surah, setSurah] = useState<any>(null);
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const surahId = params.surahId ? parseInt(params.surahId as string) : 1;
  const verseId = params.verseId ? parseInt(params.verseId as string) : 1;

  // Fetch surah data
  useEffect(() => {
    const fetchSurahData = async () => {
      try {
        const surahResponse = await APIService.getSurahById(surahId);
        if (surahResponse.success) {
          setSurah(surahResponse.data);
          
          // Fetch current verse
          const versesResponse = await APIService.getVerses(surahId, {
            startVerse: verseId,
            endVerse: verseId,
            limit: 1
          });
          
          if (versesResponse.success && versesResponse.data.items.length > 0) {
            setCurrentVerse(versesResponse.data.items[0]);
          }
        }
      } catch (err) {
        setError('فشل في تحميل بيانات السورة');
      } finally {
        setLoading(false);
      }
    };

    fetchSurahData();
  }, [surahId, verseId]);

  // Handle recording complete
  const handleRecordingComplete = async (transcript: string, audioBlob: Blob) => {
    if (!currentVerse) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Check if we have an active session
      if (!session) {
        // Create a new exam session
        const examResponse = await APIService.createExam({
          surahId,
          startVerse: verseId,
          endVerse: verseId,
          type: 'recitation',
          difficulty: 'intermediate',
          timeLimit: 300, // 5 minutes
          maxAttempts: 3
        });

        if (examResponse.success) {
          // Start the session
          const startResponse = await APIService.startExam(examResponse.data.id);
          if (startResponse.success) {
            setSession({
              id: examResponse.data.id,
              status: 'active'
            });
          }
        }
      }

      // Submit the recitation for AI evaluation
      const evaluationResponse = await APIService.evaluateRecitation({
        audioData: audioBlob ? await blobToBase64(audioBlob) : '',
        expectedText: currentVerse.arabicText,
        surahInfo: {
          number: surahId,
          name: surah?.arabicName || '',
          ayahNumber: verseId
        }
      });

      if (evaluationResponse.success) {
        setEvaluationResult(evaluationResponse.data);
        
        // Complete the exam if we have a session
        if (session) {
          const completeResponse = await APIService.submitExam(session.id, {
            transcript,
            audioUrl: '', // Will be uploaded separately if needed
            score: evaluationResponse.data.score,
            timeTaken: 0 // Will be calculated by backend
          });

          if (completeResponse.success) {
            const finalCompleteResponse = await APIService.completeExam(session.id, {
              score: evaluationResponse.data.score,
              transcript,
              timeTaken: 0
            });

            if (finalCompleteResponse.success) {
              setSession({
                ...session,
                status: 'completed',
                score: evaluationResponse.data.score,
                maxScore: finalCompleteResponse.data.maxScore || 100
              });
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تقييم التلاوة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Get performance message based on score
  const getPerformanceMessage = (score: number) => {
    if (score >= 90) return { text: 'ممتاز!', color: 'text-green-600' };
    if (score >= 80) return { text: 'جيد جداً', color: 'text-emerald-600' };
    if (score >= 70) return { text: 'جيد', color: 'text-blue-600' };
    if (score >= 60) return { text: 'مقبول', color: 'text-yellow-600' };
    return { text: 'يحتاج إلى المزيد من التدريب', color: 'text-orange-600' };
  };

  // Restart recording
  const handleRetry = () => {
    setEvaluationResult(null);
    setError(null);
  };

  // Go to next verse
  const handleNextVerse = () => {
    if (currentVerse && surah) {
      const nextVerseId = verseId + 1;
      router.push(`/dashboard/practice/${surahId}/${nextVerseId}`);
    }
  };

  // Go to previous verse
  const handlePreviousVerse = () => {
    if (currentVerse && verseId > 1) {
      const prevVerseId = verseId - 1;
      router.push(`/dashboard/practice/${surahId}/${prevVerseId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.47-3.12M16.5 10.5a2.5 2.5 0 10-2.5 2.5 0 010-2.5 2.5M9 11l6-6-6-6 0v14" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">حدث خطأ</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="w-full">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  const performance = evaluationResult ? getPerformanceMessage(evaluationResult.score) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            جلسة التدريب
          </h1>
          <p className="text-gray-600">
            {surah?.arabicName} - الآية {verseId}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Quran Text */}
          <div className="order-2 lg:order-1">
            {/* Surah Info */}
            {surah && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {surah.arabicName}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {surah.englishName}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <span className="text-gray-500 block">السورة</span>
                    <span className="font-medium text-gray-900">#{surah.number}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">الآيات</span>
                    <span className="font-medium text-gray-900">{surah.ayahs}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">الجزء</span>
                    <span className="font-medium text-gray-900">{surah.juz}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Verse */}
            {currentVerse && (
              <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-8">
                <div className="text-center mb-4">
                  <span className="inline-block bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-medium mb-3">
                    الآية {currentVerse.number}
                  </span>
                </div>
                <div className="quran-text text-right" dir="rtl" lang="ar">
                  {currentVerse.arabicText}
                </div>
                {currentVerse.englishTranslation && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">الترجمة:</span> {currentVerse.englishTranslation}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePreviousVerse}
                disabled={verseId <= 1}
              >
                السابقة
              </Button>
              <Button
                variant="outline"
                onClick={handleNextVerse}
                disabled={currentVerse && currentVerse.number >= (surah?.ayahs || 1)}
              >
                التالية
              </Button>
            </div>
          </div>

          {/* Right Column - Recording and Results */}
          <div className="order-1 lg:order-2">
            {!evaluationResult ? (
              /* Recording Section */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  سجل تلاوتك للآية
                </h3>
                <AudioRecorder
                  onTranscriptComplete={handleRecordingComplete}
                  onRecordingStart={() => setError(null)}
                  onError={(errMsg) => setError(errMsg)}
                  disabled={isSubmitting}
                  autoSubmit={true}
                  maxDuration={120}
                />
              </div>
            ) : (
              /* Results Section */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center mb-6">
                  <div className={`text-3xl font-bold mb-2 ${performance?.color}`}>
                    {evaluationResult.score}%
                  </div>
                  <div className={`text-xl font-semibold ${performance?.color}`}>
                    {performance?.text}
                  </div>
                </div>

                {/* AI Evaluation Details */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 mb-3">تقييم الذكاء الاصطناعي</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <span className="text-gray-500 block">دقة الكلمات</span>
                          <span className="text-lg font-bold text-gray-900">
                            {evaluationResult.accuracy?.wordAccuracy || 0}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">دقة التجويد</span>
                          <span className="text-lg font-bold text-gray-900">
                            {evaluationResult.accuracy?.tajweedAccuracy || 0}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">مستوى التدفق</span>
                          <span className="text-lg font-bold text-gray-900">
                            {evaluationResult.accuracy?.fluencyScore || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mistakes */}
                  {evaluationResult.mistakes && evaluationResult.mistakes.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">الأخطاء المحددة</h4>
                      <div className="bg-red-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <ul className="space-y-2 text-right">
                          {evaluationResult.mistakes.map((mistake, index) => (
                            <li key={index} className="flex items-start justify-between">
                              <span className="text-sm text-gray-700 ml-3">
                                {mistake.expected}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                mistake.type === 'missing' ? 'bg-orange-200 text-orange-700' :
                                mistake.type === 'extra' ? 'bg-blue-200 text-blue-700' :
                                mistake.type === 'incorrect' ? 'bg-red-200 text-red-700' :
                                'bg-yellow-200 text-yellow-700'
                              }`}>
                                {mistake.type === 'missing' ? 'ناقص' :
                                 mistake.type === 'extra' ? 'زائد' :
                                 mistake.type === 'incorrect' ? 'خطأ' : 'نطق'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {evaluationResult.suggestions && evaluationResult.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">توصيات التحسن</h4>
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <ul className="space-y-2 text-right">
                          {evaluationResult.suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-gray-700 ml-3 flex items-start">
                              <svg className="w-4 h-4 text-emerald-500 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 110 5.292M15 21H3v-1a6 6 0 012 0v1zm0 0h6v-1a6 6 0 01-2 2h2a2 2 0 012 2v10m-6 0a2 2 0 012 2v10m6 2a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="flex-1"
                    >
                      إعادة التسجيل
                    </Button>
                    <Button
                      onClick={handleNextVerse}
                      className="flex-1"
                    >
                      الآية التالية
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-900 font-medium">جاري تقييم تلاوتك...</p>
                <p className="text-sm text-gray-500 mt-2">
                  قد تستغرق هذه العملية بضع ثواني
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}