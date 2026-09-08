import TestSubmission from "../../models/testSubmission/index.js";

export default async (req, res, next) => {
  try {
    const submissions = await TestSubmission.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("[testSubmissions/get] Error:", error);
    next(error);
  }
};
