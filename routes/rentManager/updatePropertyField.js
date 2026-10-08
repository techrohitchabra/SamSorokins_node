import axios from "axios";
import { logRMAction } from "../../utils/rentManager.js";

function getAnswerByName(answers, fieldName, keyName = "answer") {
  if (!answers) return null;
  const field = Object.values(answers).find((item) => item.text === fieldName);
  if (!field) return null;

  const value = field?.[keyName] || null;

  if (typeof value === "string") {
    return value.replace(/<[^>]*>/g, "").trim();
  }

  return value;
}

export default async function updatePropertyField({
  cfg,
  answers,
  propertyId,
  headers,
  action,
  valueToUse,
  itemType,
  pdfLink,
  udfId,
  belongsTo,
  email,
  submissionID,
  fieldType,
}) {
  try {
    if (belongsTo !== "udf") {
      const errorMsg = "You can only update UDFs for Property table";
      logRMAction({
        type: "WEBHOOK_PROPERTY_UDF_FAILURE",
        email,
        formId: cfg?.formId,
        submissionID,
        error: errorMsg,
      });
      return {
        status: "error",
        error: errorMsg,
      };
    }

    let finalValue = "";
    if (action === "replace") {
      finalValue = valueToUse;

      if (itemType === "pdf") {
        finalValue = pdfLink;
      }

      if (itemType === "jotform") {
        const jotformValue = getAnswerByName(answers, valueToUse);
        const normalizedFieldType = (fieldType || "").toLowerCase().trim();
        const isMultiSelect =
          normalizedFieldType === "multi select" ||
          normalizedFieldType === "multiselect" ||
          normalizedFieldType === "multi-select";

        if (Array.isArray(jotformValue)) {
          finalValue = jotformValue
            .map((v) => String(v).trim())
            .filter(Boolean)
            .join(",");
        } else if (isMultiSelect && typeof jotformValue === "string") {
          // in case a multi-select field ever sends a comma-separated string instead of a JS array
          finalValue = jotformValue
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
            .join(",");
        } else {
          finalValue = jotformValue || "";
        }
      }
    } else if (action === "prepend") {
      const detailRes = await axios.get(
        `${process.env.RM_BASE_URL}/Properties/${propertyId}`,
        {
          headers,
          params: { embeds: "UserDefinedValues" },
        }
      );
      const currentUdfObj = detailRes.data.UserDefinedValues?.find(
        (v) => v.UserDefinedFieldID === udfId
      );
      const currentValue = currentUdfObj ? currentUdfObj.Value || "" : "";
      finalValue = valueToUse + currentValue;

      if (itemType === "pdf") {
        const cleanCurrent = currentValue?.trim() || "";
        finalValue = cleanCurrent ? `${pdfLink} | ${cleanCurrent}` : pdfLink;
      }

      if (itemType === "jotform") {
        const jotformValue = getAnswerByName(answers, valueToUse);
        const normalizedFieldType = (fieldType || "").toLowerCase().trim();
        const isMultiSelect =
          normalizedFieldType === "multi select" ||
          normalizedFieldType === "multiselect" ||
          normalizedFieldType === "multi-select";
        let valStr = "";

        if (Array.isArray(jotformValue)) {
          valStr = jotformValue
            .map((v) => String(v).trim())
            .filter(Boolean)
            .join(",");
        } else if (isMultiSelect && typeof jotformValue === "string") {
          // in case a multi-select field ever sends a comma-separated string instead of a JS array
          valStr = jotformValue
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
            .join(",");
        } else {
          valStr = jotformValue || "";
        }
        finalValue = valStr + currentValue;
      }
    } else if (action === "empty") {
      finalValue = "";
    } else {
      const errorMsg = `Unknown action: ${action}`;
      logRMAction({
        type: "WEBHOOK_PROPERTY_UDF_FAILURE",
        email,
        formId: cfg?.formId,
        submissionID,
        error: errorMsg,
      });
      return {
        status: "skipped",
        reason: errorMsg,
      };
    }

    console.log("field to be update: ", "cfg.field: ", cfg?.field, {
      finalValue,
    });

    await axios.post(
      `${process.env.RM_BASE_URL}/Properties/UserDefinedValues`,
      [
        {
          ParentID: propertyId,
          UserDefinedFieldID: udfId,
          Value: finalValue,
        },
      ],
      { headers }
    );

    return {
      status: "success",
      value: finalValue,
    };
  } catch (err) {
    logRMAction({
      type: "WEBHOOK_PROPERTY_UDF_FAILURE",
      email,
      formId: cfg?.formId,
      submissionID,
      error: err.message,
    });
    return {
      status: "error",
      error: err.message,
    };
  }
}
