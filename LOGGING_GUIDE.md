# Upload Logging Guide

## Overview
Comprehensive logging has been added to every step of the upload process. Logs help you debug and monitor the flow with detailed information at each stage.

---

## Log Output Examples

### Example 1: Small Image (1.5MB) - Auto-Detect Routes to Simple Upload

```
============================================================
📥 [AUTO INIT] New upload request received
============================================================
📝 File name: photo.jpg
📊 File size: 1572864 bytes (1.50MB)
📄 MIME type: image/jpeg

🔍 Auto-detecting upload method...
⚖️ Threshold: 5242880 bytes (5.00MB)
📋 Decision: SIMPLE (Small file)

→ Using simple upload service...

🚀 [SIMPLE UPLOAD] Initializing upload...
📝 File name: photo.jpg
📋 Upload ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
📂 File path: a1b2c3d4-e5f6-7890-abcd-ef1234567890-photo.jpg
💾 Creating DB entry...
✅ DB entry created
🔐 Generating signed upload URL...
✅ Signed URL generated
🔗 URL length: 412 chars
✨ [SIMPLE UPLOAD] Init complete

✨ [AUTO INIT] Success
============================================================
```

### Example 2: Large Video (40MB) - Auto-Detect Routes to Multipart Upload

```
============================================================
📥 [AUTO INIT] New upload request received
============================================================
📝 File name: myvideo.mp4
📊 File size: 41943040 bytes (40.00MB)
📄 MIME type: video/mp4

🔍 Auto-detecting upload method...
⚖️ Threshold: 5242880 bytes (5.00MB)
📋 Decision: MULTIPART (Large file)

→ Using multipart upload service...

🚀 [MULTIPART UPLOAD] Initializing upload...
📝 File name: myvideo.mp4
📊 File size: 41943040 bytes (40.00MB)
📄 MIME type: video/mp4
⚖️ Validating file size (max: 524288000 bytes / 500.00MB)...
✅ File size is valid
🔎 Validating file type...
✅ File type is valid
📋 Upload ID: f7e8d9c0-b1a2-3456-7890-abcdef123456
📂 File path: f7e8d9c0-b1a2-3456-7890-abcdef123456-myvideo.mp4
💾 Creating DB entry for multipart upload...
✅ DB entry created
🔐 Generating signed upload URL...
✅ Signed URL generated
🔗 URL length: 418 chars
✨ [MULTIPART UPLOAD] Init complete

✨ [AUTO INIT] Success
============================================================
```

### Example 3: Completion - Small Image

```
============================================================
✔️  [AUTO COMPLETE] Upload completion request received
============================================================
📋 Upload ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
📂 File path: a1b2c3d4-e5f6-7890-abcd-ef1234567890-photo.jpg
📊 File size: 1572864 bytes (1.50MB)
📄 MIME type: image/jpeg

🔍 Auto-detecting upload method...
⚖️ Threshold: 5242880 bytes (5.00MB)
📋 Decision: SIMPLE (Small file)

→ Using simple upload completion service...

🏁 [SIMPLE UPLOAD] Completing upload...
📋 Upload ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
📂 File path: a1b2c3d4-e5f6-7890-abcd-ef1234567890-photo.jpg
🔍 Verifying file exists in storage...
✅ File found in storage
📊 File size: 1572864 bytes (1.50MB)
📄 MIME type: image/jpeg
🔎 Validating file type...
✅ File type is valid
⚖️ Validating file size (max: 5242880 bytes / 5.00MB)...
✅ File size is valid
🔗 Generating public URL...
📡 Public URL: https://your-bucket.supabase.co/object/public/uploads/a1b2c3d4-e5f6-7890-abcd-ef1234567890-photo.jpg
💾 Updating upload status to 'uploaded'...
✅ DB updated
✨ [SIMPLE UPLOAD] Complete successful

✨ [AUTO COMPLETE] Success
============================================================
```

### Example 4: Completion - Large Video

```
============================================================
✔️  [AUTO COMPLETE] Upload completion request received
============================================================
📋 Upload ID: f7e8d9c0-b1a2-3456-7890-abcdef123456
📂 File path: f7e8d9c0-b1a2-3456-7890-abcdef123456-myvideo.mp4
📊 File size: 41943040 bytes (40.00MB)
📄 MIME type: video/mp4

🔍 Auto-detecting upload method...
⚖️ Threshold: 5242880 bytes (5.00MB)
📋 Decision: MULTIPART (Large file)

→ Using multipart upload completion service...

🏁 [MULTIPART UPLOAD] Completing upload...
📋 Upload ID: f7e8d9c0-b1a2-3456-7890-abcdef123456
📂 File path: f7e8d9c0-b1a2-3456-7890-abcdef123456-myvideo.mp4
🔍 Verifying file exists in storage...
✅ File found in storage
📊 Actual file size: 41943040 bytes (40.00MB)
📄 Actual MIME type: video/mp4
🔎 Validating file type...
✅ File type is valid
⚖️ Validating file size (max: 524288000 bytes / 500.00MB)...
✅ File size is valid
🔗 Generating public URL...
📡 Public URL: https://your-bucket.supabase.co/object/public/uploads/f7e8d9c0-b1a2-3456-7890-abcdef123456-myvideo.mp4
💾 Updating upload status to 'uploaded'...
✅ DB updated
✨ [MULTIPART UPLOAD] Complete successful

✨ [AUTO COMPLETE] Success
============================================================
```

