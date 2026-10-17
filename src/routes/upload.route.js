import { Router } from 'express';
import { supabase, getStoragePublicUrl } from '../config/supabase.js';
import { env } from '../config/env.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

// GET /api/upload/files - List files currently in Supabase storage bucket
router.get('/files', async (req, res, next) => {
  try {
    const { data, error } = await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).list();
    if (error) {
      throw new ApiError(500, `Supabase storage error: ${error.message}`);
    }

    const files = (data || []).map((file) => ({
      name: file.name,
      id: file.id,
      createdAt: file.created_at,
      publicUrl: getStoragePublicUrl(file.name),
    }));

    return res.status(200).json(new ApiResponse(200, files, 'Files retrieved from Supabase bucket'));
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/base64 - Upload a base64 encoded image directly to Supabase bucket
router.post('/base64', async (req, res, next) => {
  try {
    const { fileName, base64Data, contentType = 'image/jpeg' } = req.body;

    if (!base64Data) {
      throw new ApiError(400, 'base64Data is required');
    }

    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeFileName = fileName || `product-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(safeFileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new ApiError(500, `Failed to upload image: ${error.message}`);
    }

    const publicUrl = getStoragePublicUrl(safeFileName);

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          fileName: safeFileName,
          path: data.path,
          publicUrl,
        },
        'Image uploaded to Supabase storage bucket successfully'
      )
    );
  } catch (error) {
    next(error);
  }
});

export default router;
