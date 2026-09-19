import { Router } from "express";
import get from "./get.js";
import sync from "./sync.js";
import deleteHandler from "./delete.js";

const router = Router();

router.get("/", get);
router.post("/sync", sync);
router.delete("/:id", deleteHandler);

export default router;
