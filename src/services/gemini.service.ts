import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-3-flash-preview' 
    });
  }

  /**
   * Evaluate Quran recitation by comparing audio transcription with expected text
   */
  async evaluateQuranRecitation(
    transcription: string, 
    expectedText: string, 
    surahInfo: {
      number: number;
      name: string;
      ayahNumber?: number;
    }
  ): Promise<{
    score: number;
    feedback: string;
    mistakes: Array<{
      type: 'missing' | 'extra' | 'incorrect' | 'pronunciation';
      expected: string;
      actual: string;
      position: string;
    }>;
    accuracy: {
      wordAccuracy: number;
      tajweedAccuracy: number;
      fluencyScore: number;
    };
    suggestions: string[];
  }> {
    const evaluationPrompt = `
Act as an expert Quran recitation evaluator with deep knowledge of Tajweed rules and Arabic phonetics. Compare the student's recitation with the expected Quranic text.

**Expected Text (Surah ${surahInfo.number} - ${surahInfo.name}${surahInfo.ayahNumber ? ` Ayah ${surahInfo.ayahNumber}` : ''}):**
"${expectedText}"

**Student Recitation (Transcription):**
"${transcription}"

**Evaluation Instructions:**
1. Compare the two texts word by word
2. Check for Tajweed rule violations (ghunnah, idgham, qalqalah, madd, etc.)
3. Assess pronunciation accuracy (makharij al-huruf)
4. Evaluate fluency and rhythm
5. Identify missing words, extra words, and incorrect words

**Response Format (JSON):**
{
  "score": 0-100,
  "feedback": "Brief overall assessment",
  "mistakes": [
    {
      "type": "missing|extra|incorrect|pronunciation",
      "expected": "correct word/phrase",
      "actual": "what student said",
      "position": "beginning/middle/end"
    }
  ],
  "accuracy": {
    "wordAccuracy": 0-100,
    "tajweedAccuracy": 0-100,
    "fluencyScore": 0-100
  },
  "suggestions": ["specific improvement recommendations"]
}

Provide detailed, constructive feedback suitable for learning.
`;

    try {
      const result = await this.model.generateContent(evaluationPrompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const evaluation = JSON.parse(jsonMatch[0]);
      
      // Validate response structure
      return {
        score: Math.min(100, Math.max(0, evaluation.score || 0)),
        feedback: evaluation.feedback || 'Evaluation completed',
        mistakes: Array.isArray(evaluation.mistakes) ? evaluation.mistakes : [],
        accuracy: {
          wordAccuracy: Math.min(100, Math.max(0, evaluation.accuracy?.wordAccuracy || 0)),
          tajweedAccuracy: Math.min(100, Math.max(0, evaluation.accuracy?.tajweedAccuracy || 0)),
          fluencyScore: Math.min(100, Math.max(0, evaluation.accuracy?.fluencyScore || 0))
        },
        suggestions: Array.isArray(evaluation.suggestions) ? evaluation.suggestions : []
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('AI evaluation failed');
    }
  }

  /**
   * Get pronunciation feedback for specific words
   */
  async getPronunciationFeedback(
    word: string, 
    audioContext?: string
  ): Promise<{
    pronunciationScore: number;
    feedback: string;
    suggestions: string[];
    commonMistakes: string[];
  }> {
    const prompt = `
As an Arabic pronunciation expert, evaluate the pronunciation of the word: "${word}"

${audioContext ? `Context: ${audioContext}` : ''}

Provide detailed feedback on:
1. Correct pronunciation (makharij al-huruf)
2. Common mistakes to avoid
3. Specific improvement tips

**Response Format (JSON):**
{
  "pronunciationScore": 0-100,
  "feedback": "Brief assessment of pronunciation quality",
  "suggestions": ["specific improvement tips"],
  "commonMistakes": ["common pronunciation errors"]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const feedback = JSON.parse(jsonMatch[0]);
      
      return {
        pronunciationScore: Math.min(100, Math.max(0, feedback.pronunciationScore || 0)),
        feedback: feedback.feedback || 'Pronunciation analysis completed',
        suggestions: Array.isArray(feedback.suggestions) ? feedback.suggestions : [],
        commonMistakes: Array.isArray(feedback.commonMistakes) ? feedback.commonMistakes : []
      };
    } catch (error) {
      console.error('Pronunciation feedback error:', error);
      throw new Error('Pronunciation analysis failed');
    }
  }

  /**
   * Generate personalized practice recommendations
   */
  async generatePracticeRecommendations(
    userLevel: 'beginner' | 'intermediate' | 'advanced',
    recentScores: number[],
    weakAreas: string[],
    targetSurahs?: string[]
  ): Promise<{
    recommendations: Array<{
      type: 'surah' | 'ayah' | 'tajweed' | 'pronunciation';
      description: string;
      difficulty: 'easy' | 'medium' | 'hard';
      estimatedTime: string;
    }>;
    nextGoals: string[];
    studyPlan: Array<{
      day: number;
      focus: string;
      exercises: string[];
    }>;
  }> {
    const prompt = `
Create a personalized Quran recitation practice plan based on the user profile:

**User Level:** ${userLevel}
**Recent Scores:** ${recentScores.join(', ')}
**Weak Areas:** ${weakAreas.join(', ')}
${targetSurahs ? `**Target Surahs:** ${targetSurahs.join(', ')}` : ''}

Generate a structured practice plan with:
1. Specific recommendations based on weak areas
2. Achievable next goals
3. 7-day study plan with daily exercises

**Response Format (JSON):**
{
  "recommendations": [
    {
      "type": "surah|ayah|tajweed|pronunciation",
      "description": "specific practice recommendation",
      "difficulty": "easy|medium|hard",
      "estimatedTime": "time estimate"
    }
  ],
  "nextGoals": ["short-term achievable goals"],
  "studyPlan": [
    {
      "day": 1,
      "focus": "main focus area",
      "exercises": ["specific exercises"]
    }
  ]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const plan = JSON.parse(jsonMatch[0]);
      
      return {
        recommendations: Array.isArray(plan.recommendations) ? plan.recommendations : [],
        nextGoals: Array.isArray(plan.nextGoals) ? plan.nextGoals : [],
        studyPlan: Array.isArray(plan.studyPlan) ? plan.studyPlan : []
      };
    } catch (error) {
      console.error('Practice plan generation error:', error);
      throw new Error('Practice plan generation failed');
    }
  }

  /**
   * Analyze Tajweed compliance in recitation
   */
  async analyzeTajweedCompliance(
    transcription: string,
    expectedText: string
  ): Promise<{
    overallScore: number;
    tajweedRules: Array<{
      rule: string;
      status: 'correct' | 'partially_correct' | 'incorrect' | 'not_applied';
      examples: string[];
      feedback: string;
    }>;
    criticalMistakes: string[];
    improvementAreas: string[];
  }> {
    const prompt = `
Perform a detailed Tajweed analysis of the Quran recitation:

**Expected Text:** "${expectedText}"
**Student Recitation:** "${transcription}"

Analyze the following Tajweed rules:
1. Ghunnah (ن and م with shaddah)
2. Idgham (merging of letters)
3. Iqlab (changing ن to م before ب)
4. Ikhfa (hiding the sound of ن)
5. Qalqalah (bouncing letters ق ط ب ج د)
6. Madd (elongation of vowels)
7. Meem Sakinah rules
8. Laam Sakinah rules
9. Heavy and Light letters (تفخيم وترقيق)
10. Proper stopping (waqf) and starting (ibtida)

**Response Format (JSON):**
{
  "overallScore": 0-100,
  "tajweedRules": [
    {
      "rule": "rule name",
      "status": "correct|partially_correct|incorrect|not_applied",
      "examples": ["examples from the text"],
      "feedback": "specific feedback for this rule"
    }
  ],
  "criticalMistakes": ["most critical errors to fix"],
  "improvementAreas": ["areas needing improvement"]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid AI response format');
      }
      
      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        overallScore: Math.min(100, Math.max(0, analysis.overallScore || 0)),
        tajweedRules: Array.isArray(analysis.tajweedRules) ? analysis.tajweedRules : [],
        criticalMistakes: Array.isArray(analysis.criticalMistakes) ? analysis.criticalMistakes : [],
        improvementAreas: Array.isArray(analysis.improvementAreas) ? analysis.improvementAreas : []
      };
    } catch (error) {
      console.error('Tajweed analysis error:', error);
      throw new Error('Tajweed analysis failed');
    }
  }

  /**
   * Test API connection and basic functionality
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Test connection - respond with "OK"');
      const response = await result.response;
      const text = response.text();
      return text.includes('OK');
    } catch (error) {
      console.error('Gemini connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
let geminiService: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (!geminiService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    geminiService = new GeminiService(apiKey);
  }
  return geminiService;
}
