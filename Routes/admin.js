const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminController.js");
const authentication = require("../util/is-auth.js");
const { check } = require("express-validator");
// her url in başında app.js de tanımlanan bir "/admin" etiketi bulunmaktadır.

router.get(
  "/add-product",
  authentication.isNotAuth,
  controller.getAddProductPage
);

router.post(
  "/add-product",
  [
    check("title", "Invalid title type")
      .matches(/[a-zA-Z]/)
      .trim()
      .isLength({ min: 3 }),
    check("price", "Invalid price type ").isFloat(),
    check("description", "Invalid description type")
      .trim()
      .isLength({ min: 5, max: 200 }),
  ],
  authentication.isNotAuth,
  controller.postAddProduct
);

router.get(
  "/product-list",
  authentication.isNotAuth,
  controller.getAdminProducts
);

router.get(
  "/edit-product/:productId",
  authentication.isNotAuth,
  controller.getEditProductPage
);

router.post(
  "/edit-product",
  [
    check("title", "Invalid title type")
      .matches(/[a-zA-Z]/)
      .trim()
      .isLength({ min: 3 }),
    check("price", "Invalid price type ").isFloat(),
    check("description", "Invalid description type")
      .trim()
      .isLength({ min: 5, max: 200 }),
  ],
  authentication.isNotAuth,
  controller.postEditProduct
);

router.post(
  "/delete-product",
  authentication.isNotAuth,
  controller.postDeleteProduct
);

router.get("/", authentication.isNotAuth, controller.getAdminPage);

module.exports = router;
