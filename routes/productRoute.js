import express from "express";

import * as productController from "../controllers/productController.js";

const router = express.Router();
router.get("/main-product", productController.showProducts);
router.get("/main-product/:id", productController.searchProduct);
router.post("/main-product", productController.addProduct);
router.put("/main-product/:id", productController.updateProduct);
router.delete("/main-product/:id", productController.deleteProduct);
router.get("/main-product/:id", productController.showProductById);

export default router;