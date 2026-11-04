const express = require("express");
const router = express.Router();

const { register, login, getMe } =
    require("../controllers/authController");

const {
    verifyToken
} = require("../middleware/authMiddleware");

// Registration
router.post("/register", register);

// Login
router.post("/login", login);

// Protected route — returns fresh user data from DB
router.get("/me", verifyToken, getMe);

module.exports = router;
