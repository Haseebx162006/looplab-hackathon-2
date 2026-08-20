import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../../db/index.js';
import { generateOTP, getOTPExpiry } from '../../utils/otp.js';
import { sendOTPEmail } from '../../utils/mailer.js';
import { JWTPayload, User } from './auth.types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export class AuthService {
  static async signup(name: string, email: string, password: string) {
    const formattedEmail = email.toLowerCase().trim();

    // Check if user exists
    const existingUserRes = await pool.query('SELECT * FROM users WHERE email = $1', [formattedEmail]);
    const existingUser: User | null = existingUserRes.rows[0] || null;

    if (existingUser) {
      if (existingUser.is_verified) {
        throw { status: 409, message: 'Email is already registered' };
      }
      
      // If user exists but is not verified, we allow updating the name & password and resending the OTP
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET name = $1, password_hash = $2 WHERE email = $3',
        [name.trim(), passwordHash, formattedEmail]
      );
    } else {
      // Create new user
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, false)',
        [name.trim(), formattedEmail, passwordHash]
      );
    }

    // Generate and save OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiry(5);

    await pool.query(
      `INSERT INTO otp_verifications (email, otp_code, expires_at, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       ON CONFLICT (email) 
       DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at, updated_at = NOW()`,
      [formattedEmail, otp, expiresAt]
    );

    // Send email asynchronously (runs in background so we don't block response)
    sendOTPEmail(formattedEmail, otp).catch((err) => {
      console.error('Failed to send verification email during signup:', err);
    });

    return {
      message: 'Signup successful. Please verify your email with the 6-digit code sent to you.',
      email: formattedEmail
    };
  }

  static async verifyOTP(email: string, otpCode: string) {
    const formattedEmail = email.toLowerCase().trim();

    const otpRes = await pool.query('SELECT * FROM otp_verifications WHERE email = $1', [formattedEmail]);
    const otpRecord = otpRes.rows[0];

    if (!otpRecord) {
      throw { status: 400, message: 'Invalid verification request or OTP expired' };
    }

    if (new Date() > new Date(otpRecord.expires_at)) {
      throw { status: 400, message: 'Verification code has expired' };
    }

    if (otpRecord.otp_code !== otpCode) {
      throw { status: 400, message: 'Invalid verification code' };
    }

    // Mark user as verified and delete the verification record
    const client = await pool.connect();
    let user: any;
    try {
      await client.query('BEGIN');
      const userUpdateRes = await client.query('UPDATE users SET is_verified = true WHERE email = $1 RETURNING *', [formattedEmail]);
      user = userUpdateRes.rows[0];
      await client.query('DELETE FROM otp_verifications WHERE email = $1', [formattedEmail]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    if (!user) {
      throw { status: 404, message: 'User not found after verification' };
    }

    const tokenPayload: JWTPayload = {
      id: user.id,
      email: user.email
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });

    const profileRes = await pool.query('SELECT profile_complete FROM profiles WHERE user_id = $1', [user.id]);
    const profileComplete = profileRes.rows[0]?.profile_complete || false;

    return {
      message: 'Email verification successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_verified: user.is_verified,
        role: user.role,
        profile_complete: profileComplete,
        created_at: user.created_at
      }
    };
  }

  static async resendOTP(email: string) {
    const formattedEmail = email.toLowerCase().trim();

    // Check user verification status
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [formattedEmail]);
    const user = userRes.rows[0];

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    if (user.is_verified) {
      throw { status: 400, message: 'Email is already verified' };
    }

    // Check rate limit (1 request per 60 seconds)
    const otpRes = await pool.query('SELECT * FROM otp_verifications WHERE email = $1', [formattedEmail]);
    const otpRecord = otpRes.rows[0];

    if (otpRecord) {
      const timeSinceLastUpdate = Date.now() - new Date(otpRecord.updated_at).getTime();
      if (timeSinceLastUpdate < OTP_RESEND_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((OTP_RESEND_COOLDOWN_MS - timeSinceLastUpdate) / 1000);
        throw { 
          status: 429, 
          message: `Too many requests. Please wait ${secondsLeft} seconds before requesting a new OTP.` 
        };
      }
    }

    const otp = generateOTP();
    const expiresAt = getOTPExpiry(5);

    await pool.query(
      `INSERT INTO otp_verifications (email, otp_code, expires_at, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       ON CONFLICT (email) 
       DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at, updated_at = NOW()`,
      [formattedEmail, otp, expiresAt]
    );

    sendOTPEmail(formattedEmail, otp).catch((err) => {
      console.error('Failed to send verification email during resend:', err);
    });

    return { message: 'A new verification code has been sent to your email.' };
  }

  static async login(email: string, password: string) {
    const formattedEmail = email.toLowerCase().trim();

    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [formattedEmail]);
    const user: User | null = userRes.rows[0] || null;

    if (!user) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid email or password' };
    }

    if (!user.is_verified) {
      throw { status: 403, message: 'Account is not verified. Please verify your email first.' };
    }

    const tokenPayload: JWTPayload = {
      id: user.id,
      email: user.email
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });

    const profileRes = await pool.query('SELECT profile_complete FROM profiles WHERE user_id = $1', [user.id]);
    const profileComplete = profileRes.rows[0]?.profile_complete || false;

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_verified: user.is_verified,
        role: user.role,
        profile_complete: profileComplete,
        created_at: user.created_at
      }
    };
  }

  static async getUserById(id: string) {
    const userRes = await pool.query('SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = $1', [id]);
    const user = userRes.rows[0] || null;
    if (!user) {
      throw { status: 404, message: 'User not found' };
    }
    const profileRes = await pool.query('SELECT profile_complete FROM profiles WHERE user_id = $1', [id]);
    const profileComplete = profileRes.rows[0]?.profile_complete || false;
    return {
      ...user,
      profile_complete: profileComplete
    };
  }
}
