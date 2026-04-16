import { supabaseAdmin } from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid";

const bucket = process.env.SUPABASE_BUCKET;

// ✅ Allowed MIME types - Images
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

// ✅ Allowed MIME types - Videos
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];

// ✅ All allowed types
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

// ✅ Max file size for simple upload (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ✅ Max file size for multipart upload (500MB)
const MAX_MULTIPART_FILE_SIZE = 500 * 1024 * 1024;

// ✅ Minimum file size to use multipart upload (10MB)
const MULTIPART_THRESHOLD = 10 * 1024 * 1024;

export const initUploadService = async ({ fileName }) => {
  console.log("\n🚀 [SIMPLE UPLOAD] Initializing upload...");
  console.log(`📝 File name: ${fileName}`);

  const id = uuidv4();
  const filePath = `${id}-${fileName}`;

  console.log(`📋 Upload ID: ${id}`);
  console.log(`📂 File path: ${filePath}`);

  try {
    // Create DB entry
    console.log("💾 Creating DB entry...");
    const { error } = await supabaseAdmin.from("uploads").insert({
      id,
      file_name: fileName,
      file_path: filePath,
      status: "pending",
    });

    if (error) {
      console.error("❌ DB Error:", error);
      throw error;
    }
    console.log("✅ DB entry created");

    // Generate signed upload URL
    console.log("🔐 Generating signed upload URL...");
    const { data, error: urlError } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (urlError) {
      console.error("❌ URL generation error:", urlError);
      throw urlError;
    }

    console.log("✅ Signed URL generated");
    console.log(`🔗 URL length: ${data.signedUrl.length} chars`);
    console.log("✨ [SIMPLE UPLOAD] Init complete\n");

    return {
      uploadId: id,
      filePath,
      signedUrl: data.signedUrl,
      token: data.token,
    };
  } catch (err) {
    console.error("❌ [SIMPLE UPLOAD] Init failed:", err.message);
    throw err;
  }
};

export const completeUploadService = async ({ uploadId, filePath }) => {
  console.log("\n🏁 [SIMPLE UPLOAD] Completing upload...");
  console.log(`📋 Upload ID: ${uploadId}`);
  console.log(`📂 File path: ${filePath}`);

  try {
    // 🔍 Verify file exists in storage
    console.log("🔍 Verifying file exists in storage...");
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucket)
      .list("", {
        search: filePath,
      });

    if (listError) {
      console.error("❌ List error:", listError);
      throw listError;
    }

    const file = files?.find((f) => f.name === filePath);

    if (!file) {
      console.error(`❌ File not found: ${filePath}`);
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", uploadId);

      throw new Error("File not found in storage (upload may have failed)");
    }

    console.log("✅ File found in storage");

    // 📊 Extract metadata
    const size = file.metadata?.size || 0;
    const mimeType = file.metadata?.mimetype || "unknown";

    console.log(`📊 File size: ${size} bytes (${(size / 1024 / 1024).toFixed(2)}MB)`);
    console.log(`📄 MIME type: ${mimeType}`);

    // 🚫 Validate file type
    console.log("🔎 Validating file type...");
    if (!ALLOWED_TYPES.includes(mimeType)) {
      console.error(`❌ Invalid file type: ${mimeType}`);
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", uploadId);

      throw new Error(`Invalid file type: ${mimeType}`);
    }
    console.log("✅ File type is valid");

    // 🚫 Validate file size
    console.log(`⚖️ Validating file size (max: ${MAX_FILE_SIZE} bytes / ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB)...`);
    if (size > MAX_FILE_SIZE) {
      console.error(
        `❌ File too large. Size: ${size} bytes, Max: ${MAX_FILE_SIZE} bytes`
      );
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", uploadId);

      throw new Error(`File too large. Max allowed is ${MAX_FILE_SIZE} bytes`);
    }
    console.log("✅ File size is valid");

    // 🔗 Get public URL
    console.log("🔗 Generating public URL...");
    const { data: publicData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`📡 Public URL: ${publicData.publicUrl}`);

    // ✅ Update DB
    console.log("💾 Updating upload status to 'uploaded'...");
    const { error: updateError } = await supabaseAdmin
      .from("uploads")
      .update({
        status: "uploaded",
        public_url: publicData.publicUrl,
        size,
        mime_type: mimeType,
      })
      .eq("id", uploadId);

    if (updateError) {
      console.error("❌ DB update error:", updateError);
      throw updateError;
    }

    console.log("✅ DB updated");
    console.log("✨ [SIMPLE UPLOAD] Complete successful\n");

    return {
      publicUrl: publicData.publicUrl,
      size,
      mimeType,
      status: "uploaded",
    };
  } catch (err) {
    console.error("❌ [SIMPLE UPLOAD] Complete failed:", err.message);
    // ❌ Fail-safe update
    await supabaseAdmin
      .from("uploads")
      .update({ status: "failed" })
      .eq("id", uploadId)
      .catch((e) => console.error("Failed to update status:", e));

    throw err;
  }
};

