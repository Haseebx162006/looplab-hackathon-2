export function generateOTP(): string {
  // Generate a random 6-digit numeric string
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOTPExpiry(minutes: number = 5): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
