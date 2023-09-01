const express = require("express");
const router = express.Router();
const services = require("../services/dashboardService");
const shared = require('../Shared/sharedFunctions')


router.get("/exit", async function (req, res) {
  if (!req.query.month) {
    req.query.month = "12";
  }
  let days = await shared.getNumberOfDays(req.query.year, req.query.month - 1);
  let result = await services.exit_count(
    req.query.type,
    req.query.year,
    req.query.month,
    days
  );
  res.send(result);
});

router.post("/search", async function (req, res) {
  if (!req.body.month) {
    req.body.month = "12";
  }
  let days =await shared.getNumberOfDays(req.body.year, req.body.month - 1);
  let result = await services.SearchData(req.body, days);
  res.send(result);
});

router.get("/attritionGraphCount", async function (req, res) {
  let result = await services.getAttritionCount(req.query.year);
  res.send(result);
});

router.get("/headcountMovement", async function (req, res) {
  let result = await services.getemployeeMovement(req.query.year);
  res.send(result);
});

router.get("/globalHeadCount", async function (req, res) {
  let month = req.query.month ? req.query.month : "12";
  let days = await shared.getNumberOfDays(req.query.year, month - 1);
  let result = await services.getRegionWiseCount(req.query.year, month, days);
  res.send(result);
});



module.exports = router;
