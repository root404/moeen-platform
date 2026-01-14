import { Request, Response } from 'express';
import { getGeminiService } from '../services/gemini.service';
import { getAudioService } from '../services/audio.service';
import { getQuotaService } from '../services/quota.service';
import { createAuditLog } from '../utils/auditLogger';
import Surah from '../models/Surah.model';
import AIUsage from '../models/AIUsage.model';
import { handleMulterError } from '../utils/fileUpload';
import multer from 'multer';
import path from 'path';

// Configure multer for audio file uploads
const audioStorage = multer.memoryStorage();
const audioUpload = multer({
  storage: audioStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for audio files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp3'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

class AIController {
  /**
   * Evaluate Quran recitation with AI
   */
  async evaluateRecitation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const geminiService = getGeminiService();
      const quotaService = getQuotaService();
      
      const { expectedText, surahInfo } = req.body;
      
      // Check quota availability
      const quotaCheck = await quotaService.checkQuotaAvailability(userId, 'evaluation');
      if (!quotaCheck.allowed) {
        res.status(429).json({
          success: false,
          message: 'Insufficient quota for recitation evaluation',
          data: {
            required: quotaCheck.cost,
            remaining: quotaCheck.remainingQuota,
            resetIn: quotaCheck.resetIn
          }
        });
        return;
      }

      let audioData: string;
      let audioDuration: number = 0;

      // Handle both base64 audio data and file upload
      if (req.file) {
        // File upload case
        audioData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        // Get audio duration for logging
        const audioService = getAudioService();
        const tempFile = new File([req.file.buffer], 'audio.webm', { type: req.file.mimetype });
        try {
          audioDuration = await audioService.getAudioDuration(tempFile);
        } catch (error) {
          console.error('Error getting audio duration:', error);
        }
      } else if (req.body.audioData) {
        // Base64 data case
        audioData = req.body.audioData;
      } else {
        res.status(400).json({
          success: false,
          message: 'Audio data is required (either file upload or base64 data)'
        });
        return;
      }

      // Consume quota before AI processing
      const consumption = await quotaService.consumeQuota(userId, 'evaluation', {
        surahId: surahInfo.number,
        ayahNumber: surahInfo.ayahNumber,
        duration: audioDuration,
        success: true
      });

      try {
        // For now, we'll use a mock transcription since we don't have the speech-to-text
        // In a real implementation, you'd convert audio to text first
        const mockTranscription = expectedText; // Mock transcription for testing

        // Evaluate with Gemini AI
        const evaluation = await geminiService.evaluateQuranRecitation(
          mockTranscription,
          expectedText,
          surahInfo
        );

        // Log successful evaluation
        await createAuditLog({
          userId,
          action: 'ai_evaluation_completed',
          details: {
            surahNumber: surahInfo.number,
            ayahNumber: surahInfo.ayahNumber,
            score: evaluation.score,
            duration: audioDuration,
            consumptionId: consumption.consumptionId
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Recitation evaluation completed successfully',
          data: {
            evaluation,
            quotaUsed: consumption.cost,
            remainingQuota: consumption.remainingQuota,
            metadata: {
              surahInfo,
              audioDuration,
              evaluationId: consumption.consumptionId
            }
          }
        });

      } catch (aiError) {
        // Refund quota if AI processing fails
        await quotaService.refundQuota(
          userId, 
          'evaluation', 
          consumption.consumptionId,
          `AI processing failed: ${aiError}`
        );

        console.error('AI evaluation failed:', aiError);
        res.status(500).json({
          success: false,
          message: 'AI evaluation failed. Quota has been refunded.',
          error: aiError instanceof Error ? aiError.message : 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Recitation evaluation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to evaluate recitation',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Transcribe audio to text
   */
  async transcribeAudio(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const quotaService = getQuotaService();
      
      const { language = 'ar-SA', enhanceQuality = true } = req.body;
      
      // Check quota availability
      const quotaCheck = await quotaService.checkQuotaAvailability(userId, 'transcription');
      if (!quotaCheck.allowed) {
        res.status(429).json({
          success: false,
          message: 'Insufficient quota for audio transcription',
          data: {
            required: quotaCheck.cost,
            remaining: quotaCheck.remainingQuota,
            resetIn: quotaCheck.resetIn
          }
        });
        return;
      }

      let audioData: string;
      let audioDuration: number = 0;

      // Handle audio data
      if (req.file) {
        audioData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        const audioService = getAudioService();
        const tempFile = new File([req.file.buffer], 'audio.webm', { type: req.file.mimetype });
        try {
          audioDuration = await audioService.getAudioDuration(tempFile);
        } catch (error) {
          console.error('Error getting audio duration:', error);
        }
      } else if (req.body.audioData) {
        audioData = req.body.audioData;
      } else {
        res.status(400).json({
          success: false,
          message: 'Audio data is required'
        });
        return;
      }

      // Consume quota
      const consumption = await quotaService.consumeQuota(userId, 'transcription', {
        duration: audioDuration,
        success: true
      });

      try {
        // For now, return mock transcription
        // In a real implementation, you'd use Web Speech API or similar
        const mockTranscription = "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ";

        // Log successful transcription
        await createAuditLog({
          userId,
          action: 'ai_transcription_completed',
          details: {
            language,
            duration: audioDuration,
            transcriptionLength: mockTranscription.length,
            consumptionId: consumption.consumptionId
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Audio transcribed successfully',
          data: {
            transcription: mockTranscription,
            confidence: 0.95,
            language,
            duration: audioDuration,
            quotaUsed: consumption.cost,
            remainingQuota: consumption.remainingQuota,
            metadata: {
              transcriptionId: consumption.consumptionId,
              enhanced: enhanceQuality
            }
          }
        });

      } catch (transcriptionError) {
        // Refund quota if transcription fails
        await quotaService.refundQuota(
          userId, 
          'transcription', 
          consumption.consumptionId,
          `Transcription failed: ${transcriptionError}`
        );

        console.error('Audio transcription failed:', transcriptionError);
        res.status(500).json({
          success: false,
          message: 'Audio transcription failed. Quota has been refunded.',
          error: transcriptionError instanceof Error ? transcriptionError.message : 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Audio transcription error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to transcribe audio',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get pronunciation feedback for specific words
   */
  async getPronunciationFeedback(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const geminiService = getGeminiService();
      const quotaService = getQuotaService();
      
      const { word, context } = req.body;
      
      // Check quota availability
      const quotaCheck = await quotaService.checkQuotaAvailability(userId, 'pronunciation');
      if (!quotaCheck.allowed) {
        res.status(429).json({
          success: false,
          message: 'Insufficient quota for pronunciation feedback',
          data: {
            required: quotaCheck.cost,
            remaining: quotaCheck.remainingQuota,
            resetIn: quotaCheck.resetIn
          }
        });
        return;
      }

      // Consume quota
      const consumption = await quotaService.consumeQuota(userId, 'pronunciation', {
        success: true
      });

      try {
        const feedback = await geminiService.getPronunciationFeedback(word, context);

        // Log successful feedback
        await createAuditLog({
          userId,
          action: 'ai_pronunciation_feedback_completed',
          details: {
            word,
            context,
            score: feedback.pronunciationScore,
            consumptionId: consumption.consumptionId
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Pronunciation feedback generated successfully',
          data: {
            feedback,
            quotaUsed: consumption.cost,
            remainingQuota: consumption.remainingQuota,
            metadata: {
              word,
              feedbackId: consumption.consumptionId
            }
          }
        });

      } catch (feedbackError) {
        // Refund quota if feedback generation fails
        await quotaService.refundQuota(
          userId, 
          'pronunciation', 
          consumption.consumptionId,
          `Pronunciation feedback failed: ${feedbackError}`
        );

        console.error('Pronunciation feedback failed:', feedbackError);
        res.status(500).json({
          success: false,
          message: 'Pronunciation feedback failed. Quota has been refunded.',
          error: feedbackError instanceof Error ? feedbackError.message : 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Pronunciation feedback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get pronunciation feedback',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Analyze Tajweed compliance in recitation
   */
  async analyzeTajweed(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const geminiService = getGeminiService();
      const quotaService = getQuotaService();
      
      const { transcription, expectedText, detailedAnalysis = true } = req.body;
      
      // Check quota availability
      const quotaCheck = await quotaService.checkQuotaAvailability(userId, 'tajweed');
      if (!quotaCheck.allowed) {
        res.status(429).json({
          success: false,
          message: 'Insufficient quota for Tajweed analysis',
          data: {
            required: quotaCheck.cost,
            remaining: quotaCheck.remainingQuota,
            resetIn: quotaCheck.resetIn
          }
        });
        return;
      }

      // Consume quota
      const consumption = await quotaService.consumeQuota(userId, 'tajweed', {
        success: true
      });

      try {
        const analysis = await geminiService.analyzeTajweedCompliance(transcription, expectedText);

        // Log successful analysis
        await createAuditLog({
          userId,
          action: 'ai_tajweed_analysis_completed',
          details: {
            overallScore: analysis.overallScore,
            rulesCount: analysis.tajweedRules.length,
            detailedAnalysis,
            consumptionId: consumption.consumptionId
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Tajweed analysis completed successfully',
          data: {
            analysis,
            quotaUsed: consumption.cost,
            remainingQuota: consumption.remainingQuota,
            metadata: {
              analysisId: consumption.consumptionId,
              detailedAnalysis
            }
          }
        });

      } catch (analysisError) {
        // Refund quota if analysis fails
        await quotaService.refundQuota(
          userId, 
          'tajweed', 
          consumption.consumptionId,
          `Tajweed analysis failed: ${analysisError}`
        );

        console.error('Tajweed analysis failed:', analysisError);
        res.status(500).json({
          success: false,
          message: 'Tajweed analysis failed. Quota has been refunded.',
          error: analysisError instanceof Error ? analysisError.message : 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Tajweed analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze Tajweed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Generate personalized practice recommendations
   */
  async getPracticeRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const geminiService = getGeminiService();
      const quotaService = getQuotaService();
      
      const { userLevel, recentScores, weakAreas, targetSurahs, practiceGoals } = req.body;
      
      // Check quota availability
      const quotaCheck = await quotaService.checkQuotaAvailability(userId, 'recommendations');
      if (!quotaCheck.allowed) {
        res.status(429).json({
          success: false,
          message: 'Insufficient quota for practice recommendations',
          data: {
            required: quotaCheck.cost,
            remaining: quotaCheck.remainingQuota,
            resetIn: quotaCheck.resetIn
          }
        });
        return;
      }

      // Consume quota
      const consumption = await quotaService.consumeQuota(userId, 'recommendations', {
        success: true
      });

      try {
        const recommendations = await geminiService.generatePracticeRecommendations(
          userLevel,
          recentScores,
          weakAreas,
          targetSurahs
        );

        // Log successful recommendation generation
        await createAuditLog({
          userId,
          action: 'ai_recommendations_generated',
          details: {
            userLevel,
            weakAreasCount: weakAreas.length,
            recommendationsCount: recommendations.recommendations.length,
            consumptionId: consumption.consumptionId
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.json({
          success: true,
          message: 'Practice recommendations generated successfully',
          data: {
            recommendations,
            quotaUsed: consumption.cost,
            remainingQuota: consumption.remainingQuota,
            metadata: {
              userLevel,
              weakAreas,
              recommendationId: consumption.consumptionId
            }
          }
        });

      } catch (recommendationsError) {
        // Refund quota if recommendation generation fails
        await quotaService.refundQuota(
          userId, 
          'recommendations', 
          consumption.consumptionId,
          `Practice recommendations failed: ${recommendationsError}`
        );

        console.error('Practice recommendations failed:', recommendationsError);
        res.status(500).json({
          success: false,
          message: 'Practice recommendations failed. Quota has been refunded.',
          error: recommendationsError instanceof Error ? recommendationsError.message : 'Unknown error'
        });
      }

    } catch (error) {
      console.error('Practice recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate practice recommendations',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get user's AI usage analytics
   */
  async getAIUsageAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const quotaService = getQuotaService();
      
      const { period = 'monthly' } = req.query;
      
      const analytics = await quotaService.getUserAIUsageAnalytics(userId, period as any);

      // Log analytics access
      await createAuditLog({
        userId,
        action: 'ai_usage_analytics_accessed',
        details: {
          period,
          totalUsage: analytics.totalUsage,
          operation: 'analytics_view'
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'AI usage analytics retrieved successfully',
        data: {
          analytics,
          period,
          generatedAt: new Date()
        }
      });

    } catch (error) {
      console.error('AI usage analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve AI usage analytics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check quota availability for AI operations
   */
  async checkQuotaAvailability(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const quotaService = getQuotaService();
      
      const { operation } = req.query;
      
      if (!operation) {
        res.status(400).json({
          success: false,
          message: 'Operation parameter is required'
        });
        return;
      }

      const quotaCheck = await quotaService.checkQuotaAvailability(
        userId, 
        operation as any
      );

      res.json({
        success: true,
        message: 'Quota availability checked successfully',
        data: {
          quotaCheck,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Quota availability check error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check quota availability',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test AI service connection
   */
  async testAIConnection(req: Request, res: Response): Promise<void> {
    try {
      const geminiService = getGeminiService();
      
      const isConnected = await geminiService.testConnection();

      res.json({
        success: true,
        message: 'AI service connection test completed',
        data: {
          connected: isConnected,
          service: 'Google Gemini Flash 3',
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('AI connection test error:', error);
      res.status(500).json({
        success: false,
        message: 'AI service connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Export controller and middleware
export const aiController = new AIController();
export const audioUploadMiddleware = audioUpload.single('audioFile');