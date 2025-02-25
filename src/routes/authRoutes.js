import express from "express";
import bodyParser from 'body-parser';
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/authControllers.js";

const router = express.Router();
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/token", refreshAccessToken);

export default router;