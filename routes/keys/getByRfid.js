import { Key } from "../../models";

/**
 * Controller to fetch active key checkout records matching a given RFID code.
 * Searches case-insensitively across rfId, rfid, and frId fields for non-deleted keys
 * with active checkout/pending statuses ('Requested', 'Checked Out', 'To Be Returned', 'Outstanding', 'Lost').
 */
export default async (req, res, next) => {
  try {
    const rawRfid = req.params.rfId || "";
    const trimmedRfid = rawRfid.trim();

    // Condition: Validate presence of RFID parameter
    if (!trimmedRfid) {
      return res.status(400).json({ message: "RFID is required" });
    }

    // Escape regex special characters for safe case-insensitive string match
    const escapedRfid = trimmedRfid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rfidRegex = new RegExp(escapedRfid, "i");

    // Query active keys matching RFID code with pending return status
    const keys = await Key.find({
      isDeleted: { $ne: true }, // Condition: Exclude soft-deleted key records
      $or: [{ rfId: rfidRegex }, { rfid: rfidRegex }, { frId: rfidRegex }], // Condition: Match RFID field variations
      $and: [
        {
          $or: [
            // Condition: Match keys in requested / checked-out / outstanding / lost state
            { status: { $regex: /^requested$/i } },
            { status: { $regex: /^checked out$/i } },
            { status: { $regex: /^to be returned$/i } },
            { status: { $regex: /^outstanding$/i } },
            { status: { $regex: /^lost$/i } },
          ],
        },
      ],
    })
      .populate({
        path: "createdBy",
        select: "firstName lastName email recordId fullName",
        model: "Users",
      })
      .sort({ createdAt: -1 });

    // Return matched key records (return empty array if no match found)
    return res.json({ keys: keys || [] });
  } catch (error) {
    next(error);
  }
};
