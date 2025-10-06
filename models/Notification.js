import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  icon: String,
  link: String,
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  source: String, // e.g., 'system', 'connection', 'message'
  dedupeKey: {
    type: String,
    index: true
  },
  expiresAt: Date
}, {
  timestamps: true
});

// Unique dedupe per user
notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });
// Sort by newest
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);


