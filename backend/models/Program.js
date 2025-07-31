const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: String,
  expectedOutput: String,
  description: String,
  passed: {
    type: Boolean,
    default: false
  }
});

const noteSchema = new mongoose.Schema({
  topic: String,
  content: String,
  lineNumber: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const aiConversationSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const programSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  programmingLanguage: {
    type: String,
    default: 'c'
  },
  tags: [{
    type: String,
    trim: true
  }],
  testCases: [testCaseSchema],
  notes: [noteSchema],
  aiConversations: [aiConversationSchema],
  lastExecutionResult: {
    stdout: String,
    stderr: String,
    exitCode: Number,
    executionTime: Number,
    timestamp: Date
  },
  statistics: {
    totalRuns: {
      type: Number,
      default: 0
    },
    successfulRuns: {
      type: Number,
      default: 0
    },
    failedRuns: {
      type: Number,
      default: 0
    },
    averageExecutionTime: {
      type: Number,
      default: 0
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
programSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add text index for searching
programSchema.index({ title: 'text', description: 'text', tags: 'text' }, {
  weights: {
    title: 10,
    tags: 5,
    description: 1
  },
  default_language: 'english'
});
programSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Program', programSchema);