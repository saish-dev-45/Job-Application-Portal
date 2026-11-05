
const express = require("express");
const router = express.Router();

const {
    register,
    login,
    getMe
} = require("../controllers/authController");

const {
    verifyToken
} = require("../middleware/authMiddleware");

const {
    loginRateLimiter
} = require("../middleware/rateLimiter");

// Registration
router.post("/register", register);

// Login with Redis rate limiting
router.post("/login", loginRateLimiter, login);

// Protected route - returns fresh user data from DB
router.get("/me", verifyToken, getMe);

module.exports = router;
