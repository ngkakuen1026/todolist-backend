import express from 'express';
import bodyParser from 'body-parser';
import { authenicateToken } from '../middleare/auth.js';
import { getUserTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get("/", authenicateToken, getUserTasks);
router.post("/", authenicateToken, createTask)
router.put("/:taskId", authenicateToken, updateTask);
router.delete("/:taskId", authenicateToken, deleteTask);

export default router;