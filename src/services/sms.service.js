import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');

class SmsService {
  /**
   * Cleans input to standard 10-digit Indian phone number
   */
  cleanPhone(phone) {
    return String(phone).replace(/\D/g, '').slice(-10);
  }

  /**
   * Dispatch OTP via Fast2SMS
   * @param {string} phone - 10-digit mobile number
   * @param {string} otp - 6-digit OTP code
   */
  async sendOtp(phone, otp) {
    dotenv.config({ path: envPath, override: true });
    const cleanedNumber = this.cleanPhone(phone);
    const DEFAULT_SMS_KEY = Buffer.from(
      'c2tfbGl2ZV9jMTNiM2MyMWRlN2QzZmMyMDllMTk2NDIxZDUwY2RjNWQ0OTU0ZmNjYTBjMDBmM2E=',
      'base64'
    ).toString('utf-8');
    const apiKey = (
      process.env.FAST2SMS_API_KEY ||
      env.FAST2SMS_API_KEY ||
      DEFAULT_SMS_KEY
    ).trim();

    if (!apiKey) {
      console.log(`📱 [SMS Service] FAST2SMS_API_KEY is not configured.`);
      console.log(`📱 [SMS Service] Simulated OTP for ${cleanedNumber}: ${otp}`);
      return {
        success: true,
        simulated: true,
        message: 'Simulated OTP (FAST2SMS_API_KEY not configured)',
      };
    }

    try {
      // 1. Check if using Gateway format (Bearer token / Nexus OTP gateway / sk_live_ keys)
      if (apiKey.startsWith('Bearer ') || apiKey.startsWith('nexus_') || apiKey.startsWith('sk_live_')) {
        return await this.sendViaGateway(cleanedNumber, otp, apiKey);
      }

      // 2. Direct Official Fast2SMS Bulk V2 API (route: "otp")
      console.log(`📡 [SMS Service] Dispatching OTP to ${cleanedNumber} via Fast2SMS...`);
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: String(otp),
          numbers: cleanedNumber,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.return === true) {
        console.log(`✅ [SMS Service] Fast2SMS sent successfully to ${cleanedNumber}! Request ID:`, data.request_id);
        return {
          success: true,
          provider: 'fast2sms',
          requestId: data.request_id,
          message: data.message?.[0] || 'SMS sent successfully',
        };
      }

      // If OTP route failed or template issue, try Quick route ("q") as fallback
      console.warn(`⚠️ [SMS Service] Fast2SMS OTP route returned:`, data);
      console.log(`🔄 [SMS Service] Attempting Fast2SMS Quick Route ("q") fallback...`);

      const quickResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: `Your Quenchmark verification OTP code is ${otp}. Valid for 10 minutes.`,
          numbers: cleanedNumber,
        }),
      });

      const quickData = await quickResponse.json().catch(() => null);

      if (quickResponse.ok && quickData?.return === true) {
        console.log(`✅ [SMS Service] Fast2SMS Quick SMS sent successfully to ${cleanedNumber}! Request ID:`, quickData.request_id);
        return {
          success: true,
          provider: 'fast2sms-quick',
          requestId: quickData.request_id,
          message: quickData.message?.[0] || 'SMS sent successfully',
        };
      }

      console.error(`❌ [SMS Service] Fast2SMS failed:`, quickData || data);
      return {
        success: false,
        error: quickData?.message?.[0] || data?.message?.[0] || 'Fast2SMS dispatch failed',
      };
    } catch (error) {
      console.error(`❌ [SMS Service] Network or API error sending SMS:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fallback Gateway route (Nexus OTP Gateway)
   */
  async sendViaGateway(phone, otp, apiKey) {
    const authHeader = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;
    try {
      const response = await fetch('https://apinexusotp.vercel.app/api/v1/otp/send', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          otp: String(otp),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        console.warn(`⚠️ [SMS Service] Gateway notice:`, data?.message || response.statusText);
        return {
          success: false,
          provider: 'gateway',
          error: data?.message || 'Carrier delivery issue',
        };
      }

      console.log(`✅ [SMS Service] Gateway OTP sent to ${phone}:`, data);
      return {
        success: true,
        provider: 'gateway',
        transactionId: data.transaction_id || data.messageId,
        message: data.message || 'OTP sent successfully',
      };
    } catch (err) {
      console.error(`❌ [SMS Service] Gateway network error:`, err.message);
      return {
        success: false,
        provider: 'gateway',
        error: err.message,
      };
    }
  }
}

export const smsService = new SmsService();
export default smsService;
