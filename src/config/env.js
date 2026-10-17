import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envPath, override: true });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'quenchmark_super_secret_jwt_key_2026_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://xzgxfzkmzfqoiikpvmif.supabase.co',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET || 'upload',

  // Fast2SMS
  FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY || '',
};
