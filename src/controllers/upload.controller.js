import {
  initUploadService,
  completeUploadService,
  initMultipartUploadService,
  completeMultipartUploadService,
} from "../services/upload.service.js";

// ✅ INIT UPLOAD
export const initUpload = async (req, res) => {
  try {
    const fileName = req.body?.fileName;

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
    const uploadId = req.body?.uploadId;
    const filePath = req.body?.filePath;

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

// ✅ INIT MULTIPART UPLOAD
export const initMultipartUpload = async (req, res) => {
  try {
    const fileName = req.body?.fileName;
    const fileSize = req.body?.fileSize;
    const mimeType = req.body?.mimeType;

    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({
        status: "error",
        message: "fileName, fileSize, and mimeType are required",
      });
    }

    const data = await initMultipartUploadService({
      fileName,
      fileSize,
      mimeType,
    });

    return res.status(200).json({
      status: "success",
      message: "Multipart upload initialized",
      data,
    });
  } catch (err) {
    console.error("INIT MULTIPART UPLOAD ERROR:", err);

    return res.status(400).json({
      status: "error",
      message: err.message || "Failed to initialize multipart upload",
    });
  }
};

// ✅ COMPLETE MULTIPART UPLOAD
export const completeMultipartUpload = async (req, res) => {
  try {
    const uploadId = req.body?.uploadId;
    const filePath = req.body?.filePath;
    const fileSize = req.body?.fileSize;
    const mimeType = req.body?.mimeType;

    if (!uploadId || !filePath) {
      return res.status(400).json({
        status: "error",
        message: "uploadId and filePath are required",
      });
    }

    const result = await completeMultipartUploadService({
      uploadId,
      filePath,
      fileSize,
      mimeType,
    });

    return res.status(200).json({
      status: "success",
      message: "Multipart upload completed",
      data: result,
    });
  } catch (err) {
    console.error("COMPLETE MULTIPART UPLOAD ERROR:", err);

    return res.status(400).json({
      status: "failed",
      message: err.message || "Multipart upload verification failed",
    });
  }
};

// ✅ AUTO INIT UPLOAD (Automatically choose simple or multipart)
export const initUploadAuto = async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("📥 [AUTO INIT] New upload request received");
  console.log("=".repeat(60));

  try {
    const fileName = req.body?.fileName;
    const fileSize = req.body?.fileSize;
    const mimeType = req.body?.mimeType;

    console.log(`📝 File name: ${fileName}`);
    console.log(`📊 File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
    console.log(`📄 MIME type: ${mimeType}`);

    if (!fileName || !fileSize || !mimeType) {
      console.error("❌ Missing required fields");
      return res.status(400).json({
        status: "error",
        message: "fileName, fileSize, and mimeType are required",
      });
    }

    // 🔄 Auto-detect: Use multipart for files > 5MB
    const MAX_SIMPLE_SIZE = 5 * 1024 * 1024; // 5MB
    const isMultipart = fileSize > MAX_SIMPLE_SIZE;

    console.log(`\n🔍 Auto-detecting upload method...`);
    console.log(`⚖️ Threshold: ${MAX_SIMPLE_SIZE} bytes (${(MAX_SIMPLE_SIZE / 1024 / 1024).toFixed(2)}MB)`);
    console.log(
      `📋 Decision: ${isMultipart ? "MULTIPART (Large file)" : "SIMPLE (Small file)"}`
    );

    let data;
    if (isMultipart) {
      console.log("\n→ Using multipart upload service...");
      data = await initMultipartUploadService({
        fileName,
        fileSize,
        mimeType,
      });
    } else {
      console.log("\n→ Using simple upload service...");
      data = await initUploadService({ fileName });
    }

    console.log("\n✨ [AUTO INIT] Success");
    console.log("=".repeat(60) + "\n");

    return res.status(200).json({
      status: "success",
      message: `Upload initialized (${isMultipart ? "multipart" : "simple"})`,
      data: {
        ...data,
        autoDetected: true,
        uploadMethod: isMultipart ? "multipart" : "simple",
        fileSizeThreshold: MAX_SIMPLE_SIZE,
      },
    });
  } catch (err) {
    console.error("\n❌ [AUTO INIT] Error:", err.message);
    console.log("=".repeat(60) + "\n");

    return res.status(400).json({
      status: "error",
      message: err.message || "Failed to initialize upload",
    });
  }
};

// ✅ AUTO COMPLETE UPLOAD (Automatically choose simple or multipart)
export const completeUploadAuto = async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("✔️  [AUTO COMPLETE] Upload completion request received");
  console.log("=".repeat(60));

  try {
    const uploadId = req.body?.uploadId;
    const filePath = req.body?.filePath;
    const fileSize = req.body?.fileSize;
    const mimeType = req.body?.mimeType;
    const uploadMethod = req.body?.uploadMethod;

    console.log(`📋 Upload ID: ${uploadId}`);
    console.log(`📂 File path: ${filePath}`);
    if (fileSize) console.log(`📊 File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
    if (mimeType) console.log(`📄 MIME type: ${mimeType}`);
    if (uploadMethod) console.log(`📝 Provided method: ${uploadMethod}`);

    if (!uploadId || !filePath) {
      console.error("❌ Missing required fields: uploadId or filePath");
      return res.status(400).json({
        status: "error",
        message: "uploadId and filePath are required",
      });
    }

    // 🔄 Auto-detect upload method if not provided
    const MAX_SIMPLE_SIZE = 5 * 1024 * 1024;
    const isMultipart =
      uploadMethod === "multipart" ||
      (fileSize && fileSize > MAX_SIMPLE_SIZE);

    console.log(`\n🔍 Auto-detecting upload method...`);
    if (uploadMethod) {
      console.log(`→ Using provided method: ${uploadMethod}`);
    } else if (fileSize) {
      console.log(`⚖️ Threshold: ${MAX_SIMPLE_SIZE} bytes (${(MAX_SIMPLE_SIZE / 1024 / 1024).toFixed(2)}MB)`);
      console.log(`📋 Decision: ${isMultipart ? "MULTIPART (Large file)" : "SIMPLE (Small file)"}`);
    } else {
      console.log("→ No size info provided, will detect from storage");
    }

    let result;
    if (isMultipart) {
      console.log("\n→ Using multipart upload completion service...");
      result = await completeMultipartUploadService({
        uploadId,
        filePath,
        fileSize,
        mimeType,
      });
    } else {
      console.log("\n→ Using simple upload completion service...");
      result = await completeUploadService({
        uploadId,
        filePath,
      });
    }

    console.log("\n✨ [AUTO COMPLETE] Success");
    console.log("=".repeat(60) + "\n");

    return res.status(200).json({
      status: "success",
      message: "Upload completed",
      data: {
        ...result,
        autoDetected: true,
        uploadMethod: isMultipart ? "multipart" : "simple",
      },
    });
  } catch (err) {
    console.error("\n❌ [AUTO COMPLETE] Error:", err.message);
    console.log("=".repeat(60) + "\n");

    return res.status(400).json({
      status: "failed",
      message: err.message || "Upload verification failed",
    });
  }
};