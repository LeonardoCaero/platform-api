import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';
import { asyncHandler } from '@/common/utils/async-handler';
import { authMiddleware } from '@/common/middlewares/auth.middleware';
import { UploadsController } from '../controllers/uploads.controller';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const LOGOS_DIR = path.join(UPLOADS_DIR, 'logos');

// Ensure upload directories exist on startup
fs.mkdirSync(AVATARS_DIR, { recursive: true });
fs.mkdirSync(LOGOS_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function createStorage(dest: string) {
  return multer.diskStorage({
    destination: dest,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  });
}

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, png, webp, gif)'));
  }
};

const avatarUpload = multer({
  storage: createStorage(AVATARS_DIR),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const logoUpload = multer({
  storage: createStorage(LOGOS_DIR),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

const router = Router();
const controller = new UploadsController();

router.post('/avatar', authMiddleware, avatarUpload.single('file'), asyncHandler(controller.uploadAvatar));
router.post('/logo', authMiddleware, logoUpload.single('file'), asyncHandler(controller.uploadLogo));

export default router;
