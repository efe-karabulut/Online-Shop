const express = require("express");
const router = express.Router();
const controller = require("../controllers/signInController");
const authentication = require("../util/is-auth.js");

router.get("/sign-in", authentication.isAuth, controller.getSignIn);

router.get("/forgot-password", controller.getForgotPassword);

router.post("/forgot-password", controller.postResetPassword);

router.get("/reset/password/:token", controller.getUpdatePassword);

router.post("/update/password", controller.postUpdatePassword);

router.post("/sign-in", controller.postSignIn);

router.post("/sign-out", authentication.isNotAuth, controller.postSignOut);

module.exports = router;
