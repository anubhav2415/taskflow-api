const Task = require('../models/task.model');
const { ok, created, noContent, badRequest, notFound, forbidden } = require('../utils/apiResponse');

/**
 * GET /api/v1/tasks
 * Users see their own tasks; admins see all tasks
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      status, priority, search,
      page = 1, limit = 10,
      sortBy = 'createdAt', order = 'desc',
      tags,
    } = req.query;

    // ─── Build filter ──────────────────────────────────────────────────────────
    const filter = {};

    // Non-admins can only see their own tasks
    if (req.user.role !== 'admin') {
      filter.owner = req.user._id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (tags) filter.tags = { $in: tags.split(',').map((t) => t.trim()) };

    // Full-text search
    if (search) {
      filter.$text = { $search: search };
    }

    // ─── Pagination ────────────────────────────────────────────────────────────
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // cap at 50
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'priority', 'dueDate'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // ─── Execute query ─────────────────────────────────────────────────────────
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('owner', 'name email')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return ok(res, {
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/tasks/:id
 */
const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('owner', 'name email');

    if (!task) return notFound(res, 'Task not found');

    // Non-admins can only view their own tasks
    if (req.user.role !== 'admin' && task.owner._id.toString() !== req.user._id.toString()) {
      return forbidden(res, 'You do not have permission to view this task');
    }

    return ok(res, { task });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/tasks
 */
const createTask = async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      owner: req.user._id,
    });

    await task.populate('owner', 'name email');

    return created(res, { task }, 'Task created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/tasks/:id
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return notFound(res, 'Task not found');

    // Non-admins can only update their own tasks
    if (req.user.role !== 'admin' && task.owner.toString() !== req.user._id.toString()) {
      return forbidden(res, 'You do not have permission to update this task');
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');

    return ok(res, { task: updated }, 'Task updated successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/tasks/:id
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return notFound(res, 'Task not found');

    // Non-admins can only delete their own tasks
    if (req.user.role !== 'admin' && task.owner.toString() !== req.user._id.toString()) {
      return forbidden(res, 'You do not have permission to delete this task');
    }

    await task.deleteOne();

    return ok(res, null, 'Task deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/tasks/stats  (admin only)
 */
const getTaskStats = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgPriority: {
            $avg: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'low'] }, then: 1 },
                  { case: { $eq: ['$priority', 'medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'high'] }, then: 3 },
                ],
                default: 0,
              },
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const total = await Task.countDocuments();
    const overdue = await Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'done' } });

    return ok(res, { stats, total, overdue });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getTaskStats };
