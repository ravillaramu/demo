const express = require("express");
const router = express.Router();
const services = require("../services/dynamicDashboardService");
const shared = require('../Shared/sharedFunctions')

router.post("/count", async function (req, res) {

    let result = await services.getDataforDashboard(req.body)
    res.send(result)

})

module.exports = router;