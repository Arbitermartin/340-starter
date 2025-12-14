// // // controllers/accountController.js
// // const utilities = require("../utilities/index")

// // /* ****************************************
// //  *  Deliver login view
// //  * *************************************** */
// // async function buildLogin(req, res, next) {
// //   let nav = await utilities.getNav()
// //   res.render("account/login", {
// //     title: "Login",
// //     nav,
// //   })
// // }

// // /* ****************************************
// //  *  Deliver register view
// //  * *************************************** */
// // async function buildRegister(req, res, next) {
// //     let nav = await utilities.getNav()
// //     res.render("account/register", {
// //       title: "Register",
// //       nav,
// //     })
// //   }

// // module.exports = { buildLogin,buildRegister }

// // controllers/accountController.js
// const utilities = require("../utilities")
// const accountModel = require("../models/account-model")  // You may need this later

// const accountController = {}

// /* Deliver registration view */
// accountController.buildRegister = async function (req, res) {
//   const nav = await utilities.getNav()
//   res.render("account/register", {
//     title: "Register",
//     nav,
//     errors: null,
//   })
// }

// /* Process registration */
// accountController.registerAccount = async function (req, res) {
//   const nav = await utilities.getNav()
  
//   // For now: just show success (you'll add real DB insert later)
//   res.render("account/login", {
//     title: "Login",
//     nav,
//     message: "Registration successful! Please log in.",
//     errors: null
//   })
// }

// /* Deliver login view */
// accountController.buildLogin = async function (req, res) {
//   const nav = await utilities.getNav()
//   res.render("account/login", {
//     title: "Login",
//     nav,
//     errors: null,
//   })
// }

// module.exports = accountController
// controllers/accountController.js
const utilities = require("../utilities")
const accountModel =require("../models/account-model")
require("dotenv").config()


/*************************
 * Deliver login view
 * Deliver login view Activity
 *********************************/
async function buildLogin(req,res,next) {
  let nav =await utilities.getNav()
  res.render("account/login",{
      title: "Login",
      nav,
      errors: null,
  })
  
}

/**********************************
 * Deliver registration view
 * Deliver registration view Activity
 */
async function buildRegister(req,res,next) {
  let nav =await utilities.getNav()
  res.render("account/register",{
      title: "Register",
      nav,
      errors: null,
  })    
}

//  login account
async function loginAccount(req, res, next) {
  // Placeholder: Add actual login logic later
  let nav = await utilities.getNav()
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
    account_email: req.body.account_email,
  })
}

/* ****************************************
*  Process Registration
* *************************************** */


async function registerAccount(req, res) {
  console.log(req.body)
  let nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    account_password
  )

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you\'re registered ${account_firstname}. Please log in.`
    )
    res.status(201).render("account/login", {
      title: "Login",
      nav,
    })
  } else {
    req.flash("notice", "Sorry, the registration failed.")
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
    })
  }
}
module.exports={registerAccount,buildLogin,buildRegister,loginAccount}