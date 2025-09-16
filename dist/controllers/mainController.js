"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = exports.authenticateToken = void 0;
const user_1 = require("../models/user");
const authenticateToken = (req, res, next) => {
    console.log('Authentication check for path:', req.path);
    console.log('Cookies received:', req.cookies);
    const token = req.cookies.token;
    if (!token) {
        console.log('No token found, redirecting to login');
        return res.redirect('/login');
    }
    console.log('Token found, verifying...');
    const decoded = (0, user_1.verifyToken)(token);
    if (!decoded) {
        console.log('Token verification failed, redirecting to login');
        return res.redirect('/login');
    }
    console.log('Token verified successfully for user:', decoded.email);
    req.user = decoded;
    next();
};
exports.authenticateToken = authenticateToken;
const getDashboard = (req, res) => {
    res.render('dashboard', {
        user: req.user,
        title: 'Dashboard',
        currentPage: 'dashboard',
        layout: 'layouts/base'
    });
};
exports.getDashboard = getDashboard;
