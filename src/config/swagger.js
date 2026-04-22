const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow API',
      version: '1.0.0',
      description: `
## Scalable REST API with JWT Authentication & Role-Based Access Control

### Features
- 🔐 JWT Authentication with refresh tokens
- 👥 Role-based access control (user / admin)
- ✅ Full CRUD for Tasks
- 🛡️ Input validation, rate limiting, and security headers
- 📦 API versioning at \`/api/v1/\`

### Authentication
Use the \`/api/v1/auth/login\` endpoint to get a JWT token,
then click **Authorize** and enter: \`Bearer <your_token>\`
      `,
      contact: { name: 'Anubhav', email: 'your@email.com' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token. Example: Bearer eyJhbGci...',
        },
      },
      schemas: {
        // Shared error schema
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message here' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        // Auth schemas
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'Anubhav Sharma', minLength: 2, maxLength: 50 },
            email: { type: 'string', format: 'email', example: 'anubhav@example.com' },
            password: { type: 'string', minLength: 8, example: 'Password@123', description: 'Min 8 chars, must include uppercase, lowercase, number, special char' },
          },
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'anubhav@example.com' },
            password: { type: 'string', example: 'Password@123' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                    expiresIn: { type: 'string', example: '7d' },
                  },
                },
              },
            },
          },
        },
        // User schema
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65a1b2c3d4e5f6g7h8i9j0k1' },
            name: { type: 'string', example: 'Anubhav Sharma' },
            email: { type: 'string', example: 'anubhav@example.com' },
            role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Task schemas
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65a1b2c3d4e5f6g7h8i9j0k2' },
            title: { type: 'string', example: 'Build REST API' },
            description: { type: 'string', example: 'Implement JWT auth and CRUD endpoints' },
            status: { type: 'string', enum: ['todo', 'in-progress', 'done'], example: 'in-progress' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
            dueDate: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' }, example: ['api', 'backend'] },
            owner: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTaskInput: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Build REST API', maxLength: 100 },
            description: { type: 'string', example: 'Implement authentication and CRUD', maxLength: 500 },
            status: { type: 'string', enum: ['todo', 'in-progress', 'done'], default: 'todo' },
            priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
            dueDate: { type: 'string', format: 'date-time' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
        PaginatedTasks: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                pagination: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer', example: 25 },
                    page: { type: 'integer', example: 1 },
                    limit: { type: 'integer', example: 10 },
                    totalPages: { type: 'integer', example: 3 },
                    hasNext: { type: 'boolean', example: true },
                    hasPrev: { type: 'boolean', example: false },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management (admin only for some routes)' },
      { name: 'Tasks', description: 'Task CRUD operations' },
    ],
  },
  apis: ['./src/routes/v1/*.js'],
};

module.exports = swaggerJsdoc(options);
