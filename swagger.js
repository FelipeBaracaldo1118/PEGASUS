const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Gestión de Sesiones de Testing',
      version: '1.0.0',
      description: 'API para gestionar sesiones de testing, testers y asignaciones',
      contact: {
        name: 'Tu Nombre',
        email: 'tu@email.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'http://10.13.46.195:8080',
        description: 'Servidor local de red'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'EPAM-HaruyoshieE' },
            email: { type: 'string', example: 'haruyoshi@epam.com' },
            role: { type: 'string', enum: ['tester', 'keytester'], example: 'tester' },
            avatar: { type: 'string', example: 'https://i.pravatar.cc/150?img=1' }
          }
        },
        Session: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'baseball' },
            backend: { type: 'string', example: 'baseball' },
            build: { type: 'string', example: '++Fortnite+Release-38.10-CL-47160256' },
            buildIdOverride: { type: 'integer', example: 42069 },
            sessionType: { type: 'string', enum: ['normal', 'lwm'], example: 'normal' },
            scheduledTime: { type: 'string', format: 'date-time', example: '2024-01-15T13:00:00Z' },
            description: { type: 'string', example: 'Sesión de pruebas de baseball' },
            status: { type: 'string', enum: ['upcoming', 'active', 'finished'], example: 'upcoming' }
          }
        },
        Assignment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            sessionId: { type: 'integer', example: 1 },
            testerId: { type: 'integer', example: 1 },
            device: { type: 'string', example: 'PC' },
            capturas: { type: 'string', example: 'Performance' },
            grupo: { type: 'string', example: 'A' },
            team: { type: 'string', example: 'Blue' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Mensaje de error' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './server.js'] // Rutas donde están tus endpoints
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };