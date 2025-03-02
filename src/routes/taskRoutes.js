import express from 'express';
import bodyParser from 'body-parser';
import { authenicateToken } from '../middleware/auth.js';
import { getUserTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get("/", authenicateToken, getUserTasks);
router.post("/", authenicateToken, upload.single("task_image"), createTask);
router.put("/:taskId", authenicateToken, upload.single("task_image"), updateTask);
router.delete("/:taskId", authenicateToken, deleteTask);

export default router;