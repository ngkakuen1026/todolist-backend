import pg from "pg";
import env from "dotenv";
import bcrypt from "bcrypt";
import multer from "multer";

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

// Get all users (test)
const getAllUser = async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM users")
        res.status(200).json({ result })
        console.log(result.rows)
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// Fetch user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Fetch user information, including the profile image and its type
        const user = await db.query(
            "SELECT user_id, username, email, first_name, last_name, phone, gender, registration_date, profile_image, profile_image_type FROM users WHERE user_id = $1",
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const {
            user_id,
            username,
            email,
            first_name,
            last_name,
            phone,
            gender,
            registration_date,
            profile_image,
            profile_image_type,
        } = user.rows[0];

        const profileImageBase64 = profile_image
            ? `data:${profile_image_type};base64,${profile_image.toString("base64")}`
            : null;

        res.status(200).json({
            user: {
                user_id,
                username,
                email,
                first_name,
                last_name,
                phone,
                gender,
                registration_date,
                profile_image: profileImageBase64,
            },
        });
    } catch (err) {
        console.error("Error fetching user profile:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Update user information
const updateUser = async (req, res) => {
    const userId = req.params.id;
    const { first_name, last_name, phone, gender, email, password } = req.body;

    try {
        const existingUser = await db.query("SELECT * FROM users WHERE user_id = $1", [userId]);
        if (existingUser.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        let query = "UPDATE users SET ";
        const values = [];

        // Check if the input fields are present in the body, if so update the field
        if (first_name) {
            query += "first_name = $1, ";
            values.push(first_name);
        }
        if (last_name) {
            query += "last_name = $" + (values.length + 1) + ", ";
            values.push(last_name);
        }
        if (phone) {
            query += "phone = $" + (values.length + 1) + ", ";
            values.push(phone);
        }
        if (gender) {
            query += "gender = $" + (values.length + 1) + ", ";
            values.push(gender);
        }
        if (email) {
            query += "email = $" + (values.length + 1) + ", ";
            values.push(email);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            query += "password = $" + (values.length + 1) + ", ";
            values.push(hashedPassword);

            await db.query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
        }

        // Remove the trailing comma and space, then add the WHERE clause
        query = query.slice(0, -2); // Remove the last ", "
        query += " WHERE user_id = $" + (values.length + 1) + " RETURNING *";
        values.push(userId);

        // Execute the query
        const updatedUser = await db.query(query, values);

        res.status(200).json({ 
            message: "User updated successfully", 
            user: updatedUser.rows[0],
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "An error occurred while updating user info" });
    }
};

const uploadImage = async (req, res) => {
    const userId = req.params.id;

    if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const result = await db.query(
            "UPDATE users SET profile_image = $1, profile_image_type = $2 WHERE user_id = $3",
            [req.file.buffer, req.file.mimetype, userId]
        );

        console.log("Database update result:", result);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found or no rows updated" });
        }

        res.status(200).json({ message: "Profile image uploaded successfully" });
    } catch (error) {
        console.error("Error uploading profile image:", error);
        res.status(500).json({ message: "An error occurred while uploading the image." });
    }
};



export {getUserProfile, updateUser, uploadImage};
