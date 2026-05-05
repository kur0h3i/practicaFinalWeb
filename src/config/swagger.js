import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title:       'BildyApp API',
      version:     '1.0.0',
      description: 'API REST para la digitalización de albaranes — BildyApp',
    },
    servers: [{ url: '/api', description: 'API base' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type:         'http',
          scheme:       'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Address: {
          type: 'object',
          properties: {
            street:   { type: 'string', example: 'Calle Mayor' },
            number:   { type: 'string', example: '1' },
            postal:   { type: 'string', example: '28001' },
            city:     { type: 'string', example: 'Madrid' },
            province: { type: 'string', example: 'Madrid' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id:      { type: 'string' },
            email:    { type: 'string', format: 'email' },
            name:     { type: 'string' },
            lastName: { type: 'string' },
            nif:      { type: 'string' },
            role:     { type: 'string', enum: ['admin', 'guest'] },
            status:   { type: 'string', enum: ['pending', 'verified'] },
            company:  { $ref: '#/components/schemas/Company' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            name:        { type: 'string' },
            cif:         { type: 'string' },
            address:     { $ref: '#/components/schemas/Address' },
            logo:        { type: 'string', nullable: true },
            isFreelance: { type: 'boolean' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            _id:     { type: 'string' },
            name:    { type: 'string', example: 'Constructora García S.L.' },
            cif:     { type: 'string', example: 'B12345678' },
            email:   { type: 'string', format: 'email' },
            phone:   { type: 'string' },
            address: { $ref: '#/components/schemas/Address' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            name:        { type: 'string', example: 'Reforma Nave Industrial' },
            projectCode: { type: 'string', example: 'PRJ-001' },
            client:      { $ref: '#/components/schemas/Client' },
            address:     { $ref: '#/components/schemas/Address' },
            email:       { type: 'string', format: 'email' },
            notes:       { type: 'string' },
            active:      { type: 'boolean' },
          },
        },
        Worker: {
          type: 'object',
          required: ['name', 'hours'],
          properties: {
            name:  { type: 'string' },
            hours: { type: 'number' },
          },
        },
        DeliveryNote: {
          type: 'object',
          properties: {
            _id:          { type: 'string' },
            format:       { type: 'string', enum: ['material', 'hours'] },
            description:  { type: 'string' },
            workDate:     { type: 'string', format: 'date' },
            material:     { type: 'string', nullable: true },
            quantity:     { type: 'number', nullable: true },
            unit:         { type: 'string', nullable: true },
            hours:        { type: 'number', nullable: true },
            workers:      { type: 'array', items: { $ref: '#/components/schemas/Worker' } },
            signed:       { type: 'boolean' },
            signedAt:     { type: 'string', format: 'date-time', nullable: true },
            signatureUrl: { type: 'string', nullable: true },
            pdfUrl:       { type: 'string', nullable: true },
            project:      { $ref: '#/components/schemas/Project' },
            client:       { $ref: '#/components/schemas/Client' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            totalItems:  { type: 'integer' },
            totalPages:  { type: 'integer' },
            currentPage: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            ok:      { type: 'boolean', example: false },
            code:    { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
}

export const swaggerSpec = swaggerJsdoc(options)
