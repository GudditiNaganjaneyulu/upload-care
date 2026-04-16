import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Supabase Upload API",
      version: "1.0.0",
      description: "Centralized upload system with Supabase",
    },
    servers: [
      {
        url: "https://upload-care.onrender.com",
      },
    ],
  },
  apis: ["./src/routes/*.js"],
});