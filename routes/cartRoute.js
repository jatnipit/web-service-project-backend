import express from "express";
import * as cartController from "../controllers/cartController.js";

const router = express.Router();

router.get("/check-cart", cartController.checkCartSession);
router.post("/add-item-to-cart", cartController.addItemToCart);
router.put("/update-item-in-cart/:id", cartController.updateItemInCart);
router.delete("/delete-item-from-cart/:id", cartController.deleteItemFromCart);
router.get("/show-item-in-cart/:id", cartController.showItemInCart);
router.post("/order-checkout", cartController.orderCheckout);
router.get("/show-order-history/:id", cartController.showOrderHistory);

export default router;