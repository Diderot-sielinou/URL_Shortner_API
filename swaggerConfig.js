import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv'
dotenv.config()

const swaggerOptions = {
  definition: {
    openapi: '3.0.0', // OpenAPI version
    info: {
      title: 'short link REST API',
      version: '1.0.0',
      description: 'A simple REST API: A link shortening application that makes it easy to share links across different platforms. Create your user account, log in, and generate short links from your original links.',
      contact: {
        name: 'API Support',
        url: 'https://github.com/Diderot-sielinou', 
         email: 'diderotsielinou@gmail.com', 
      },
      license: { // Optional
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [ // Add server information
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/api-docs`, // Adjust if your base path differs
        description: 'Development server',
      },
      // Add other servers like staging or production if needed
    ],
    components: { // Define reusable components like security schemes
      securitySchemes: {
        bearerAuth: { // Name of the security scheme
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Format of the token
          description: 'Enter JWT Bearer token **_only_**'
        }
      },
      schemas: { // Define reusable schemas for request/response bodies
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'User ID' },
            firstName: { type: 'string', description: 'User\'s first name' },
            lastName: { type: 'string', description: 'User\'s last name' },
            email: { type: 'string', format: 'email', description: 'User\'s email address',example:" john.doe@example.com" },
            phone:{type:'string',description:" customer number"},
            address:{type:'string',description:" addresse client"},
            profileImageUrl: { type: 'string', format: 'url', nullable: true, description: 'URL of the user\'s profile image' },
            createdAt: { type: 'string', format: 'date-time', description: 'Timestamp of user creation' },
          },
          required: ['id', 'firstName', 'lastName', 'email', 'createdAt']
        },
        shortLink: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Task ID' },
            userId: { type: 'string', format: 'uuid', description: 'ID of the user who owns the task' },
            shortCode:{type:"string",format:"VARCHAR",maxLength: 10 ,description:"unique short code for short link "},
            expiresDate: { type: 'string', format: 'date', nullable: true, description: 'expirement date of the short link must remain the following schema ("DD/MM/YYYY HH:MM")or ("DD/MM/YYYY HH:MM")' },
            shortLink: { type: 'string', format: 'url' },
            originalUrl: { type: 'string', format: 'uri' },
            clickCount: { type: 'integer', minimum: 0 },
            createdAt: { type: 'string', format: 'date-time', description: 'Timestamp of task creation' },
            updatedAt: { type: 'string', format: 'date-time', description: 'Timestamp of last task update' },
          },
          required: ['id', 'user_id', 'title', 'completed', 'created_at', 'updated_at']
        },
        LoginRequest: {
          type: 'object',
          properties: {
            message:{type:"string"},
            UserId:{
              id: { type: 'string', format: 'uuid', description: 'user id' },
            },
          },
          required: ['email', 'password']
        },
        AuthResponse: {
          type: 'object',
          properties: {
            message:{type:"string"},
            token: {
              type: 'string',
              description: 'JWT à utiliser dans le header Authorization',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
            },
            user: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        ClickLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            shortCode: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            ip: { type: 'string', format: 'ipv4' },
            userAgent: { type: 'string' },
            referer: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: ['id', 'short_code', 'timestamp']
        },
        
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Error message' },
          }
        }
      }
    },
    security: [ // Apply security globally (can be overridden per operation)
      {
        bearerAuth: [] // Requires bearerAuth for all routes unless specified otherwise
      }
    ]
  },
  // Path to the API docs files that contain OpenAPI annotations
  apis: ['./routes/*.js'], // Looks for JSDoc comments in all .js files in the routes directory
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec; 
