import { Response, NextFunction } from 'express';
import { pool } from '../../db/index.js';
import { config } from '../../config/env.js';
import { AuthenticatedRequest } from '../../middleware/auth.middleware.js';
import { v2 as cloudinary } from 'cloudinary';
import { extractCvText } from './extract-cv-text.js';

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

      let cvText = '';
      try {
        cvText = await extractCvText(file);
      } catch (extractError: any) {
        console.error('CV text extraction failed:', extractError?.message || extractError);
      }

      if (!cvText || cvText.length < 50) {
        return res.status(422).json({
          error:
            'Could not read text from this CV. Please upload a text-based PDF (not a scanned image).',
        });
      }

      let cvUrl = '';
      if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
        const uploadResult = await cloudinary.uploader.upload(file, {
          resource_type: 'raw',
          folder: 'seekh_cvs',
          public_id: `cv_${userId}`,
          overwrite: true,
        });
        cvUrl = uploadResult.secure_url;
      } else {
        console.log('⚠️ Cloudinary backend keys not found. Mocking upload url...');
        cvUrl = `https://res.cloudinary.com/demo/image/upload/sample.pdf`;
      }

      await pool.query(
        `INSERT INTO profiles (user_id, cv_url, cv_text, profile_complete)
         VALUES ($1, $2, $3, false)
         ON CONFLICT (user_id)
         DO UPDATE SET
           cv_url = EXCLUDED.cv_url,
           cv_text = EXCLUDED.cv_text`,
        [userId, cvUrl, cvText]
      );

      return res.status(200).json({
        message: 'CV uploaded successfully',
        cv_url: cvUrl,
        file_name: fileName || null,
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

      const profileRes = await pool.query(
        'SELECT cv_url, cv_text FROM profiles WHERE user_id = $1',
        [userId]
      );
      const profile = profileRes.rows[0];

      if (!profile || (!profile.cv_url && !profile.cv_text)) {
        return res.status(400).json({
          error: 'No CV uploaded. Please upload your CV in Account Settings before analyzing.',
        });
      }

      const cv_url: string = profile.cv_url || '';
      const cv_text: string = profile.cv_text || '';

      if (!cv_text || cv_text.length < 50) {
        return res.status(400).json({
          error:
            'This CV was uploaded before text extraction was enabled, or Cloudinary blocked PDF download (401). Please re-upload your CV in Account Settings, then try analysis again.',
        });
      }

      let agentResponse: globalThis.Response;
      try {
        agentResponse = await fetch(`${config.aiAgentServiceUrl}/agent/analyze-cv`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cv_url, cv_text }),
        });
      } catch (fetchError: any) {
        console.error('Agent Service fetch failed:', fetchError.message);
        return res.status(502).json({
          error: `Could not reach the AI analysis service. Please ensure the Agent Service is running on ${config.aiAgentServiceUrl}.`,
        });
      }

      if (!agentResponse.ok) {
        let errorDetail = 'Unknown error';
        try {
          const errorData = (await agentResponse.json()) as { detail?: string; error?: string };
          errorDetail = errorData.detail || errorData.error || (await agentResponse.text());
        } catch {
          errorDetail = await agentResponse.text();
        }
        console.error(`Agent Service returned ${agentResponse.status}:`, errorDetail);
        return res.status(502).json({
          error: `CV analysis failed: ${errorDetail}`,
        });
      }

      const data = (await agentResponse.json()) as { report: any };
      return res.status(200).json({ report: data.report, cv_url });
    } catch (error) {
      next(error);
    }
  }

  static async uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { file } = req.body;
      if (!file) {
        return res.status(400).json({ error: 'File data is required.' });
      }

      let avatarUrl = '';
      if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
        const uploadResult = await cloudinary.uploader.upload(file, {
          resource_type: 'image',
          folder: 'seekh_avatars',
          public_id: `avatar_${userId}`,
          overwrite: true,
        });
        avatarUrl = uploadResult.secure_url;
      } else {
        console.log('⚠️ Cloudinary backend keys not found. Mocking upload url...');
        avatarUrl = `https://res.cloudinary.com/demo/image/upload/sample.jpg`;
      }

      await pool.query(
        `INSERT INTO profiles (user_id, avatar_url, profile_complete)
         VALUES ($1, $2, false)
         ON CONFLICT (user_id)
         DO UPDATE SET avatar_url = EXCLUDED.avatar_url`,
        [userId, avatarUrl]
      );

      return res.status(200).json({
        message: 'Profile picture uploaded successfully',
        avatar_url: avatarUrl,
      });
    } catch (error) {
      next(error);
    }
  }
}
