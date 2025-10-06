import mongoose from 'mongoose';

const viewLogSchema = new mongoose.Schema({
  viewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    enum: ['profile', 'search', 'suggestion', 'connection', 'dashboard'],
    default: 'profile'
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  sessionId: {
    type: String 
  },
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});


viewLogSchema.index({ viewedUser: 1, viewedAt: -1 });
viewLogSchema.index({ viewer: 1, viewedAt: -1 });
viewLogSchema.index({ viewedUser: 1, source: 1 });


viewLogSchema.index({ viewer: 1, viewedUser: 1, viewedAt: 1 }, { 
  unique: false,
  expireAfterSeconds: 3600 // Allow same user to view again after 1 hour
});

export default mongoose.models.ViewLog || mongoose.model('ViewLog', viewLogSchema);
