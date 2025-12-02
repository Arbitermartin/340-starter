// routes/accountRoute.js
const express = require("express")
const router = express.Router()
const utilities = require("../utilities/index")
const accountController = require("../controllers/accountController")

// GET route for login view
// This route will be mounted under /account in server.js
router.get(
  "/login",
  utilities.handleErrors(accountController.buildLogin)
)
router.get(
    "/register",
    utilities.handleErrors(accountController.buildRegister)
)

module.exports = router