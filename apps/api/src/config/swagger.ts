import swaggerJsdoc from "swagger-jsdoc";

const apiGlobBase = process.cwd().replace(/\\/g, "/");

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Waypoint API",
      version: "1.0.0",
      description: "REST API for the Waypoint project & task management platform.",
    },
    servers: [{ url: "/api/v1" }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    `${apiGlobBase}/src/modules/**/*.routes.ts`,
    `${apiGlobBase}/src/modules/**/*.routes.js`,
  ],
});