// ✅ INIT MULTIPART UPLOAD
export const initMultipartUploadService = async ({ fileName, fileSize, mimeType }) => {
  console.log("\n🚀 [MULTIPART UPLOAD] Initializing upload...");
  console.log(`📝 File name: ${fileName}`);
  console.log(`📊 File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
  console.log(`📄 MIME type: ${mimeType}`);

  try {
    // 🚫 Validate file size
    console.log(
      `⚖️ Validating file size (max: ${MAX_MULTIPART_FILE_SIZE} bytes / ${(MAX_MULTIPART_FILE_SIZE / 1024 / 1024).toFixed(2)}MB)...`
    );
    if (fileSize > MAX_MULTIPART_FILE_SIZE) {
      console.error(`❌ File too large. Size: ${fileSize}, Max: ${MAX_MULTIPART_FILE_SIZE}`);
      throw new Error(
        `File too large. Max allowed is ${MAX_MULTIPART_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
    console.log("✅ File size is valid");

    // 🚫 Validate file type
    console.log("🔎 Validating file type...");
    if (!ALLOWED_TYPES.includes(mimeType)) {
      console.error(`❌ File type not allowed: ${mimeType}`);
      throw new Error(`File type not allowed: ${mimeType}`);
    }
    console.log("✅ File type is valid");

    const id = uuidv4();
    const filePath = `${id}-${fileName}`;

    console.log(`📋 Upload ID: ${id}`);
    console.log(`📂 File path: ${filePath}`);

    try {
      // Create DB entry for multipart upload
      console.log("💾 Creating DB entry for multipart upload...");
      const { error } = await supabaseAdmin.from("uploads").insert({
        id,
        file_name: fileName,
        file_path: filePath,
        status: "pending",
        upload_type: "multipart",
        file_size: fileSize,
        mime_type: mimeType,
      });

      if (error) {
        console.error("❌ DB Error:", error);
        throw error;
      }
      console.log("✅ DB entry created");

      // Generate signed upload URL for multipart
      console.log("🔐 Generating signed upload URL...");
      const { data, error: urlError } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUploadUrl(filePath);

      if (urlError) {
        console.error("❌ URL generation error:", urlError);
        throw urlError;
      }

      console.log("✅ Signed URL generated");
      console.log(`🔗 URL length: ${data.signedUrl.length} chars`);
      console.log("✨ [MULTIPART UPLOAD] Init complete\n");

      return {
        uploadId: id,
        filePath,
        signedUrl: data.signedUrl,
        token: data.token,
        uploadType: "multipart",
        maxSize: MAX_MULTIPART_FILE_SIZE,
      };
    } catch (err) {
      console.error("❌ Error during init, cleaning up...");
      // Cleanup on error
      await supabaseAdmin.from("uploads").delete().eq("id", id).catch(() => {
        console.log("Cleanup: DB entry deleted");
      });
      throw err;
    }
  } catch (err) {
    console.error("❌ [MULTIPART UPLOAD] Init failed:", err.message);
    throw err;
  }
};

// ✅ COMPLETE MULTIPART UPLOAD
export const completeMultipartUploadService = async ({
  uploadId,
  filePath,
  fileSize,
  mimeType,
}) => {
  console.log("\n🏁 [MULTIPART UPLOAD] Completing upload...");
  console.log(`📋 Upload ID: ${uploadId}`);
  console.log(`📂 File path: ${filePath}`);

  try {
    // 🔍 Verify file exists in storage
    console.log("🔍 Verifying file exists in storage...");
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucket)
      .list("", {
        search: filePath,
      });

    if (listError) {
      console.error("❌ List error:", listError);
      throw listError;
    }

    const file = files?.find((f) => f.name === filePath);

    if (!file) {
      console.error(`❌ File not found: ${filePath}`);
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", uploadId);

      throw new Error("File not found in storage (upload may have failed)");
    }

    console.log("✅ File found in storage");

    // 📊 Extract metadata
    const actualSize = file.metadata?.size || fileSize || 0;
    const actualMimeType = file.metadata?.mimetype || mimeType || "unknown";

    console.log(`📊 Actual file size: ${actualSize} bytes (${(actualSize / 1024 / 1024).toFixed(2)}MB)`);
    console.log(`📄 Actual MIME type: ${actualMimeType}`);

    // 🚫 Validate file type
    console.log("🔎 Validating file type...");
    if (!ALLOWED_TYPES.includes(actualMimeType)) {
      console.error(`❌ Invalid file type: ${actualMimeType}`);
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", uploadId);

      throw new Error(`Invalid file type: ${actualMimeType}`);
    }
    console.log("✅ File type is valid");

    // 🚫 Validate file size
    console.log(
      `⚖️ Validating file size (max: ${MAX_MULTIPART_FILE_SIZE} bytes / ${(MAX_MULTIPART_FILE_SIZE / 1024 / 1024).toFixed(2)}MB)...`
    );
    if (actualSize > MAX_MULTIPART_FILE_SIZE) {
      console.error(
        `❌ File too large. Size: ${actualSize} bytes, Max: ${MAX_MULTIPART_FILE_SIZE} bytes`
      );
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", uploadId);

      throw new Error(
        `File too large. Max allowed is ${MAX_MULTIPART_FILE_SIZE / (1024 * 1024)}MB`
      );
    }
    console.log("✅ File size is valid");

    // 🔗 Get public URL
    console.log("🔗 Generating public URL...");
    const { data: publicData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log(`📡 Public URL: ${publicData.publicUrl}`);

    // ✅ Update DB
    console.log("💾 Updating upload status to 'uploaded'...");
    const { error: updateError } = await supabaseAdmin
      .from("uploads")
      .update({
        status: "uploaded",
        public_url: publicData.publicUrl,
        size: actualSize,
        mime_type: actualMimeType,
        upload_type: "multipart",
      })
      .eq("id", uploadId);

    if (updateError) {
      console.error("❌ DB update error:", updateError);
      throw updateError;
    }

    console.log("✅ DB updated");
    console.log("✨ [MULTIPART UPLOAD] Complete successful\n");

    return {
      publicUrl: publicData.publicUrl,
      size: actualSize,
      mimeType: actualMimeType,
      status: "uploaded",
      uploadType: "multipart",
    };
  } catch (err) {
    console.error("❌ [MULTIPART UPLOAD] Complete failed:", err.message);
    // ❌ Fail-safe update
    await supabaseAdmin
      .from("uploads")
      .update({ status: "failed" })
      .eq("id", uploadId)
      .catch((e) => console.error("Failed to update status:", e));

    throw err;
  }
};