import { google } from 'googleapis';
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || process.env.GOOGLE_REFRESH_TOKEN;
const GMAIL_USER_EMAIL = process.env.GMAIL_USER_EMAIL || process.env.GOOGLE_USER_EMAIL || 'me';
let gmailClient = null;
function getGmailClient() {
    if (gmailClient)
        return gmailClient;
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET || !GMAIL_REFRESH_TOKEN) {
        console.warn('⚠️ Gmail API credentials are not fully configured. Mailer will run in mock mode (OTP logged to console).');
        return null;
    }
    try {
        const oauth2Client = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, 'https://developers.google.com/oauthplayground' // standard redirect URI used for token generation/dev
        );
        oauth2Client.setCredentials({
            refresh_token: GMAIL_REFRESH_TOKEN,
        });
        gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
        return gmailClient;
    }
    catch (error) {
        console.error('❌ Failed to initialize Gmail API client:', error.message);
        return null;
    }
}
export async function sendOTPEmail(email, otp, expiresMinutes = 5) {
    const client = getGmailClient();
    const subject = 'Your Verification Code';
    const body = `Hello,\n\nYour 6-digit verification code is: ${otp}\n\nThis code expires in ${expiresMinutes} minutes.\n\nBest regards,\nPersonalized Learning Platform Team`;
    if (!client) {
        console.log(`\n-----------------------------------------`);
        console.log(`✉️  [MOCK EMAIL] To: ${email}`);
        console.log(`✉️  Subject: ${subject}`);
        console.log(`✉️  Body: OTP Code is [ ${otp} ] (Expires in ${expiresMinutes} mins)`);
        console.log(`-----------------------------------------\n`);
        return true;
    }
    try {
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `From: ${GMAIL_USER_EMAIL}`,
            `To: ${email}`,
            'Content-Type: text/plain; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            body,
        ];
        const message = messageParts.join('\r\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        await client.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        console.log(`✅ Verification email successfully sent to ${email} via Gmail API.`);
        return true;
    }
    catch (error) {
        console.error(`❌ Failed to send OTP email via Gmail API:`, error.message);
        console.log(`✉️  [FALLBACK] OTP for ${email}: ${otp}`);
        return false;
    }
}
export async function sendEmail(email, subject, body) {
    const client = getGmailClient();
    if (!client) {
        console.log(`\n-----------------------------------------`);
        console.log(`✉️  [MOCK EMAIL] To: ${email}`);
        console.log(`✉️  Subject: ${subject}`);
        console.log(`✉️  Body: ${body}`);
        console.log(`-----------------------------------------\n`);
        return true;
    }
    try {
        const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
        const messageParts = [
            `From: ${GMAIL_USER_EMAIL}`,
            `To: ${email}`,
            'Content-Type: text/plain; charset=utf-8',
            'MIME-Version: 1.0',
            `Subject: ${utf8Subject}`,
            '',
            body,
        ];
        const message = messageParts.join('\r\n');
        const encodedMessage = Buffer.from(message)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        await client.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        console.log(`✅ Email successfully sent to ${email} via Gmail API.`);
        return true;
    }
    catch (error) {
        console.error(`❌ Failed to send email via Gmail API:`, error.message);
        console.log(`✉️  [FALLBACK] Email for ${email}: Subject: ${subject}, Body: ${body}`);
        return false;
    }
}
