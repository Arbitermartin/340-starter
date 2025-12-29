// routes/accountRoute.js
const express = require("express")
const router = new express.Router()
const utilities = require("../utilities")
const regValidate = require('../utilities/account-validation')
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

// POST - Process registration 
router.post(
  "/register",
  utilities.handleErrors(accountController.registerAccount)   // This function must exist
)

// Process the login request
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
)

// Logout link.
router.get("/logout", utilities.handleErrors(accountController.logoutaccount))
 /*********************
    * account route
    * check login view.
    ***********************/
//  router.get("/", utilities.checkLogin, utilities.handleErrors(accountController.accountManagement))

// Process the registration data
router.post(
  "/register",
  regValidate.registationRules(),
  regValidate.checkRegData,
  utilities.handleErrors(accountController.registerAccount)
)
router.get("/",utilities.handleErrors(accountController.accountManagement))



module.exports = router