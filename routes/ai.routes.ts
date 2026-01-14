import { Router } from 'express';
import { aiController, audioUploadMiddleware } from '../controllers/ai.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { rateLimitMiddleware } from '../middleware/rateLimit.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { 
  aiValidationSchemas,
  evaluateRecitationSchema,
  transcribeAudioSchema,
  pronunciationFeedbackSchema,
  tajweedAnalysisSchema,
  practiceRecommendationsSchema,
  aiUsageAnalyticsSchema,
  quotaCheckSchema
} from '../validators/ai.validators';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

// Apply AI-specific rate limiting (more restrictive than general endpoints)
const aiRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 AI requests per 15 minutes
  message: 'Too many AI requests, please try again later',
  skipSuccessfulRequests: true
});

// Apply AI rate limiting to all AI endpoints
router.use(aiRateLimit);

/**
 * @route POST /api/ai/evaluate-recitation
 * @desc Evaluate Quran recitation using AI
 * @access Private
 */
router.post('/evaluate-recitation',
  audioUploadMiddleware,
  validateRequest(evaluateRecitationSchema),
  aiController.evaluateRecitation.bind(aiController)
);

/**
 * @route POST /api/ai/transcribe-audio
 * @desc Transcribe audio to text
 * @access Private
 */
router.post('/transcribe-audio',
  audioUploadMiddleware,
  validateRequest(transcribeAudioSchema),
  aiController.transcribeAudio.bind(aiController)
);

/**
 * @route POST /api/ai/pronunciation-feedback
 * @desc Get pronunciation feedback for specific words
 * @access Private
 */
router.post('/pronunciation-feedback',
  validateRequest(pronunciationFeedbackSchema),
  aiController.getPronunciationFeedback.bind(aiController)
);

/**
 * @route POST /api/ai/analyze-tajweed
 * @desc Analyze Tajweed compliance in recitation
 * @access Private
 */
router.post('/analyze-tajweed',
  validateRequest(tajweedAnalysisSchema),
  aiController.analyzeTajweed.bind(aiController)
);

/**
 * @route POST /api/ai/practice-recommendations
 * @desc Generate personalized practice recommendations
 * @access Private
 */
router.post('/practice-recommendations',
  validateRequest(practiceRecommendationsSchema),
  aiController.getPracticeRecommendations.bind(aiController)
);

/**
 * @route GET /api/ai/usage-analytics
 * @desc Get user's AI usage analytics
 * @access Private
 */
router.get('/usage-analytics',
  validateRequest(aiUsageAnalyticsSchema, 'query'),
  aiController.getAIUsageAnalytics.bind(aiController)
);

/**
 * @route GET /api/ai/check-quota
 * @desc Check quota availability for AI operations
 * @access Private
 */
router.get('/check-quota',
  validateRequest(quotaCheckSchema, 'query'),
  aiController.checkQuotaAvailability.bind(aiController)
);

/**
 * @route GET /api/ai/test-connection
 * @desc Test AI service connection
 * @access Private
 */
router.get('/test-connection',
  aiController.testAIConnection.bind(aiController)
);

// Error handling for multer upload errors
router.use((error: any, req: any, res: any, next: any) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File size too large. Maximum size is 10MB.',
      error: 'File size limit exceeded'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      message: 'Too many files uploaded.',
      error: 'File count limit exceeded'
    });
  }
  
  if (error.message === 'Invalid file type. Only audio files are allowed.') {
    return res.status(415).json({
      success: false,
      message: error.message,
      error: 'Invalid file type'
    });
  }
  
  next(error);
});

export default router;