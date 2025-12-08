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
const bcrypt = require("bcryptjs")
const pool = require("../database/")
const { validationResult } = require("express-validator")  // ← THIS WAS MISSING
require("dotenv").config()
// const bcrypt = require("bcryptjs")
// const { validationResult } = require("express-validator")
// This connects to your PostgreSQL DB

const accountController = {}

/* ****************************************
*  Deliver registration view
* **************************************** */
accountController.buildRegister = async function (req, res) {
  const nav = await utilities.getNav()
  const isAdminRegistration = req.query.admin === "true"
  
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
    isAdminRegistration,
    account_firstname: "",
    account_lastname: "",
    account_email: "",
    account_phone: ""
  })
}

/* ****************************************
*  Process Registration (SAVES TO DATABASE!)
* **************************************** */
accountController.registerAccount = async function (req, res) {
  let nav = await utilities.getNav()
  const errors = validationResult(req)
  const isAdminAttempt = req.query.admin === "true"

  // Re-render form with errors if validation fails
  if (!errors.isEmpty()) {
    return res.render("account/register", {
      title: "Register",
      nav,
      errors: errors,
      isAdminRegistration: isAdminAttempt,
      ...req.body
    })
  }

  const {
    account_firstname,
    account_lastname,
    account_email,
    account_phone,
    account_password,
    admin_key
  } = req.body

  // Hash the password
  const hashedPassword = await bcrypt.hash(account_password, 10)

  try {
    // 1. Insert into users table
    const userSql = `
      INSERT INTO public.users 
        (full_name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, full_name, email, role`

    const fullName = `${account_firstname} ${account_lastname}`
    let role = "CITIZEN"  // default

    // 2. Check if this is a valid admin registration
    const ADMIN_SECRET_KEY = "UHWF2025ADMIN"  // CHANGE THIS to your real secret!
    if (isAdminAttempt && admin_key === ADMIN_SECRET_KEY) {
      role = "EMPLOYEE"  // This allows them to become staff
    }

    const userResult = await pool.query(userSql, [
      fullName,
      account_email.toLowerCase(),
      account_phone || null,
      hashedPassword,
      role
    ])

    const newUser = userResult.rows[0]

    // 3. If admin → auto-create staff record with basic permissions
    if (role === "EMPLOYEE") {
      await pool.query(`
        INSERT INTO public.staff_members 
          (user_id, staff_level, can_approve_documents, can_moderate_forums)
        VALUES ($1, $2, $3, $4)
      `, [newUser.id, "CONTENT_APPROVER", true, true])
    }

    // Success!
    req.flash("success", `Welcome ${fullName}! Account created successfully.`)
    res.redirect("/account/login")

  } catch (error) {
    console.error("Registration error:", error)

    // Handle duplicate email
    if (error.code === "23505" && error.constraint === "users_email_key") {
      errors.errors.push({ msg: "This email is already registered." })
    } else {
      errors.errors.push({ msg: "Registration failed. Please try again." })
    }

    res.render("account/register", {
      title: "Register",
      nav,
      errors,
      isAdminRegistration: isAdminAttempt,
      ...req.body
    })
  }
}

/* ****************************************
*  Deliver login view
* **************************************** */
accountController.buildLogin = async function (req, res) {
  let nav = await utilities.getNav()
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null
  })
}

module.exports = accountController