const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Register user
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        //1.Validate user input
        if (!name || !email || !password || !role) {
            return res.status(400).json({ status: "error", message: "Please provide all required fields" });
        }
        //2.Validate Role
        if (!["CANDIDATE", "RECRUITER"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }
        const normalizedEmail = email.trim().toLowerCase();
        //3.Check if user already exists
        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [normalizedEmail]
        );
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ status: "error", message: "User already exists" });
        }
        //4.HashPassword
        const hashedPassword = await bcrypt.hash(password, 10);
        // 5. Insert user into database
        const result = await pool.query(
            `INSERT INTO users
            (name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at`,
            [name.trim(), normalizedEmail, hashedPassword, role]
        );
        // 6. Return response
        return res.status(201).json({
            message: "Registration successful",
            user: result.rows[0]
        });
    }
    catch (err) {
        console.error("Registration error:", err.message);
        return res.status(500).json({ status: "error", message: "Registration failed: " + err.message });
    }
};


//Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        //1.Validate user input
        if (!email || !password) {
            return res.status(400).json({ status: "error", message: "Please provide email and password" });
        }

        //2.Find The User in the database
        const normalizedEmail = email.trim().toLowerCase();
        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [normalizedEmail]
        )
        if (result.rows.length === 0) {
            return res.status(400).json({ status: "error", message: "Invalid email or password" });
        }
        const user = result.rows[0];

        //3.Compare Passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: "error", message: "Invalid email or password" });
        }

        //4.Generate JWT Token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h",issuer:"job-portal-auth" }
        );

        //5.Return Response
        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    }
    catch (err) {
        console.error("Login error:", err);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
}


const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, name, email, role, created_at
             FROM users
             WHERE id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    register,
    login,
    getMe
};
