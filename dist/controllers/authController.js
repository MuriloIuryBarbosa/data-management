"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postForgotPassword = exports.getForgotPassword = exports.postRegister = exports.getRegister = exports.postLogin = exports.getLogin = void 0;
const user_1 = require("../models/user");
const getLogin = (req, res) => {
    res.render('login', { errors: [], layout: false });
};
exports.getLogin = getLogin;
const postLogin = async (req, res) => {
    console.log('Login attempt:', { email: req.body.email, hasPassword: !!req.body.password });
    const { email, password } = req.body;
    if (!email || !password) {
        console.log('Missing email or password');
        return res.render('login', { errors: [{ msg: 'Email and password are required' }], layout: false });
    }
    try {
        const user = await (0, user_1.findUserByEmail)(email);
        console.log('User found:', user ? 'Yes' : 'No');
        if (!user) {
            console.log('User not found');
            return res.render('login', { errors: [{ msg: 'Invalid credentials' }], layout: false });
        }
        const isValidPassword = await (0, user_1.validatePassword)(password, user.password);
        console.log('Password valid:', isValidPassword);
        if (!isValidPassword) {
            console.log('Invalid password');
            return res.render('login', { errors: [{ msg: 'Invalid credentials' }], layout: false });
        }
        const token = (0, user_1.generateToken)(user);
        console.log('Token generated, setting cookie and redirecting');
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 3600000 // 1 hour
        });
        console.log('Redirecting to dashboard...');
        res.redirect('/');
    }
    catch (error) {
        console.error('Login error:', error);
        res.render('login', { errors: [{ msg: 'An error occurred during login' }], layout: false });
    }
};
exports.postLogin = postLogin;
const getRegister = (req, res) => {
    res.render('register', { errors: [], layout: false });
};
exports.getRegister = getRegister;
const postRegister = async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name || password.length < 6) {
        return res.render('register', { errors: [{ msg: 'All fields are required and password must be at least 6 characters' }], layout: false });
    }
    try {
        await (0, user_1.createUser)(email, password, name);
        res.redirect('/login');
    }
    catch (err) {
        res.render('register', { errors: [{ msg: 'Email already exists' }], layout: false });
    }
};
exports.postRegister = postRegister;
const getForgotPassword = (req, res) => {
    res.render('forgot-password', { message: '', layout: false });
};
exports.getForgotPassword = getForgotPassword;
const postForgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.render('forgot-password', { message: 'Email is required', layout: false });
    }
    // For now, just show a message. In production, send email.
    res.render('forgot-password', { message: 'If the email exists, a reset link has been sent.', layout: false });
};
exports.postForgotPassword = postForgotPassword;
