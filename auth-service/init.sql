-- Initialize database schema for auth-service
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CANDIDATE', 'RECRUITER')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

