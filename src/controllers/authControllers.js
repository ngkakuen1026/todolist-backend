import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../database/db.js"

if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error("Missing required environment variables");
}

const saltRounds = 10; 


const generateAccessToken = (userPayload) => {
    return jwt.sign(userPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (userPayload) => {
    return jwt.sign(userPayload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

// Register a new user
const registerUser = async (req, res) => {
    const { first_name, last_name, username, phone, gender, email, password } = req.body;

    try {
        const checkUserNameResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
        const checkEmailResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (checkUserNameResult.rows.length > 0) {
            return res.status(400).json({ message: `Username is already registered` });
        }
        if (checkEmailResult.rows.length > 0) {
            return res.status(400).json({ message: `Email is already registered` });
        }

        const hashedPassword = await bcrypt.hash(String(password), saltRounds);

        await pool.query(
            "INSERT INTO users (first_name, last_name, username, phone, gender, email, password) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [first_name, last_name, username, phone, gender, email, hashedPassword]
        );

        res.status(201).json({ message: `User ${username} registered successfully` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: `Internal Server Error` });
    }
};

// Login user
const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const userResult = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = userResult.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ message: "Incorrect password" });
        }

        const { user_id, username: userUsername } = user;

        const accessToken = generateAccessToken({ user_id, username: userUsername });
        const refreshToken = generateRefreshToken({ user_id, username: userUsername });

        // Replace old refresh token and store the new one in the database
        await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [user_id]);
        await pool.query(
            "INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)",
            [refreshToken, user_id, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        );

        // Set the refresh token in an HTTP-Only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict", 
            maxAge: 7 * 24 * 60 * 60 * 1000, 
        });

        console.log(`User ${userUsername} logged in successfully`)
        console.log(`User refreshToken: ${refreshToken}`)
        console.log(`User accessToken: ${accessToken}`)
        res.status(200).json({
            message: `User ${userUsername} logged in successfully`,
            accessToken,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Logout user
const logoutUser = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({ message: "No refresh token provided" });
        }

        await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]);
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unable to log out" });
    }
};

// Refresh access token
const refreshAccessToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token required" });
    }

    try {
        const tokenResult = await pool.query("SELECT * FROM refresh_tokens WHERE token = $1", [refreshToken]);
        if (tokenResult.rows.length === 0) {
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        const storedToken = tokenResult.rows[0];

        if (new Date(storedToken.expires_at) < new Date()) {
            await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken]); // Remove expired token
            return res.status(403).json({ message: "Refresh token expired" });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: "Invalid or expired refresh token" });
            }

            const accessToken = generateAccessToken({ user_id: user.user_id, username: user.username });
            res.status(200).json({ accessToken });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export { registerUser, loginUser, logoutUser, refreshAccessToken };