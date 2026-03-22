const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 5000;

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'Rental Car Booking API',
        version: '1.0.0',
        description: 'API documentation for the Rental Car Booking backend.',
    },
    servers: [
        {
            url: `http://localhost:${PORT}`,
            description: 'Development server',
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
};

const options = {
    swaggerDefinition,
    apis: [
        './routes/*.js',
        './controllers/*.js',
    ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
    swaggerUi,
    swaggerSpec,
};
