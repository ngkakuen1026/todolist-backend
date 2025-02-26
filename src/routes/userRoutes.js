import express from 'express';
import bodyParser from "body-parser";
import { authenicateToken } from '../middleare/auth.js';
import { getUserProfile, updateUser, uploadImage } from '../controllers/userControllers.js';
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get("/profile", authenicateToken, getUserProfile);
router.put("/:id", authenicateToken, updateUser);
router.post("/:id/upload", authenicateToken, upload.single("profile_image"), uploadImage);

export default router;