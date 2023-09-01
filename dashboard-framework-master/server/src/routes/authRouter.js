const express = require("express");
const router = express.Router();
const services = require("../services/authService");
const shared = require('../Shared/sharedFunctions')

router.post("/", async function (req, res) {

    let result = await services.isAuthorized(req.body)
    res.send(result)
})

module.exports = router;