export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  is_verified: boolean;
  role?: string;
  created_at: Date;
}

export interface OTPVerification {
  id: string;
  email: string;
  otp_code: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  id: string;
  email: string;
}