### Example 5: Error Case - File Too Large for Multipart

```
============================================================
📥 [AUTO INIT] New upload request received
============================================================
📝 File name: huge-video.mp4
📊 File size: 600000000 bytes (572.20MB)
📄 MIME type: video/mp4

🔍 Auto-detecting upload method...
⚖️ Threshold: 5242880 bytes (5.00MB)
📋 Decision: MULTIPART (Large file)

→ Using multipart upload service...

🚀 [MULTIPART UPLOAD] Initializing upload...
📝 File name: huge-video.mp4
📊 File size: 600000000 bytes (572.20MB)
📄 MIME type: video/mp4
⚖️ Validating file size (max: 524288000 bytes / 500.00MB)...
❌ File too large. Size: 600000000, Max: 524288000

❌ [MULTIPART UPLOAD] Init failed: File too large. Max allowed is 500MB
============================================================
```

### Example 6: Error Case - Invalid File Type

```
============================================================
📥 [AUTO INIT] New upload request received
============================================================
📝 File name: document.pdf
📊 File size: 2500000 bytes (2.38MB)
📄 MIME type: application/pdf

🔍 Auto-detecting upload method...
⚖️ Threshold: 5242880 bytes (5.00MB)
📋 Decision: SIMPLE (Small file)

→ Using simple upload service...

🚀 [SIMPLE UPLOAD] Initializing upload...
📝 File name: document.pdf
📋 Upload ID: xyz12345-abcd-efgh-ijkl-mnopqrstuvwx
📂 File path: xyz12345-abcd-efgh-ijkl-mnopqrstuvwx-document.pdf
💾 Creating DB entry...
✅ DB entry created
🔐 Generating signed upload URL...
✅ Signed URL generated
🔗 URL length: 405 chars
✨ [SIMPLE UPLOAD] Init complete

✨ [AUTO INIT] Success
============================================================

[After file upload - on completion]

============================================================
✔️  [AUTO COMPLETE] Upload completion request received
============================================================
📋 Upload ID: xyz12345-abcd-efgh-ijkl-mnopqrstuvwx
📂 File path: xyz12345-abcd-efgh-ijkl-mnopqrstuvwx-document.pdf

🔍 Auto-detecting upload method...
⚖️ Threshold: 5242880 bytes (5.00MB)
📋 Decision: SIMPLE (Small file)

→ Using simple upload completion service...

🏁 [SIMPLE UPLOAD] Completing upload...
📋 Upload ID: xyz12345-abcd-efgh-ijkl-mnopqrstuvwx
📂 File path: xyz12345-abcd-efgh-ijkl-mnopqrstuvwx-document.pdf
🔍 Verifying file exists in storage...
✅ File found in storage
📊 File size: 2500000 bytes (2.38MB)
📄 MIME type: application/pdf
🔎 Validating file type...
❌ Invalid file type: application/pdf

❌ [SIMPLE UPLOAD] Complete failed: Invalid file type: application/pdf
============================================================
```

---

## Log Symbols Reference

| Symbol | Meaning |
|--------|---------|
| 🚀 | Operation starting |
| 🔍 | Searching/Verifying |
| 📝 | File information |
| 📊 | File size/metrics |
| 📄 | MIME type/file format |
| 📋 | Upload ID |
| 📂 | File path |
| 💾 | Database operation |
| 🔐 | Security/authentication |
| 🔗 | URL generation |
| 📡 | Public URL |
| 🔎 | Validation |
| ⚖️ | Size validation |
| ✅ | Success |
| ❌ | Error |
| ⚠️ | Warning |
| ✨ | Completion |
| 🏁 | Finalization |
| ↓ | Flow transition |
| → | Direction arrow |
| 🔄 | Auto-detection |
| ✔️ | Confirmation |

---

## Debugging Tips

### Check Integration Points
1. **[AUTO INIT]** logs show file detection and method selection
2. **[SIMPLE UPLOAD] Initializing** shows signed URL generation
3. **[MULTIPART UPLOAD] Initializing** shows multipart setup
4. **[SIMPLE/MULTIPART UPLOAD] Completing** shows validation and finalization

### Common Issues to Look For

**Issue: "File too large. Max allowed is 5242880 bytes"**
- Check if file size is > 5MB
- Verify `/init-auto` is being used (not `/init`)
- Ensure multipart upload is being invoked properly

**Issue: "Invalid file type"**
- Check MIME type in logs
- Ensure file type is in allowed list (PNG, JPEG, WebP, MP4, WebM, MOV, AVI)
- Verify MIME type is correct

**Issue: "File not found in storage"**
- Check if file was actually uploaded to signed URL
- Look for upload success before calling complete
- Verify file path matches between init and complete

---

## Running the Server

Monitor the entire upload flow with logs:

```bash
npm start
# or
npm run dev
```

All logs will print to console in real-time as uploads happen.
