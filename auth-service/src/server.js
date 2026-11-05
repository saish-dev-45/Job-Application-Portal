
require("dotenv").config();

const express = require("express");
const pool = require("./config/db");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const { redisClient, connectRedis } = require("./config/redis");

const app = express();

// Trust the first proxy (API Gateway) so req.ip reflects the real client IP
app.set("trust proxy", 1);

// Enable CORS for frontend clients
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization"
    ],
    exposedHeaders: ["Retry-After"]
}));

app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.status(200).json({
            status: "success",
            message: "Database connected",
            redis: redisClient.isReady ? "connected" : "disconnected",
            time: result.rows[0].now
        });

    } catch (error) {
        console.error("Database health check failed:", error);

        res.status(500).json({
            status: "error",
            message: "Database connection failed"
        });
    }
});

// Start server after connecting to Redis
const PORT = process.env.PORT || 5001;

const startServer = async () => {
    try {
        await connectRedis();

        app.listen(PORT, () => {
            console.log(`Auth Service running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Failed to start Auth Service:", error.message);
        process.exit(1);
    }
};

startServer();
