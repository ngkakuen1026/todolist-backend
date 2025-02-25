import pg from "pg";
import env from "dotenv";

env.config();
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
})
db.connect();

const saltRounds = 10;

// Fetch user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const user = await db.query("SELECT * FROM users WHERE user_id = $1", [userId]);

        if (user.rows.length > 0) {
            const { user_id, username, email, first_name, last_name, phone, gender, registration_date, profile_image_url } = user.rows[0];
            res.status(200).json({
                user: { user_id, username, email, first_name, last_name, phone, gender, registration_date, profile_image_url },
            });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Update user information
const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { first_name, last_name, phone, gender, email } = req.body;

    try {
        const existingUser = await db.query("SELECT * FROM users WHERE user_id = $1", [userId]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const updatedUser = await db.query(
            `UPDATE users 
             SET first_name = $1, 
                 last_name = $2, 
                 phone = $3, 
                 gender = $4, 
                 email = $5 
             WHERE user_id = $6 
             RETURNING *`,
            [first_name, last_name, phone, gender, email, userId]
        );

        res.status(200).json({ message: "User updated successfully", user: updatedUser.rows[0] });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "An error occurred while updating user info" });
    }
};

export {getUserProfile, updateUser};
