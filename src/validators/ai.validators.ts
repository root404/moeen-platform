import Joi from 'joi';

// AI Recitation Evaluation Schemas
export const evaluateRecitationSchema = Joi.object({
  audioData: Joi.string()
    .pattern(/^data:audio\/(webm|wav|mp3|ogg);base64,/)
    .required()
    .messages({
      'string.pattern.base': 'Audio data must be a valid base64 encoded audio file',
      'any.required': 'Audio data is required'
    }),
  
  expectedText: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Expected text cannot be empty',
      'string.max': 'Expected text must be less than 2000 characters',
      'any.required': 'Expected text is required'
    }),
  
  surahInfo: Joi.object({
    number: Joi.number()
      .integer()
      .min(1)
      .max(114)
      .required()
      .messages({
        'number.base': 'Surah number must be a number',
        'number.integer': 'Surah number must be an integer',
        'number.min': 'Surah number must be between 1 and 114',
        'number.max': 'Surah number must be between 1 and 114',
        'any.required': 'Surah number is required'
      }),
    
    name: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.min': 'Surah name cannot be empty',
        'string.max': 'Surah name must be less than 100 characters',
        'any.required': 'Surah name is required'
      }),
    
    ayahNumber: Joi.number()
      .integer()
      .min(1)
      .max(286)
      .optional()
      .messages({
        'number.base': 'Ayah number must be a number',
        'number.integer': 'Ayah number must be an integer',
        'number.min': 'Ayah number must be at least 1',
        'number.max': 'Ayah number cannot exceed 286'
      })
  }).required()
});

// Audio Transcription Schema
export const transcribeAudioSchema = Joi.object({
  audioData: Joi.string()
    .pattern(/^data:audio\/(webm|wav|mp3|ogg);base64,/)
    .required()
    .messages({
      'string.pattern.base': 'Audio data must be a valid base64 encoded audio file',
      'any.required': 'Audio data is required'
    }),
  
  language: Joi.string()
    .valid('ar-SA', 'ar', 'en-US', 'en')
    .default('ar-SA')
    .messages({
      'any.only': 'Language must be one of: ar-SA, ar, en-US, en'
    }),
  
  enhanceQuality: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Enhance quality must be a boolean'
    })
});

// Pronunciation Feedback Schema
export const pronunciationFeedbackSchema = Joi.object({
  word: Joi.string()
    .min(1)
    .max(50)
    .pattern(/[\u0600-\u06FF\s]+/) // Arabic characters and spaces
    .required()
    .messages({
      'string.min': 'Word cannot be empty',
      'string.max': 'Word must be less than 50 characters',
      'string.pattern.base': 'Word must contain Arabic characters only',
      'any.required': 'Word is required'
    }),
  
  audioData: Joi.string()
    .pattern(/^data:audio\/(webm|wav|mp3|ogg);base64,/)
    .optional()
    .messages({
      'string.pattern.base': 'Audio data must be a valid base64 encoded audio file'
    }),
  
  context: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Context must be less than 500 characters'
    })
});

// Tajweed Analysis Schema
export const tajweedAnalysisSchema = Joi.object({
  transcription: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Transcription cannot be empty',
      'string.max': 'Transcription must be less than 2000 characters',
      'any.required': 'Transcription is required'
    }),
  
  expectedText: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Expected text cannot be empty',
      'string.max': 'Expected text must be less than 2000 characters',
      'any.required': 'Expected text is required'
    }),
  
  detailedAnalysis: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Detailed analysis must be a boolean'
    })
});

// Practice Recommendations Schema
export const practiceRecommendationsSchema = Joi.object({
  userLevel: Joi.string()
    .valid('beginner', 'intermediate', 'advanced')
    .required()
    .messages({
      'any.only': 'User level must be one of: beginner, intermediate, advanced',
      'any.required': 'User level is required'
    }),
  
  recentScores: Joi.array()
    .items(Joi.number().min(0).max(100))
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.min': 'At least one recent score is required',
      'array.max': 'Cannot provide more than 20 recent scores',
      'number.min': 'Scores must be between 0 and 100',
      'number.max': 'Scores must be between 0 and 100',
      'any.required': 'Recent scores are required'
    }),
  
  weakAreas: Joi.array()
    .items(
      Joi.string().valid(
        'pronunciation', 'tajweed', 'fluency', 'memorization', 
        'rhythm', 'makharij', 'ghunnah', 'madd', 'qalqalah'
      )
    )
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'At least one weak area must be specified',
      'array.max': 'Cannot specify more than 10 weak areas',
      'any.only': 'Weak areas must be from the predefined list',
      'any.required': 'Weak areas are required'
    }),
  
  targetSurahs: Joi.array()
    .items(Joi.number().integer().min(1).max(114))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot specify more than 10 target surahs',
      'number.min': 'Surah numbers must be between 1 and 114',
      'number.max': 'Surah numbers must be between 1 and 114'
    }),
  
  practiceGoals: Joi.array()
    .items(
      Joi.string().valid(
        'improve_fluency', 'master_tajweed', 'memorize_surahs', 
        'perfect_pronunciation', 'prepare_exams', 'daily_practice'
      )
    )
    .max(5)
    .optional()
    .messages({
      'array.max': 'Cannot specify more than 5 practice goals',
      'any.only': 'Practice goals must be from the predefined list'
    })
});

