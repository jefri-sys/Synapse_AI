const mongoose = require('mongoose');

const groupMessageSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.messageType !== 'system' && !this.isAIMessage; }
  },
  message: {
    type: String,
    required: true
  },
  isAIMessage: {
    type: Boolean,
    default: false
  },
  aiFeature: {
    type: String,
    enum: ['event_planner', 'exam_planner', 'qa_answer', 'answer_eval', null],
    default: null
  },
  messageType: {
    type: String,
    enum: ['text', 'summary', 'image', 'video', 'audio', 'document', 'system'],
    default: 'text'
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  fileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  reactions: {
    type: Map,
    of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

groupMessageSchema.index({ groupId: 1, createdAt: 1 });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
