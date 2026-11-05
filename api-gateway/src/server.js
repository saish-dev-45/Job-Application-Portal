require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authProxy = require("./routes/authRoutes");

const app = express();

// Enable frontend communication
app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    exposedHeaders: ["Retry-After"]
}));

// Gateway health check (also probes downstream Auth Service, DB & Redis)
app.get("/health", async (req, res) => {
    const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
    let downstream = {
        authService: "offline",
        database: "unknown",
        redis: "unknown"
    };

    try {
        const authRes = await fetch(`${authUrl}/health`, {
            signal: AbortSignal.timeout(2000)
        });
        const authData = await authRes.json().catch(() => ({}));

        downstream = {
            authService: authRes.ok ? "online" : "degraded",
            database: authRes.ok && authData.status === "success" ? "connected" : "disconnected",
            redis: authData.redis || "unknown"
        };
    } catch {
        // Auth service unreachable — Gateway itself is still online
    }

    res.status(200).json({
        status: "success",
        message: "API Gateway is running",
        services: downstream
    });
});

// Forward authentication requests to Auth Service
app.use("/api/auth", authProxy);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
