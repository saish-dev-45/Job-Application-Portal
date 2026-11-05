const { createProxyMiddleware } = require("http-proxy-middleware");

const authProxy = createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    xfwd: true,

    // Restore the /api/auth prefix removed by Express mounting
    pathRewrite: (path) => `/api/auth${path}`,

    on: {
        error: (err, req, res) => {
            console.error("Auth Service Error:", err.message);

            if (!res.headersSent) {
                res.writeHead(502, {
                    "Content-Type": "application/json"
                });

                res.end(JSON.stringify({
                    message: "Auth Service is unavailable"
                }));
            }
        }
    }
});

module.exports = authProxy;
