const express = require("express");
const router = express.Router();
const controller = require("../controllers/shopController");

router.get("/shop", controller.getShopPage);
router.get("/product/:productId", controller.getProductDetail);

module.exports = router;
