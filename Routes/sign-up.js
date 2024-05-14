const express = require("express");
const router = express.Router();
const controller = require("../controllers/signUpController");
const { check } = require("express-validator");
const User = require("../models/user");
const authentication = require("../util/is-auth");

router.get("/sign-up", authentication.isAuth, controller.getSignUp);

router.post(
  "/sign-up",
  [
    check("signUpName", "Invalid Name").matches(/^\S*$/),
    check("signUpEmail", "Invalid E-mail adress").isEmail().normalizeEmail(),
    check(
      "signUpPassword",
      ` The password cannot be less than 5 characters
        must contain at least one capital letter
        must contain at least one number
      `
    )
      .isLength({ min: 5 })
      .matches(/^[A-Za-z0-9ğüşıöçĞÜŞİÖÇ]+$/)
      .matches(/\d/)
      .matches(/[A-Z]/)
      .matches(/^\S*$/),
    check("signUpPasswordConfrim").custom((value, { req }) => {
      if (value !== req.body.signUpPassword) {
        throw new Error("Password have to match");
      }
      return true;
    }),
  ],
  controller.postSignUp
);

module.exports = router;
