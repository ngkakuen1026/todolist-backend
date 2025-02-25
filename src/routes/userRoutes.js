import express from 'express';
import bodyParser from "body-parser";
import { authenicateToken } from '../middleare/auth.js';
import { getUserProfile, updateUser } from '../controllers/userControllers.js';

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get("/profile", authenicateToken, getUserProfile);
router.put("/:id", authenicateToken, updateUser);

export default router;