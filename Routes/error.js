const express = require("express");
const router = express.Router();
const controller = require("../controllers/errorController");

router.get("/error/code/500", controller.get500ErrorPage);

router.use(controller.get404ErrorPage);

module.exports = router;
