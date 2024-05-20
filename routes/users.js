const express = require("express");
const router = express.Router();

const { errorHandled } = require("../services/errorHandling");
const controllers = require("../controllers/users");

router.get("/", errorHandled(controllers.getUsers));

module.exports = router;
