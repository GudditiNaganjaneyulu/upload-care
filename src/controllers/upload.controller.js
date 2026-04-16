import {
  initUploadService,
  completeUploadService,
} from "../services/upload.service.js";

// ✅ INIT UPLOAD
export const initUpload = async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({
        status: "error",
        message: "fileName is required",
      });
    }

    const data = await initUploadService({ fileName });

    return res.status(200).json({
      status: "success",
      message: "Upload initialized",
      data,
    });
  } catch (err) {
    console.error("INIT UPLOAD ERROR:", err);

    return res.status(500).json({
      status: "error",
      message: err.message || "Failed to initialize upload",
    });
  }
};

// ✅ COMPLETE UPLOAD
export const completeUpload = async (req, res) => {
  try {
    const { uploadId, filePath } = req.body;

    if (!uploadId || !filePath) {
      return res.status(400).json({
        status: "error",
        message: "uploadId and filePath are required",
      });
    }

    const result = await completeUploadService({
      uploadId,
      filePath,
    });

    return res.status(200).json({
      status: "success",
      message: "Upload completed",
      data: result, // includes url + size + mimeType
    });
  } catch (err) {
    console.error("COMPLETE UPLOAD ERROR:", err);

    return res.status(400).json({
      status: "failed",
      message: err.message || "Upload verification failed",
    });
  }
};