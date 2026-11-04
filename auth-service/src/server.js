require("dotenv").config();

const express = require("express");
const pool = require("./config/db");

const authRoutes = require("./routes/authRoutes");

const app = express();

// Enable CORS for frontend clients
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);

// Health check
app.get("/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            status: "success",
            message: "Database connected",
            time: result.rows[0].now
        });

    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
});
