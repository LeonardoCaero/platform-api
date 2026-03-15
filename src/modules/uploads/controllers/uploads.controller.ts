import type { Request, Response } from 'express';

export class UploadsController {
  uploadAvatar = (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    const base = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ url: `${base}/api/uploads/avatars/${req.file.filename}` });
  };

  uploadLogo = (req: Request, res: Response): void => {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    const base = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({ url: `${base}/api/uploads/logos/${req.file.filename}` });
  };
}
