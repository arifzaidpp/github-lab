import express from "express";
import { signup, logout, users, updateUser, deleteUser, login, uploadImage, deleteImage } from "../controllers/auth.controller.js";
import upload from "../utils/multerFile.js";
import { auth } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/login", login);

router.post("/signup",auth, signup);

router.delete("/delete/:id",auth, deleteUser);

router.put("/:id",auth, updateUser);

router.post("/upload-image",upload, uploadImage);

router.post('/delete-image', deleteImage);

router.get("/users", auth, users);

router.post('/logout', logout);


export default router;
