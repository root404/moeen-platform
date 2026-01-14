import mongoose, { Schema, Document } from 'mongoose';

export interface IAIUsage extends Document {
  userId: mongoose.Types.ObjectId;
  operation: 'evaluation' | 'transcription' | 'pronunciation' | 'tajweed' | 'recommendations' | 'quota_addition';
  cost: number;
  metadata?: {
    surahId?: number;
    ayahNumber?: number;
    sessionId?: string;
    duration?: number;
    success?: boolean;
    refund?: boolean;
    originalConsumptionId?: string;
    reason?: string;
    adminId?: string;
    addition?: boolean;
  };
  timestamp: Date;
  quotaBefore: number;
  quotaAfter: number;
}

const AIUsageSchema = new Schema<IAIUsage>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  operation: {
    type: String,
    enum: ['evaluation', 'transcription', 'pronunciation', 'tajweed', 'recommendations', 'quota_addition'],
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  metadata: {
    surahId: Number,
    ayahNumber: Number,
    sessionId: String,
    duration: Number,
    success: Boolean,
    refund: Boolean,
    originalConsumptionId: String,
    reason: String,
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    addition: Boolean
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  quotaBefore: {
    type: Number,
    required: true
  },
  quotaAfter: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  collection: 'ai_usage'
});

// Indexes for efficient querying
AIUsageSchema.index({ userId: 1, timestamp: -1 });
AIUsageSchema.index({ operation: 1, timestamp: -1 });
AIUsageSchema.index({ timestamp: -1 });
AIUsageSchema.index({ 'metadata.refund': 1 });

const AIUsage = mongoose.model<IAIUsage>('AIUsage', AIUsageSchema);
export default AIUsage;