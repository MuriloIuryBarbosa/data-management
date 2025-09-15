"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboard = exports.authenticateToken = void 0;
const user_1 = require("../models/user");
const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login');
    }
    const decoded = (0, user_1.verifyToken)(token);
    if (!decoded) {
        return res.redirect('/login');
    }
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
