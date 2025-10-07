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
  userAgent: {
    type: String
  },
  count: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});


viewLogSchema.index({ viewedUser: 1, viewedAt: -1 });
viewLogSchema.index({ viewer: 1, viewedAt: -1 });
viewLogSchema.index({ viewedUser: 1, source: 1 });


// keep one rolling document per viewer/viewedUser (no time constraint)
viewLogSchema.index({ viewer: 1, viewedUser: 1 }, { unique: true });

export default mongoose.models.ViewLog || mongoose.model('ViewLog', viewLogSchema);
