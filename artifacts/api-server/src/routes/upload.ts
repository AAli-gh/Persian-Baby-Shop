import { Router, type IRouter } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router: IRouter = Router();

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * The stored extension is derived from the accepted content type, not from the
 * client-supplied filename: uploads are served back over HTTP, so a `.svg` or
 * `.html` name would turn this endpoint into a stored-XSS vector.
 */
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = EXTENSION_BY_MIME[file.mimetype] ?? ".bin";
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    cb(null, Object.hasOwn(EXTENSION_BY_MIME, file.mimetype));
  },
});

router.post(
  "/upload",
  requireAuth,
  requireAdmin,
  upload.single("file"),
  (req, res): void => {
    if (!req.file) {
      res.status(400).json({ error: "فایل تصویری معتبر ارسال نشد" });
      return;
    }
    res.json({
      url: `/api/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
    });
  },
);

export default router;
