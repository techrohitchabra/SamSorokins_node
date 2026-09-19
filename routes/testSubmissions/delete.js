import TestSubmission from "../../models/testSubmission/index.js";

export default async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Submission ID or Mongo ID is required" });
    }

    let deletedDoc = null;
    // Check if valid ObjectId string
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      deletedDoc = await TestSubmission.findByIdAndDelete(id);
    }

    if (!deletedDoc) {
      deletedDoc = await TestSubmission.findOneAndDelete({ submissionId: id });
    }

    if (!deletedDoc) {
      return res.status(404).json({ message: "Test submission not found" });
    }

    return res.json({
      success: true,
      message: "Submission permanently deleted successfully",
      deletedId: deletedDoc._id,
    });
  } catch (error) {
    console.error("[testSubmissions/delete] Error:", error);
    next(error);
  }
};
