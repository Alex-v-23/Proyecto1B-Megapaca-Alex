import express from "express";
import loginCustomersController from "../controllers/loginCustomersController.js";

const router = express.Router();

router.route("/").post(loginCustomersController.login);

export default router;