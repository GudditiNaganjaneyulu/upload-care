import { supabaseAdmin } from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid";

const bucket = process.env.SUPABASE_BUCKET;

// ✅ Allowed MIME types
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

// ✅ Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const initUploadService = async ({ fileName }) => {
  const id = uuidv4();
  const filePath = `${id}-${fileName}`;

  // Create DB entry
  const { error } = await supabaseAdmin.from("uploads").insert({
    id,
    file_name: fileName,
    file_path: filePath,
    status: "pending",
  });

  if (error) throw error;

  // Generate signed upload URL
  const { data, error: urlError } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(filePath);

  if (urlError) throw urlError;

  return {
    uploadId: id,
    filePath,
    signedUrl: data.signedUrl,
    token: data.token,
  };
};

export const completeUploadService = async ({ uploadId, filePath }) => {
  try {
    // 🔍 Verify file exists in storage
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucket)
      .list("", {
        search: filePath,
      });

    if (listError) throw listError;

    const file = files?.find((f) => f.name === filePath);

    if (!file) {
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", uploadId);

      throw new Error("File not found in storage (upload may have failed)");
    }

    // 📊 Extract metadata
    const size = file.metadata?.size || 0;
    const mimeType = file.metadata?.mimetype || "unknown";

    // 🚫 Validate file type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", uploadId);

      throw new Error(`Invalid file type: ${mimeType}`);
    }

    // 🚫 Validate file size
    if (size > MAX_FILE_SIZE) {
      await supabaseAdmin
        .from("uploads")
        .update({ status: "failed" })
        .eq("id", uploadId);

      throw new Error(`File too large. Max allowed is ${MAX_FILE_SIZE} bytes`);
    }

    // 🔗 Get public URL
    const { data: publicData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(filePath);

    // ✅ Update DB
    const { error: updateError } = await supabaseAdmin
      .from("uploads")
      .update({
        status: "uploaded",
        public_url: publicData.publicUrl,
        size,
        mime_type: mimeType,
      })
      .eq("id", uploadId);

    if (updateError) throw updateError;

    return {
      publicUrl: publicData.publicUrl,
      size,
      mimeType,
      status: "uploaded",
    };
  } catch (err) {
    // ❌ Fail-safe update
    await supabaseAdmin
      .from("uploads")
      .update({ status: "failed" })
      .eq("id", uploadId);

    throw err;
  }
};