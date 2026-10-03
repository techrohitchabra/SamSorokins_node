import { Router } from "express";
import multer from "multer";
import { getKeysData } from "./get";
import checkout from "./post";
import update from "./put";
import retKey from "./return";
import deleteKey from "./delete";
import getByRfid from "./getByRfid";
import webhook from "./webhook";
import nonVendorWebhook from "./nonVendorWebhook";
import keyManagementWebhook from "./keyManagementWebhook";
import publicVendorCheckout from "./publicVendorCheckout";
import publicNonVendorCheckout from "./publicNonVendorCheckout";
import { authOnly } from "../../middlewares/restrict";

const upload = multer();
const router = Router();

// Public webhook and checkout routes
router.post("/webhook", upload.none(), webhook); // for vendor
router.post("/webhook/non-vendor", upload.none(), nonVendorWebhook); // for non-vendor
router.post("/webhook/key-management", upload.none(), keyManagementWebhook); // for key management
router.post("/public-checkout", checkout); // public checkout endpoint without auth
router.post("/public-checkout/vendor", publicVendorCheckout);
router.post("/public-checkout/non-vendor", publicNonVendorCheckout);

// Protected routes
router.get("/", authOnly, getKeysData);
router.get("/by-rfid/:rfId", authOnly, getByRfid);
router.post("/checkout", authOnly, checkout);
router.put("/:id", authOnly, update);
router.post("/:id/return", authOnly, retKey);
router.delete("/:id", authOnly, deleteKey);

export default router;
