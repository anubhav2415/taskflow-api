/**
 * Standardized API response helpers
 * All responses follow: { success, message, data, pagination? }
 */

const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, pagination = null } = {}) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

const sendError = (res, { statusCode = 500, message = 'Internal server error', errors = null } = {}) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

// Pre-built common responses
const responses = {
  ok: (res, data, message = 'Success') => sendSuccess(res, { statusCode: 200, message, data }),
  created: (res, data, message = 'Resource created successfully') => sendSuccess(res, { statusCode: 201, message, data }),
  noContent: (res) => res.status(204).send(),

  badRequest: (res, message = 'Bad request', errors = null) => sendError(res, { statusCode: 400, message, errors }),
  unauthorized: (res, message = 'Unauthorized. Please log in.') => sendError(res, { statusCode: 401, message }),
  forbidden: (res, message = 'Access denied. Insufficient permissions.') => sendError(res, { statusCode: 403, message }),
  notFound: (res, message = 'Resource not found') => sendError(res, { statusCode: 404, message }),
  conflict: (res, message = 'Resource already exists') => sendError(res, { statusCode: 409, message }),
  tooMany: (res, message = 'Too many requests') => sendError(res, { statusCode: 429, message }),
  serverError: (res, message = 'Internal server error') => sendError(res, { statusCode: 500, message }),
};

module.exports = { sendSuccess, sendError, ...responses };
