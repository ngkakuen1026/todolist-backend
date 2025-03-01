import bcrypt from "bcrypt";
import pool from "../database/db.js"

const saltRounds = 10;

// Get all users (test)
const getAllUser = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM users");
        res.status(200).json({ result });
        console.log(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Fetch user profile
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;

        const user = await pool.query(
            "SELECT user_id, username, email, first_name, last_name, phone, gender, registration_date, profile_image, profile_image_type FROM users WHERE user_id = $1",
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const{user_id, username, email, first_name, last_name, phone, gender, registration_date, profile_image, profile_image_type} = user.rows[0];

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
        const existingUser = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);
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

            await pool.query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
        }

        // Remove the trailing comma and space, then add the WHERE clause
        query = query.slice(0, -2); // Remove the last ", "
        query += " WHERE user_id = $" + (values.length + 1) + " RETURNING *";
        values.push(userId);

        // Execute the query
        const updatedUser = await pool.query(query, values);

        res.status(200).json({ 
            message: "User updated successfully", 
            user: updatedUser.rows[0],
        });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "An error occurred while updating user info" });
    }
};

// Update User Password
const updatePassword = async (req, res) => {
  const userId = req.params.id;
  const { oldPassword, newPassword } = req.body;

  try {
    const userQuery = await pool.query("SELECT * FROM users WHERE user_id = $1", [userId]);

    if (userQuery.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userQuery.rows[0];

    // Validate the old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query("UPDATE users SET password = $1 WHERE user_id = $2", [hashedPassword, userId]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const uploadImage = async (req, res) => {
    const userId = req.params.id;

    if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ message: "No file uploaded" });
    }

    try {
        const result = await pool.query(
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



export {getAllUser, getUserProfile, updateUser, uploadImage, updatePassword};
