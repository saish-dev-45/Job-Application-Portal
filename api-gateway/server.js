require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authProxy = require("./routes/authRoutes");

const app = express();

// Enable frontend communication
app.use(cors({
    origin: "http://localhost:5173"
}));

// Gateway health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "API Gateway is running"
    });
});

// Forward authentication requests to Auth Service
app.use("/api/auth", authProxy);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});