// AI Usage Analytics Schema
export const aiUsageAnalyticsSchema = Joi.object({
  period: Joi.string()
    .valid('daily', 'weekly', 'monthly')
    .default('monthly')
    .messages({
      'any.only': 'Period must be one of: daily, weekly, monthly'
    }),
  
  startDate: Joi.date()
    .optional()
    .messages({
      'date.base': 'Start date must be a valid date'
    }),
  
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .optional()
    .messages({
      'date.base': 'End date must be a valid date',
      'date.min': 'End date must be after start date'
    })
});

// Quota Management Schemas
export const addQuotaSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'User ID must be a valid MongoDB ObjectId',
      'any.required': 'User ID is required'
    }),
  
  amount: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.integer': 'Amount must be an integer',
      'number.min': 'Amount must be at least 1',
      'number.max': 'Amount cannot exceed 10000',
      'any.required': 'Amount is required'
    }),
  
  reason: Joi.string()
    .min(1)
    .max(200)
    .required()
    .messages({
      'string.min': 'Reason cannot be empty',
      'string.max': 'Reason must be less than 200 characters',
      'any.required': 'Reason is required'
    })
});

export const resetQuotaSchema = Joi.object({
  userId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'User ID must be a valid MongoDB ObjectId'
    }),
  
  allUsers: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'All users must be a boolean'
    })
}).xor('userId', 'allUsers').messages({
  'object.xor': 'Either userId or allUsers must be provided, not both'
});

// Audio Processing Schemas
export const processAudioSchema = Joi.object({
  audioData: Joi.string()
    .pattern(/^data:audio\/(webm|wav|mp3|ogg);base64,/)
    .required()
    .messages({
      'string.pattern.base': 'Audio data must be a valid base64 encoded audio file',
      'any.required': 'Audio data is required'
    }),
  
  enhance: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Enhance must be a boolean'
    }),
  
  normalize: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Normalize must be a boolean'
    }),
  
  noiseReduction: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Noise reduction must be a boolean'
    })
});

// Batch Operations Schema
export const batchEvaluationSchema = Joi.object({
  evaluations: Joi.array()
    .items(
      Joi.object({
        audioData: Joi.string()
          .pattern(/^data:audio\/(webm|wav|mp3|ogg);base64,/)
          .required(),
        
        expectedText: Joi.string()
          .min(1)
          .max(2000)
          .required(),
        
        surahInfo: Joi.object({
          number: Joi.number().integer().min(1).max(114).required(),
          name: Joi.string().min(1).max(100).required(),
          ayahNumber: Joi.number().integer().min(1).max(286).optional()
        }).required()
      })
    )
    .min(1)
    .max(10)
    .required()
    .messages({
      'array.min': 'At least one evaluation is required',
      'array.max': 'Cannot process more than 10 evaluations at once',
      'any.required': 'Evaluations array is required'
    })
});

// General Error Response Schema for validation
export const aiErrorResponseSchema = Joi.object({
  success: Joi.boolean().valid(false).required(),
  message: Joi.string().required(),
  error: Joi.object({
    type: Joi.string().required(),
    details: Joi.array().items(Joi.string()),
    code: Joi.string(),
    timestamp: Joi.date()
  }).required()
});

// Quota Check Schema
export const quotaCheckSchema = Joi.object({
  operation: Joi.string()
    .valid('evaluation', 'transcription', 'pronunciation', 'tajweed', 'recommendations')
    .required()
    .messages({
      'any.only': 'Operation must be one of: evaluation, transcription, pronunciation, tajweed, recommendations',
      'any.required': 'Operation is required'
    })
});

// Export all schemas
export const aiValidationSchemas = {
  evaluateRecitation: evaluateRecitationSchema,
  transcribeAudio: transcribeAudioSchema,
  pronunciationFeedback: pronunciationFeedbackSchema,
  tajweedAnalysis: tajweedAnalysisSchema,
  practiceRecommendations: practiceRecommendationsSchema,
  aiUsageAnalytics: aiUsageAnalyticsSchema,
  addQuota: addQuotaSchema,
  resetQuota: resetQuotaSchema,
  processAudio: processAudioSchema,
  batchEvaluation: batchEvaluationSchema,
  quotaCheck: quotaCheckSchema,
  errorResponse: aiErrorResponseSchema
};