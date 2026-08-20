import { Response, NextFunction } from 'express';
import { pool } from '../../db/index.js';
import { config } from '../../config/env.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary if credentials are provided
if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export class CvAnalyzeController {
  static async upload(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { file, fileName } = req.body;
      if (!file) {
        return res.status(400).json({ error: 'File data is required.' });
      }

      let cvUrl = '';

      if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
        // Real Cloudinary upload
        const uploadResult = await cloudinary.uploader.upload(file, {
          resource_type: 'auto',
          folder: 'seekh_cvs',
          public_id: `cv_${userId}`,
        });
        cvUrl = uploadResult.secure_url;
      } else {
        // Fallback mock upload for local dev
        console.log('⚠️ Cloudinary backend keys not found. Mocking upload url...');
        cvUrl = `https://res.cloudinary.com/demo/image/upload/sample.pdf`;
      }

      return res.status(200).json({
        message: 'CV uploaded successfully',
        cv_url: cvUrl,
      });
    } catch (error) {
      next(error);
    }
  }

  static async analyze(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 1. Fetch cv_url from the user's profile
      const profileRes = await pool.query(
        'SELECT cv_url FROM profiles WHERE user_id = $1',
        [userId]
      );
      const profile = profileRes.rows[0];

      if (!profile || !profile.cv_url) {
        return res.status(400).json({
          error: 'No CV uploaded. Please upload your CV in Account Settings before analyzing.',
        });
      }

      const cv_url: string = profile.cv_url;

      // 2. Call Agent Service to analyze the CV
      const agentResponse = await fetch(`${config.aiAgentServiceUrl}/agent/analyze-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_url }),
      });

      if (!agentResponse.ok) {
        const errorText = await agentResponse.text();
        return res.status(502).json({
          error: `CV analysis failed: ${errorText}`,
        });
      }

      const data = await agentResponse.json() as { report: any };
      return res.status(200).json({ report: data.report, cv_url });
    } catch (error) {
      next(error);
    }
  }
}
