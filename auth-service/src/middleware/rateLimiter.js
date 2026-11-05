const { redisClient } = require("../config/redis");

const WINDOW_SECONDS = 900; // 15 minutes
const MAX_ATTEMPTS = 5;

const loginRateLimiter = async (req, res, next) => {
    try {
        // Identify the client using its IP address
        const ip = req.ip;

        // Create a unique Redis key for this IP
        const key = `login_attempts:${ip}`;
        req.rateLimitKey = key;

        // Increment the request counter
        const attempts = await redisClient.incr(key);

        // Check remaining time
        let ttl = await redisClient.ttl(key);

        // Set expiry on the first request, or recover if key lost its TTL (-1)
        if (attempts === 1 || ttl === -1) {
            await redisClient.expire(key, WINDOW_SECONDS);
            ttl = WINDOW_SECONDS;
        }

        // Maximum 5 requests in 15 minutes
        if (attempts > MAX_ATTEMPTS) {
            res.setHeader("Retry-After", ttl);

            return res.status(429).json({
                message: "Too many login attempts. Try again later.",
                retryAfter: ttl
            });
        }

        // Allow request to continue
        next();

    } catch (error) {
        console.error("Rate limiter error:", error);

        // Fail closed if Redis is unavailable
        return res.status(503).json({
            message: "Authentication service temporarily unavailable"
        });
    }
};

module.exports = { loginRateLimiter };
