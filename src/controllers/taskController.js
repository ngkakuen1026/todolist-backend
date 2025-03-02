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
  
      const tasksWithImages = tasks.rows.map((task) => {
        if (task.task_image) {
          task.task_image = `data:${task.task_image_type};base64,${task.task_image.toString('base64')}`;
        }
        return task;
      });
  
      res.status(200).json({
        message: `Task fetched successfully for User ${username} with id ${userId}`,
        tasks: tasksWithImages,
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

// Create a new task
const createTask = async (req, res) => {
    const userId = req.user.user_id;
    const { title, description, type, is_completed, task_image, task_image_type } = req.body;
    const file = req.file; // File uploaded via form-data (if any)
  
    try {
      let imageBuffer = null;
      let imageType = null;
  
      if (file) {
        imageBuffer = file.buffer;
        imageType = file.mimetype;
      } else if (task_image) {
        imageBuffer = Buffer.from(task_image, "base64");
        imageType = task_image_type;
      }
  
      const result = await db.query(
        `INSERT INTO tasks (user_id, title, description, type, is_completed, task_image, task_image_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [userId, title, description, type, is_completed, imageBuffer, imageType]
      );
  
      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

// Update a task
const updateTask = async (req, res) => {
    const { taskId } = req.params;
    const { title, description, is_completed, task_image, task_image_type } = req.body;
    const userId = req.user.user_id;
    const file = req.file;
  
    try {
      const task = await db.query("SELECT * FROM tasks WHERE task_id = $1 AND user_id = $2", [taskId, userId]);
      if (task.rows.length === 0) {
        return res.status(404).json({ message: "Task not found or does not belong to user" });
      }
  
      let imageBuffer = null;
      let imageType = null;
  
      if (file) {
        imageBuffer = file.buffer;
        imageType = file.mimetype;
      } else if (task_image) {
        imageBuffer = Buffer.from(task_image, "base64");
        imageType = task_image_type;
      }
  
      const updatedTask = await db.query(
        `UPDATE tasks 
         SET title = $1, description = $2, is_completed = $3, 
             task_image = COALESCE($4, task_image), 
             task_image_type = COALESCE($5, task_image_type)
         WHERE task_id = $6 
         RETURNING *`,
        [title, description, is_completed, imageBuffer, imageType, taskId]
      );
  
      res.status(200).json({
        success: true,
        message: "Task modified successfully",
        data: updatedTask.rows[0],
      });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Internal Server Error" });
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