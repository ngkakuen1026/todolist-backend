import pg from 'pg';
import env from "dotenv";

env.config();
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

// Get all tasks for the authenticated user
const getUserTasks = async (req, res) => {
    const userId = req.user.user_id;
    const username = req.user.username;
    try {
        const tasks = await db.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
        res.status(200).json({
          message: `Task fetched succesfully for User ${username} with id ${userId}`, 
          tasks: tasks.rows 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Create a new task
const createTask = async (req, res) => {
    const userId = req.user.user_id;
    const { title, description, type, is_completed } = req.body;
    try {
        const result = await db.query(
            'INSERT INTO tasks (user_id, title, description, type, is_completed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, title, description, type, is_completed]
        );
        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            data: result.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Update a task
const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, is_completed } = req.body;
    const userId = req.user.user_id;

    try {
        const task = await db.query("SELECT * FROM tasks WHERE task_id = $1 AND user_id = $2", [taskId, userId]);
        if (task.rows.length === 0) {
            return res.status(404).json({ message: "Task not found or does not belong to user" });
        }

        const updatedTask = await db.query(
            "UPDATE tasks SET title = $1, description = $2, is_completed = $3 WHERE task_id = $4 RETURNING *",
            [title, description, is_completed, taskId]
        );
        res.status(200).json({
            success: true,
            message: 'Task modified successfully',
            data: updatedTask.rows[0],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Delete a task
const deleteTask = async (req, res) => {
    const { taskId } = req.params;
    const userId = req.user.user_id;

    try {
        const result = await db.query(
            "DELETE FROM tasks WHERE task_id = $1 AND user_id = $2 RETURNING *",
            [taskId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Task not found or does not belong to user" });
        }

        res.status(200).json({
            success: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export {getUserTasks, createTask, updateTask, deleteTask} ;