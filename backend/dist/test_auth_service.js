import { AuthService } from './modules/auth/auth.service.js';
import { initDatabase, pool } from './db/index.js';
async function runTests() {
    console.log('🔄 Initializing database and running migrations...');
    const dbConnected = await initDatabase();
    if (!dbConnected) {
        console.error('❌ Database connection failed. Please ensure PostgreSQL is running with the credentials in .env.');
        process.exit(1);
    }
    console.log('✅ Database connected. Starting verification tests...');
    const testEmail = `test_user_${Date.now()}@example.com`;
    const password = 'SecurePassword123';
    const name = 'Test User';
    let otpCode = '';
    try {
        // Clean up if previous tests left state (though we use unique emails)
        await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
        await pool.query('DELETE FROM otp_verifications WHERE email = $1', [testEmail]);
        // Test 1: Signup
        console.log('\n--- Test 1: Signup ---');
        const signupRes = await AuthService.signup(name, testEmail, password);
        console.log('Signup Response:', signupRes);
        if (signupRes.email !== testEmail)
            throw new Error('Email mismatch in signup');
        // Retrieve OTP directly from the database for verification
        const dbOtpRes = await pool.query('SELECT otp_code FROM otp_verifications WHERE email = $1', [testEmail]);
        if (dbOtpRes.rows.length === 0)
            throw new Error('OTP not created in database');
        otpCode = dbOtpRes.rows[0].otp_code;
        console.log(`Retrieved OTP from DB for verification: ${otpCode}`);
        // Test 2: Login before verification (should fail)
        console.log('\n--- Test 2: Login before verification (should fail) ---');
        try {
            await AuthService.login(testEmail, password);
            throw new Error('Login succeeded before email verification!');
        }
        catch (err) {
            console.log('Login failed as expected (Unverified account). Error:', err.message || err);
            if (err.status !== 403)
                throw new Error(`Expected status 403, got ${err.status}`);
        }
        // Test 3: Resend OTP and check rate limiting (should fail)
        console.log('\n--- Test 3: Resend OTP and Rate Limit check ---');
        try {
            await AuthService.resendOTP(testEmail);
            throw new Error('Resend OTP succeeded too quickly!');
        }
        catch (err) {
            console.log('Resend OTP rate limited as expected. Error:', err.message || err);
            if (err.status !== 429)
                throw new Error(`Expected status 429, got ${err.status}`);
        }
        // Test 4: Verify OTP with invalid code (should fail)
        console.log('\n--- Test 4: Verify OTP with invalid code ---');
        try {
            await AuthService.verifyOTP(testEmail, '000000');
            throw new Error('OTP verification succeeded with invalid code!');
        }
        catch (err) {
            console.log('OTP verification failed as expected. Error:', err.message || err);
            if (err.status !== 400)
                throw new Error(`Expected status 400, got ${err.status}`);
        }
        // Test 5: Verify OTP with correct code
        console.log('\n--- Test 5: Verify OTP with correct code ---');
        const verifyRes = await AuthService.verifyOTP(testEmail, otpCode);
        console.log('OTP Verification Response:', verifyRes);
        // Verify DB user is now verified
        const userDbRes = await pool.query('SELECT is_verified FROM users WHERE email = $1', [testEmail]);
        if (!userDbRes.rows[0].is_verified)
            throw new Error('User remains unverified in DB after verification');
        console.log('Verified user status in DB: is_verified =', userDbRes.rows[0].is_verified);
        // Test 6: Login after verification (should succeed)
        console.log('\n--- Test 6: Login after verification ---');
        const loginRes = await AuthService.login(testEmail, password);
        console.log('Login Response (Truncated Token):', { ...loginRes, token: `${loginRes.token.slice(0, 15)}...` });
        if (!loginRes.token)
            throw new Error('Token not returned in login');
        // Test 7: Get current user
        console.log('\n--- Test 7: Fetch Current User ---');
        const meRes = await AuthService.getUserById(loginRes.user.id);
        console.log('Me Response:', meRes);
        if (meRes.email !== testEmail)
            throw new Error('Email mismatch in profile');
        console.log('\n✅ ALL SERVICE TESTS PASSED SUCCESSFULLY! 🎉');
    }
    catch (error) {
        console.error('\n❌ TEST SUITE FAILED:', error.message || error);
        process.exit(1);
    }
    finally {
        // Cleanup
        await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
        await pool.query('DELETE FROM otp_verifications WHERE email = $1', [testEmail]);
        await pool.end();
    }
}
runTests();
