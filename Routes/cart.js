const express = require("express");
const router = express.Router();
const controller = require("../controllers/cartController");
const authentication = require("../util/is-auth.js");

router.get("/my-cart", authentication.isNotAuth, controller.getCartPage);

router.get("/my-orders", authentication.isNotAuth, controller.getOrders);

router.post("/add-to-cart", authentication.isNotAuth, controller.postCartProduct);

router.post("/one-increase", authentication.isNotAuth, controller.postIncreaseProduct);

router.post("/one-decrease", authentication.isNotAuth, controller.postDecreaseProduct);

router.post("/order-now", authentication.isNotAuth, controller.postOrderProduct);

router.get("/orders/:orderId", authentication.isNotAuth, controller.getInvoice);

router.post("/delete-from-cart", authentication.isNotAuth, controller.deleteProductFromCart);

module.exports = router;
