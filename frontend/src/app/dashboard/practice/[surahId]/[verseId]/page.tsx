'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AudioRecorder from '@/components/AudioRecorder';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import AdminLayout from '@/app/admin/layout';

interface Verse {
  id: number;
  text: string;
  translation: string;
}

interface EvaluationResult {
  score: number;
  feedback: string;
  mistakes: string[];
  suggestions: string[];
}

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();
  const [surahId, setSurahId] = useState<string>('');
  const [verseId, setVerseId] = useState<string>('');
  const [verse, setVerse] = useState<Verse | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.surahId && params.verseId) {
      setSurahId(params.surahId as string);
      setVerseId(params.verseId as string);
      
      // Mock verse data
      const mockVerse: Verse = {
        id: parseInt(params.verseId as string),
        text: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",
        translation: "In the name of Allah, the Most Gracious, the Most Merciful"
      };
      setVerse(mockVerse);
      setLoading(false);
    }
  }, [params]);

  const getPerformanceMessage = (score: number): string => {
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 70) return 'جيد';
    if (score >= 60) return 'متوسط';
    return 'يحتاج إلى تحسين';
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    // Mock AI evaluation
    setTimeout(() => {
      const mockResult: EvaluationResult = {
        score: 85,
        feedback: 'قراءة ممتازة مع أداء جيد',
        mistakes: ['بعض الأخطاء في النطق'],
        suggestions: ['التركيز على مخارج الحروف', 'التمهل في القراءة']
      };
      setEvaluationResult(mockResult);
      setIsProcessing(false);
    }, 2000);
  };

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
              التدريب على التلاوة
            </h1>
            <p className="text-gray-600">
              سورة {surahId} - آية {verseId}
            </p>
          </div>

          {verse && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="text-right mb-6">
                <p className="text-2xl font-bold text-gray-900 leading-loose">
                  {verse.text}
                </p>
                <p className="text-lg text-gray-600 mt-4">
                  {verse.translation}
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
              سجل التلاوة
            </h2>
            
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
            />

            {isProcessing && (
              <div className="mt-6 text-center">
                <LoadingSpinner />
                <p className="text-gray-600 mt-2">جاري تحليل التسجيل...</p>
              </div>
            )}

            {evaluationResult && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  نتيجة التقييم
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-emerald-600 mb-2">
                      {evaluationResult.score}%
                    </div>
                    <div className={`text-lg font-medium ${
                      evaluationResult.score >= 80 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {getPerformanceMessage(evaluationResult.score)}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      ملاحظات
                    </h4>
                    <p className="text-gray-600 mb-4">
                      {evaluationResult.feedback}
                    </p>
                    
                    {evaluationResult.mistakes.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-600 mb-2">
                          الأخطاء:
                        </h5>
                        <ul className="list-disc list-inside text-gray-600">
                          {evaluationResult.mistakes.map((mistake, index) => (
                            <li key={index}>{mistake}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {evaluationResult.suggestions.length > 0 && (
                      <div>
                        <h5 className="font-medium text-blue-600 mb-2">
                          اقتراحات:
                        </h5>
                        <ul className="list-disc list-inside text-gray-600">
                          {evaluationResult.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-center">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => router.push('/admin')}
              >
                العودة إلى لوحة التحكم
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </div>
  );
}