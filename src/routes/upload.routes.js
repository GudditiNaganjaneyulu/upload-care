import express from "express";
import {
  initUpload,
  completeUpload,
} from "../controllers/upload.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Signed URL based upload system (Supabase Storage)
 */

/**
 * @swagger
 * /api/upload/init:
 *   post:
 *     summary: Initialize upload (no input required)
 *     tags: [Upload]
 *     description: |
 *       Step 1 of upload flow.
 *       Generates a signed URL where client can upload file directly.
 *
 *       Flow:
 *       1. Call this API
 *       2. Use returned signedUrl to upload file (PUT request)
 *       3. Call /complete to finalize
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Upload initialized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Upload initialized
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadId:
 *                       type: string
 *                       example: uuid-value
 *                     filePath:
 *                       type: string
 *                       example: uuid-file-171234
 *                     signedUrl:
 *                       type: string
 *                     token:
 *                       type: string
 *       500:
 *         description: Server error
 */
router.post("/init", initUpload);

/**
 * @swagger
 * /api/upload/complete:
 *   post:
 *     summary: Complete upload (verify + metadata extraction)
 *     tags: [Upload]
 *     description: |
 *       Step 3 of upload flow.
 *
 *       This API:
 *       - Verifies file exists in storage
 *       - Extracts metadata (size, mimeType)
 *       - Validates file type and size
 *       - Returns public URL
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - uploadId
 *               - filePath
 *             properties:
 *               uploadId:
 *                 type: string
 *                 example: uuid-value
 *               filePath:
 *                 type: string
 *                 example: uuid-file-171234
 *     responses:
 *       200:
 *         description: Upload completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Upload completed
 *                 data:
 *                   type: object
 *                   properties:
 *                     publicUrl:
 *                       type: string
 *                     size:
 *                       type: number
 *                     mimeType:
 *                       type: string
 *       400:
 *         description: Validation or upload failure
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: failed
 *                 message:
 *                   type: string
 *                   example: Invalid file type
 *       500:
 *         description: Server error
 */
router.post("/complete", completeUpload);

/**
 * @swagger
 * /api/upload/test:
 *   post:
 *     summary: Direct file upload (for Swagger testing only)
 *     tags: [Upload]
 *     description: |
 *       ⚠️ This endpoint is ONLY for Swagger testing.
 *       It bypasses signed URL flow and uploads directly.
 *
 *       Use this only to test file uploads inside Swagger UI.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *       500:
 *         description: Upload failed
 */
router.post("/test", (req, res) => {
  res.status(501).json({
    message: "Test upload not implemented yet",
  });
});

export default router;