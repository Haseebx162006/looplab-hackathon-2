import { pool } from './index.js';
import bcrypt from 'bcrypt';
async function seedAdmin() {
    console.log('🌱 Starting admin and mentor user seeding...');
    try {
        const adminEmail = 'admin@seekh.ai';
        const mentorEmail = 'mentor@seekh.ai';
        const hashAdmin = await bcrypt.hash('admin123', 10);
        const hashMentor = await bcrypt.hash('mentor123', 10);
        // 1. Check if admin exists
        const adminCheck = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
        if (adminCheck.rows.length === 0) {
            await pool.query(`INSERT INTO users (name, email, password_hash, is_verified, role, is_blocked)
         VALUES ($1, $2, $3, true, 'admin', false)`, ['System Admin', adminEmail, hashAdmin]);
            console.log(`✅ Seeded system admin user: ${adminEmail} (password: admin123)`);
        }
        else {
            await pool.query("UPDATE users SET role = 'admin', is_verified = true, is_blocked = false WHERE email = $1", [adminEmail]);
            console.log(`ℹ️ System admin user ${adminEmail} already exists. Verified admin role.`);
        }
        // 2. Check if mentor exists
        const mentorCheck = await pool.query('SELECT id FROM users WHERE email = $1', [mentorEmail]);
        if (mentorCheck.rows.length === 0) {
            await pool.query(`INSERT INTO users (name, email, password_hash, is_verified, role, is_blocked)
         VALUES ($1, $2, $3, true, 'admin', false)`, ['Code Mentor', mentorEmail, hashMentor]);
            console.log(`✅ Seeded code mentor user: ${mentorEmail} (password: mentor123)`);
        }
        else {
            await pool.query("UPDATE users SET role = 'admin', is_verified = true, is_blocked = false WHERE email = $1", [mentorEmail]);
            console.log(`ℹ️ Code mentor user ${mentorEmail} already exists. Verified admin/mentor role.`);
        }
        console.log('🎉 Seeding completed successfully!');
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
    }
    finally {
        await pool.end();
    }
}
seedAdmin();
