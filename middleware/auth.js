const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getBearerToken = (req) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1];
    }

    return null;
};

//Protect routes
exports.protect = async (req, res, next) => {
    const token = getBearerToken(req);

    //Make sure token exists
    if (!token) {
        return res.status(401).json({ success: false, msg: 'Not authorized to access this route' });
    }

    try {
        //Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (err) {
        return res.status(401).json({ success: false, msg: 'Not authorized to access this route' });
    }
};

exports.optionalProtect = async (req, res, next) => {
    const token = getBearerToken(req);

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
    } catch (err) {
        req.user = undefined;
    }

    next();
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, msg: `User role ${req.user.role} is not authorized to access this route` });
        }
        next();
    }
};
