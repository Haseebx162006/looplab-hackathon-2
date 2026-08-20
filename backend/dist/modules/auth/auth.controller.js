import { AuthService } from './auth.service.js';
export class AuthController {
    static async signup(req, res, next) {
        try {
            const { name, email, password } = req.body;
            if (!name || !email || !password) {
                return res.status(400).json({ error: 'Name, email, and password are required' });
            }
            const result = await AuthService.signup(name, email, password);
            res.status(201).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyOTP(req, res, next) {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) {
                return res.status(400).json({ error: 'Email and OTP are required' });
            }
            const result = await AuthService.verifyOTP(email, otp);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async resendOTP(req, res, next) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }
            const result = await AuthService.resendOTP(email);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }
            const result = await AuthService.login(email, password);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async me(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const user = await AuthService.getUserById(userId);
            res.status(200).json({ user });
        }
        catch (error) {
            next(error);
        }
    }
}
