const Joi = require('joi');
const { badRequest } = require('../utils/apiResponse');

/**
 * validate(schema) - Express middleware factory for Joi validation
 * Validates req.body against the given Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,   // Return all errors, not just first
      stripUnknown: true,  // Remove unknown fields (security)
      convert: true,
    });

    if (error) {
      const errors = error.details.map((d) => d.message.replace(/"/g, "'"));
      return badRequest(res, 'Validation failed', errors);
    }

    req.body = value; // Use sanitized, converted value
    next();
  };
};

// ─── Auth Schemas ──────────────────────────────────────────────────────────────
const schemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(50).required()
      .messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required',
      }),
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required()
      .messages({ 'string.email': 'Please provide a valid email address' }),
    password: Joi.string()
      .min(8).max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character',
        'any.required': 'Password is required',
      }),
  }),

  login: Joi.object({
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  // ─── User Schemas ────────────────────────────────────────────────────────────
  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(50),
    email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim(),
  }).min(1).messages({ 'object.min': 'Provide at least one field to update' }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(8).max(128)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=])[A-Za-z\d@$!%*?&#^()_\-+=]{8,}$/)
      .required()
      .disallow(Joi.ref('currentPassword'))
      .messages({
        'any.invalid': 'New password must be different from current password',
        'string.pattern.base': 'Password must include uppercase, lowercase, number, and special character',
      }),
  }),

  // ─── Task Schemas ────────────────────────────────────────────────────────────
  createTask: Joi.object({
    title: Joi.string().trim().min(3).max(100).required()
      .messages({ 'any.required': 'Task title is required' }),
    description: Joi.string().trim().max(500).allow('').default(''),
    status: Joi.string().valid('todo', 'in-progress', 'done').default('todo'),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    dueDate: Joi.date().iso().greater('now').allow(null)
      .messages({ 'date.greater': 'Due date must be in the future' }),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(10).default([]),
  }),

  updateTask: Joi.object({
    title: Joi.string().trim().min(3).max(100),
    description: Joi.string().trim().max(500).allow(''),
    status: Joi.string().valid('todo', 'in-progress', 'done'),
    priority: Joi.string().valid('low', 'medium', 'high'),
    dueDate: Joi.date().iso().allow(null),
    tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(10),
  }).min(1).messages({ 'object.min': 'Provide at least one field to update' }),
};

module.exports = { validate, schemas };
