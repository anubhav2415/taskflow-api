const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in-progress', 'done'],
        message: 'Status must be todo, in-progress, or done',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high'],
        message: 'Priority must be low, medium, or high',
      },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v > new Date();
        },
        message: 'Due date must be in the future',
      },
    },
    tags: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Cannot have more than 10 tags',
      },
      set: (tags) => [...new Set(tags.map((t) => t.toLowerCase().trim()))], // dedup & normalize
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task must belong to a user'],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes for common queries ────────────────────────────────────────────────
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, priority: 1 });
taskSchema.index({ owner: 1, createdAt: -1 });
taskSchema.index({ title: 'text', description: 'text', tags: 'text' }); // Full-text search

// ─── Virtual: isOverdue ────────────────────────────────────────────────────────
taskSchema.virtual('isOverdue').get(function () {
  return this.dueDate && this.dueDate < new Date() && this.status !== 'done';
});

// ─── Query helper: exclude archived by default ─────────────────────────────────
taskSchema.pre(/^find/, function (next) {
  if (!this.getQuery().isArchived) {
    this.where({ isArchived: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
