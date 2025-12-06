import http from "http";
import app from "./app.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 5008;

// Start server only after MongoDB connection is established
const startServer = async () => {
  try {
    const server = http.createServer(app);

    server.on("listening", () => {
      logger.info(`🚀 Backend running on port ${PORT}`);
    });

    server.on("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        logger.error(
          `Port ${PORT} is already in use. Kill the process using the port or set a different PORT environment variable.`
        );
        process.exit(1);
      }
      logger.error(`Server error: ${err && err.message ? err.message : err}`);
      process.exit(1);
    });

    server.listen(PORT);
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
