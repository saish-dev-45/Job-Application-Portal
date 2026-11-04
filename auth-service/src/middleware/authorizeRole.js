const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {

        // Check whether user is authenticated
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        // Check whether user has permission
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access forbidden: Insufficient permissions"
            });
        }

        // User has permission
        next();
    };
};

module.exports = { authorizeRole };