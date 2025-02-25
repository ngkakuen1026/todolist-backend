import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoutes.js";
import taskRoute from "./routes/taskRoutes.js";
import authRoute from "./routes/authRoutes.js";

const app = express();
const port = 3000;

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,              
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/users", userRoute);
app.use("/auth", authRoute);
app.use("/tasks", taskRoute);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: "Something went wrong!" });
});

app.get("/health", (req, res) => {
    res.status(200).send({ message: "Server is healthy!" });
});

// Start the server
app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});