import mongoose from 'mongoose';

const connectionRequestSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'withdrawn'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 500
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});


connectionRequestSchema.index({ fromUser: 1, toUser: 1 });
connectionRequestSchema.index({ toUser: 1, status: 1 });
connectionRequestSchema.index({ fromUser: 1, status: 1 });

// Prevent duplicate requests
connectionRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

export default mongoose.models.ConnectionRequest || mongoose.model('ConnectionRequest', connectionRequestSchema);
