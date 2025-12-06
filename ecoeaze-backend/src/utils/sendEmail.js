// src/utils/sendEmail.js
import { enqueueEmailTask } from "../services/celeryService.js";

/**
 * Send an email using Celery background task.
 *
 * This is a thin wrapper so controllers can just call:
 *   await sendEmail(user.email, "Subject", "Body text");
 */
export const sendEmail = async (to, subject, body) => {
  try {
    // Fire-and-forget: don't block main request on this
    enqueueEmailTask(to, subject, body);
    return true;
  } catch (err) {
    console.error("Failed to enqueue email task:", err.message);
    return false;
  }
};

export default {
  sendEmail,
};
