// routes/accountRoute.js
const express = require("express")
const router = new express.Router()
const utilities = require("../utilities")
const regValidate = require('../utilities/account-validation')
const accountController = require("../controllers/accountController")
const pool = require("../database") 

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


// GET: Add member form (protected in controller)
router.get("/add-member", utilities.handleErrors(accountController.buildAddMember))

// POST: Add member with image upload
// Use the exported middleware array from controller
router.post(
  "/add-member",
  accountController.addMemberMiddleware  // This is [upload.single('profile_image'), actual addMember handler]
)

// GET: Edit member form
router.get("/edit-member/:id", utilities.handleErrors(accountController.buildEditMember));

// POST: Update member
router.post(
  "/update-member/:id",                   // allow new image
  accountController.updateMemberMiddleware
);

/// GET: Search member by first name
router.get("/search-member", utilities.handleErrors(async (req, res) => {
  const firstname = req.query.firstname?.trim();
  if (!firstname) {
    return res.json([]);
  }

  const sql = `
    SELECT 
      member_id, 
      member_firstname, 
      member_lastname, 
      member_email, 
      member_phone, 
      member_address, 
      member_profile_image,   -- ← ADD THIS LINE
      membership_number
    FROM public.member 
    WHERE LOWER(member_firstname) LIKE LOWER($1)
    ORDER BY member_firstname
    LIMIT 20
  `;

  const result = await pool.query(sql, [`${firstname}%`]);
  res.json(result.rows);
}));


module.exports = router