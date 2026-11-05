const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                return new Error("Redis max reconnection attempts reached");
            }
            return Math.min(retries * 200, 2000);
        }
    }
});

redisClient.on("error", (error) => {
    console.error("Redis Client Error:", error.message);
});

const connectRedis = async () => {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        console.log("Redis connected successfully");
    } catch (error) {
        console.error("Redis connection failed:", error.message);
        throw error;
    }
};

module.exports = {
    redisClient,
    connectRedis
};
