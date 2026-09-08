import mongoose from "mongoose";

const testSubmissionSchema = new mongoose.Schema(
  {
    submissionId: {
      type: String,
      required: true,
      unique: true,
    },
    formId: String,
    ip: String,
    status: String,
    answers: {
      type: mongoose.Schema.Types.Mixed,
    },
    raw: {
      type: mongoose.Schema.Types.Mixed,
    },
    uniqueId: {
      type: String,
      default: "",
    },
    replyEmail: {
      type: String,
      default: "",
    },
    formName: {
      type: String,
      default: "",
      index: true,
    },
    propertyName: {
      type: String,
      default: "",
      index: true,
    },
    unitName: {
      type: String,
      default: "",
      index: true,
    },
    isSubmited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default testSubmissionSchema;
