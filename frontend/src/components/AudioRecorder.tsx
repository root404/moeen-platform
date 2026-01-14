'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AudioRecorderProps {
  onTranscriptComplete: (transcript: string, audioBlob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onRecordingComplete?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  autoSubmit?: boolean;
  maxDuration?: number; // in seconds
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
}

declare global {
  interface SpeechRecognition {
    new (): SpeechRecognition;
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: Event) => void;
    onstart: (event: Event) => void;
    onend: (event: Event) => void;
    onaudioend?: (event: Event) => void;
    onaudiostart?: (event: Event) => void;
  }

  interface SpeechRecognitionStatic {
    new (): SpeechRecognition;
  }
  
  var SpeechRecognition: SpeechRecognitionStatic;
  var webkitSpeechRecognition: SpeechRecognitionStatic;
}

export default function AudioRecorder({
  onTranscriptComplete,
  onRecordingStart,
  onRecordingStop,
  onRecordingComplete,
  onError,
  disabled = false,
  autoSubmit = true,
  maxDuration = 120, // 2 minutes default
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check browser support
  const isSpeechRecognitionSupported = useCallback(() => {
    return typeof window !== 'undefined' && 
           (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
  }, []);

  // Check microphone permission
  const checkMicrophonePermission = useCallback(async () => {
    try {
      setPermissionStatus('checking');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus('granted');
    } catch (error) {
      console.error('Microphone permission error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setPermissionStatus('denied');
        } else {
          setPermissionStatus('prompt');
        }
      }
      setPermissionStatus('denied');
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!isSpeechRecognitionSupported()) {
      onError?.('متصفحك لا يدعم التعرف على الكلام. يرجى استخدام متصفح أحدث.');
      return;
    }

    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || 
                                        (window as any).webkitSpeechRecognition;
    
    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ar-SA'; // Arabic (Saudi Arabia)
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const results = event.results as any;
        const result = results[i];
        if (result.isFinal) {
          finalTranscript = result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
      } else if (interimTranscript) {
        setTranscript(prev => prev + interimTranscript);
      }
    };

    recognition.onerror = (event: Event) => {
      console.error('Speech recognition error:', event);
      const errorMessage = 'حدث خطأ في التعرف على الكلام. يرجى المحاولة مرة أخرى.';
      onError?.(errorMessage);
      if (isRecording) {
        handleStopRecording();
      }
    };

    recognition.onstart = () => {
      console.log('Speech recognition started');
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
    };

    recognitionRef.current = recognition;
  }, [isRecording, onError]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      // Check microphone permission first
      await checkMicrophonePermission();

      if (permissionStatus === 'denied') {
        onError?.('تم رفض إذن الميكروفون. يرجى السماح بالوصول إلى الميكروفون في إعدادات المتصفح.');
        return;
      }

      // Get media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1
        }
      });

      // Setup media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        // Convert blob to base64 for API submission
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Remove the data URL prefix
          const base64Audio = base64data.split(',')[1];
          
          // Convert base64 back to Blob
          const byteCharacters = atob(base64Audio);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const audioBlob = new Blob([byteArray], { type: 'audio/webm' });
          
          // Submit transcript and audio
          onTranscriptComplete?.(transcript, audioBlob);
          
          if (autoSubmit) {
            onRecordingComplete?.();
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start media recorder
      mediaRecorder.start(100); // Collect data every 100ms
      startTimeRef.current = Date.now();

      setIsRecording(true);
      setRecordingTime(0);
      onRecordingStart?.();

      // Start timer for recording duration
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
        
        // Auto-stop if max duration reached
        if (elapsed >= maxDuration) {
          handleStopRecording();
        }
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      onError?.('فشل بدء التسجيل. يرجى التحقق من إعدادات الميكروفون.');
    }
  }, [
    transcript, 
    autoSubmit, 
    maxDuration, 
    permissionStatus, 
    checkMicrophonePermission,
    onRecordingStart,
    onRecordingComplete,
    onError
  ]);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    onRecordingStop?.();
    setIsProcessing(true);

    // Clear processing state after a short delay
    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  }, [onRecordingStop]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  // Format recording time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      {/* Permission Status */}
      {permissionStatus === 'denied' && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.47-3.12M16.5 10.5a2.5 2.5 0 10-2.5 2.5 0 010-2.5 2.5M9 11l6-6-6-6 0v14" />
            </svg>
            <span className="mr-3 text-red-700 font-medium">
              تم رفض إذن الميكروفون
            </span>
          </div>
          <p className="text-red-600 text-sm mt-2 mr-3">
            يرجى السماح بالوصول إلى الميكروفون في إعدادات متصفحك للمتابعة.
          </p>
        </div>
      )}

      {/* Transcript Display */}
      <div className="mb-6">
        <div className="relative bg-white border-2 border-gray-200 rounded-lg p-4 min-h-32">
          {transcript ? (
            <>
              <div className="absolute top-2 left-2 text-xs text-gray-500 mr-3">
                النص المحدد:
              </div>
              <p className="text-right text-gray-900 leading-relaxed text-lg" dir="rtl" lang="ar">
                {transcript}
              </p>
              <button
                onClick={clearTranscript}
                className="absolute top-2 left-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                مسح
              </button>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-8 h-8 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7 0 017 0h14a7 7 0 010 0v-7M9 21a7 7 0 11-7 0v-7m14 14v7a7 7 0 01-7 0h-14z" />
              </svg>
              <p className="text-gray-600">ابدأ التسجيل ليظهر النص هنا</p>
            </div>
          )}
        </div>
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="flex items-center justify-center mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
              <span className="text-red-500 font-medium">جاري التسجيل...</span>
              <span className="mr-3 text-gray-600">({formatTime(recordingTime)})</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled || permissionStatus === 'checking' || isProcessing}
            className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {permissionStatus === 'checking' ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span className="mr-3">فحص الإذن...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7 0 017 0h14a7 7 0 010 0v-7M9 21a7 7 0 11-7 0v-7m14 14v7a7 7 0 01-7 0h-14z" />
                </svg>
                <span className="mr-3">ابدأ التسجيل</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 12.79a9 9 0 1118.58 0 8.58 8.58 0 111.42-12.79z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15.71l3.536-3.536M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="mr-3">إيقاف التسجيل</span>
          </button>
        )}

        {isProcessing && (
          <div className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg">
            <LoadingSpinner size="sm" color="white" />
            <span className="mr-3">جاري المعالجة...</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center">
        <div className="inline-block bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
          <h4 className="font-semibold text-blue-800 mb-2 mr-3">تعليمات:</h4>
          <ul className="text-right text-blue-700 text-sm space-y-2">
            <li>تحدث بوضوح وبسرعة معقولة</li>
            <li>اجعل الميكروفون قريبًا من فمك</li>
            <li>تحدث في مكان هادئ بدون ضوضاء</li>
            <li>الحد الأقصى للتسجيل هو {Math.floor(maxDuration / 60)} دقيقة</li>
          </ul>
        </div>
      </div>

      {/* Browser Support Warning */}
      {!isSpeechRecognitionSupported() && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 3.47-3.12M16.5 10.5a2.5 2.5 0 10-2.5 2.5 0 010-2.5 2.5M9 11l6-6-6-6 0v14" />
            </svg>
            <span className="mr-3 text-yellow-700 font-medium">
              المتصفح غير مدعوم
            </span>
          </div>
          <p className="text-yellow-700 text-sm mt-2 mr-3">
            يرجى استخدام متصفح حديث مثل Chrome, Firefox, أو Safari لاستخدام ميزة التسجيل الصوتي.
          </p>
        </div>
      )}
    </div>
  );
}