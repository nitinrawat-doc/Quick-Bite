const path = require('path');
const fs = require('fs');
const multer = require('multer');

// ─── Multer Storage Strategy ──────────────────────────────────────────────────
// On Vercel (and any serverless / read-only filesystem environment) disk storage
// is not available. We use memoryStorage so the file lands in req.file.buffer
// and is piped directly to Cloudinary without touching the filesystem.
// In local development with Cloudinary configured, the same path is used.
// Local disk fallback is preserved only for local dev without Cloudinary.

const isServerless = process.env.VERCEL === '1';

// Always use memory storage — avoids filesystem writes entirely and works in
// both serverless and traditional environments.
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMime.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter,
});

const handleImageUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded. Please select an image.',
      });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // ── Cloudinary upload path (production + local with Cloudinary configured) ──
    if (cloudName && apiKey && apiSecret) {
      try {
        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
          secure: true,
        });

        // Upload from buffer using upload_stream (no temp file needed)
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'quickbite/food',
              resource_type: 'image',
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });

        return res.json({
          success: true,
          message: 'Image uploaded successfully to Cloudinary.',
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        });
      } catch (cloudErr) {
        // On Vercel there is no local fallback — surface the error clearly
        if (isServerless) {
          console.error('Cloudinary upload failed on serverless:', cloudErr.message);
          return res.status(502).json({
            success: false,
            message: `Image upload failed: ${cloudErr.message}. Cloudinary must be configured in production.`,
          });
        }
        console.warn('Cloudinary upload failed, falling back to local storage:', cloudErr.message);
      }
    }

    // ── Local disk fallback (local development without Cloudinary only) ────────
    if (isServerless) {
      // This path should never be reached on Vercel since the block above returns.
      // Guard here as a safety net.
      return res.status(503).json({
        success: false,
        message: 'Image upload requires Cloudinary configuration in production. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      });
    }

    // Write buffer to local disk for development
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    const localUrl = `/uploads/${filename}`;
    const baseUrl = (process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const absoluteUrl = `${baseUrl}${localUrl}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully (local dev).',
      url: localUrl,
      absoluteUrl,
      filename,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadMiddleware: upload.single('image'),
  handleImageUpload,
};
