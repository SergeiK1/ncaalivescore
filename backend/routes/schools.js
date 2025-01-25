const express = require("express");
const { schoolData } = require("../services/dataStore");

const router = express.Router();

// Endpoint to get all schools
router.get("/", (req, res) => {
  res.json(schoolData);
});

module.exports = router;
