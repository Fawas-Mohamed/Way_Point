import swaggerJsdoc from "swagger-jsdoc";
import path from "node:path";

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
    path.join(__dirname, "../modules/**/*.routes.ts"),
    path.join(__dirname, "../modules/**/*.routes.js"),
  ],
});
