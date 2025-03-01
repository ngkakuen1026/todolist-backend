import express from 'express';
import bodyParser from "body-parser";
import { authenicateToken } from '../middleware/auth.js';
import { getAllUser, getUserProfile, updatePassword, updateUser, uploadImage } from '../controllers/userControllers.js';
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get("/profile", authenicateToken, getUserProfile);
router.put("/:id", authenicateToken, updateUser);
router.put("/:id/changepassword", authenicateToken, updatePassword)
router.post("/:id/upload", authenicateToken, upload.single("profile_image"), uploadImage);

export default router;