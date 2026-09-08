import axios from "axios";
import TestSubmission from "../../models/testSubmission/index.js";

const apiKey =
  process.env.JOTFORM_API_KEY || "da724b69ac2c6dc23adf791b768e8674";

function getAnswerByName(answers, fieldName, keyName = "answer") {
  if (!answers) return null;
  const field = Object.values(answers).find((item) => item?.text === fieldName);
  if (!field) return null;

  const value = field?.[keyName] || null;

  if (typeof value === "string") {
    return value.replace(/<[^>]*>/g, "").trim();
  }

  return value;
}

function getUniqueId(answers, fieldName = "uniqueId", keyName = "answer") {
  if (!answers) return "";

  const field = Object.values(answers).find((item) => item?.name === fieldName);

  if (!field) return "";

  const value = field?.[keyName] || "";

  if (typeof value === "string") {
    return value.replace(/<[^>]*>/g, "").trim();
  }

  return value;
}

export default async (req, res, next) => {
  try {
    const { formId } = req.body;

    if (!formId || !String(formId).trim()) {
      return res.status(400).json({ message: "Form ID is required!" });
    }

    const cleanFormId = String(formId).trim();
    let submissionsRaw = [];

    // Attempt Jotform API call
    try {
      const response = await axios.get(
        `https://premiumpd.jotform.com/API/form/${cleanFormId}/submissions`,
        {
          params: { apiKey, limit: 1000 },
        }
      );
      submissionsRaw = response?.data?.content || [];
    } catch (apiError) {
      console.warn("Enterprise Jotform API failed, falling back to standard API:", apiError.message);
      const fallbackResponse = await axios.get(
        `https://api.jotform.com/form/${cleanFormId}/submissions`,
        {
          params: { apiKey, limit: 1000 },
        }
      );
      submissionsRaw = fallbackResponse?.data?.content || [];
    }

    if (!Array.isArray(submissionsRaw)) {
      submissionsRaw = [];
    }

    const savedSubmissions = [];

    for (const item of submissionsRaw) {
      const submissionId = item.id;
      if (!submissionId) continue;

      const answers = item.answers || {};

      const uniqueIdURL = getUniqueId(answers, "uniqueId");
      let uniqueId = "";
      if (uniqueIdURL) {
        try {
          uniqueId = new URL(uniqueIdURL).pathname
            .split("/")
            .filter(Boolean)
            .pop() || "";
        } catch (err) {
          uniqueId = String(uniqueIdURL).split("/").filter(Boolean).pop() || "";
        }
      }

      const replyEmail =
        getAnswerByName(answers, "Reply Email") || "turnovers@premiumpd.com";
      const formName = getAnswerByName(answers, "Uploader Header") || "";
      const unitName = getAnswerByName(answers, "RM Unit Name") || "";
      const propertyName = getAnswerByName(answers, "RM Short Name") || "";

      const updatedDoc = await TestSubmission.findOneAndUpdate(
        { submissionId: submissionId },
        {
          submissionId: submissionId,
          formId: item.form_id || cleanFormId,
          ip: item.ip || "",
          status: item.status || "",
          answers: answers,
          raw: item,
          uniqueId: uniqueId,
          replyEmail: replyEmail,
          formName: formName,
          propertyName: propertyName,
          unitName: unitName,
        },
        {
          upsert: true,
          new: true,
        }
      );

      savedSubmissions.push(updatedDoc);
    }

    return res.json({
      success: true,
      message: `Successfully synced ${savedSubmissions.length} submissions for form ID ${cleanFormId}`,
      count: savedSubmissions.length,
      data: savedSubmissions,
    });
  } catch (error) {
    console.error("[testSubmissions/sync] Error:", error);
    next(error);
  }
};
