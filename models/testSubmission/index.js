import mongoose from "mongoose";
import testSubmissionSchema from "./schema.js";

const TestSubmission = mongoose.model(
  "TestSubmission",
  testSubmissionSchema,
  "testsubmissions"
);

export default TestSubmission;
