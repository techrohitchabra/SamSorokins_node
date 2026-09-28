import { Key } from "../../models";
import { sendKeyStatusEmail } from "../../methods/sendKeyStatusEmail";

/**
 * Controller to process key check-in / return action.
 * Updates key status to 'Checked In', updates returnedAt timestamp, appends to accessLog,
 * and triggers background email notification.
 */
export default async (req, res, next) => {
  try {
    const { id } = req.params;

    // Condition: Find non-deleted key record by ID
    const key = await Key.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!key) {
      return res.status(404).json({ message: "Key record not found." });
    }

    // Update key record status & return metadata
    key.status = "Checked In";
    key.isReturned = true;
    key.returnedAt = new Date();
    // Append check-in log entry to accessLog history
    key.accessLog.push(
      `${new Date().toLocaleString()}: Key returned/checked in.`
    );

    // Save updated key document to database
    await key.save();

    // Condition: Trigger background key status email notification for returned key
    const keyCopy = {
      ...key.toObject(),
      status: "Checked In",
    };
    sendKeyStatusEmail(keyCopy); // Send notification email asynchronously

    return res.json({ message: "Key returned successfully", key });
  } catch (error) {
    next(error);
  }
};
