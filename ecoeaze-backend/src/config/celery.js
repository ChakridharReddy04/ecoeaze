// src/config/celery.js
import axios from "axios";
import logger from "./logger.js";

const CELERY_TASK_API_URL =
  process.env.CELERY_TASK_API_URL || "http://localhost:8001/api/tasks";

/**
 * Enqueue a Celery task by calling the Python worker's HTTP API.
 *
 * Expected Python side (example):
 * POST /api/tasks
 * {
 *    "task": "send_email",
 *    "payload": { ... },
 *    "options": { "priority": 5 }
 * }
 */

/**
 * Generic helper to enqueue a Celery task.
 *
 * @param {string} taskName - Name of the Celery task (e.g., "send_email")
 * @param {object} payload  - Data passed to the task
 * @param {object} options  - Extra options (e.g. priority, delay, etc.)
 */
export const enqueueCeleryTask = async (taskName, payload = {}, options = {}) => {
  try {
    const res = await axios.post(CELERY_TASK_API_URL, {
      task: taskName,
      payload,
      options,
    });

    logger.info("✅ Celery task enqueued", {
      task: taskName,
      status: res.status,
      data: res.data,
    });

    return res.data;
  } catch (error) {
    logger.error("❌ Failed to enqueue Celery task", {
      task: taskName,
      message: error.message,
      stack: error.stack,
    });

    // Don't crash the request just because background task failed
    return null;
  }
};

/**
 * Convenience helpers for common tasks:
 * (you'll create matching Celery tasks in Python)
 */

// Example: send email
export const enqueueEmailTask = async (to, subject, body) => {
  return enqueueCeleryTask("send_email", { to, subject, body });
};

// Example: process / resize product image
export const enqueueImageProcessTask = async (imagePath, options = {}) => {
  return enqueueCeleryTask("process_image", { imagePath, ...options });
};

// Example: generate sales report
export const enqueueSalesReportTask = async (farmerId, range) => {
  return enqueueCeleryTask("generate_sales_report", { farmerId, range });
};

export default {
  enqueueCeleryTask,
  enqueueEmailTask,
  enqueueImageProcessTask,
  enqueueSalesReportTask,
};
