import { Router } from "express";
import get from "./get.js";
import sync from "./sync.js";

const router = Router();

router.get("/", get);
router.post("/sync", sync);

export default router;
