// module.exports = accountController
// controllers/accountController.js
const utilities = require("../utilities")
const jwt = require("jsonwebtoken")
const accountModel =require("../models/account-model")
const bcrypt = require("bcryptjs")
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
  let nav = await utilities.getNav()
  const { account_firstname, account_lastname, account_email, account_password } = req.body
  // Hash the password before storing
let hashedPassword
try {
  // regular password and cost (salt is generated automatically)
  hashedPassword = await bcrypt.hashSync(account_password, 10)
} catch (error) {
  req.flash("notice", 'Sorry, there was an error processing the registration.')
  res.status(500).render("account/register", {
    title: "Registration",
    nav,
    errors: null,
  })
}

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword
  )

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations, you\'re registered ${account_firstname}. Please log in.`
    )
    res.status(201).render("account/login", {
      title: "Login",
      nav,
      // changes i added this at 02/06/2025.
      errors: null,
      account_email,
    });
  } else {
    req.flash("notice", "Sorry, the registration failed.")
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
      // changes i added this at 02/06/2025.
      errors: [{ msg: error.message }],
      account_firstname: req.body.account_firstname || "",
      account_lastname: req.body.account_lastname || "",
      account_email: req.body.account_email || "",
    })
  }
}
/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  const accountData = await accountModel.getAccountByEmail(account_email)
  if (!accountData) {
    req.flash("notice", "Please check your credentials and try again.")
    res.status(400).render("account/login", {
      title: "Login",
      // nav,
      errors: null,
      account_email,
    })
    return
  }
  try {
    if (await bcrypt.compare(account_password, accountData.account_password)) {
      delete accountData.account_password
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      return res.redirect("/account/")
    }
    else {
      req.flash("message notice", "Please check your credentials and try again.")
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    throw new Error('Access Forbidden')
  }
}

/* ****************************************
 *  5 task 6
 * ************************************ */
async function accountLogout(req, res) {
  res.clearCookie("jwt")
  res.locals.loggedin = ''
  return res.redirect("/")
}
/* ****************************************
*  Deliver account management view
* *************************************** */
async function accountManagement(req, res, next) {
  const accountData =res.locals.accountData ||{}
  res.render("account/management", {
    title: "uhwf portal",
    layout: false,
    errors: null,
    messages: req.flash(),
    account_firstname: accountData.account_firstname,
    account_email: accountData.account_email,
    account_type: accountData.account_type
  })
}
/* ***************************
 *  Process Logout
 * ************************** */
async function  logoutaccount  (req, res, next) {
  console.log("Logging out user:", res.locals.accountData?.account_email)
  res.clearCookie("jwt")
  res.locals.loggedin = 0
  res.locals.accountData = null
  req.flash("notice", "You have been logged out Successfully.")
  res.redirect("/account/login")
}

/* ****************************************
 *  Storage configuration for multer (profile images)
 * *************************************** */
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "./public/uploads/members/")
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9)
//     cb(null, "member-" + uniqueSuffix + path.extname(file.originalname))
//   }
// })

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//   fileFilter: (req, file, cb) => {
//     const filetypes = /jpeg|jpg|png|gif/
//     const mimetype = filetypes.test(file.mimetype)
//     const extname = filetypes.test(path.extname(file.originalname).toLowerCase())
//     if (mimetype && extname) {
//       return cb(null, true)
//     }
//     cb(new Error("Error: Images only (JPEG, PNG, GIF)!"))
//   }
// })

/* ****************************************
 *  Deliver Add Member View (via modal or page)
 *  Usually triggered from dashboard sidebar
 * *************************************** */
async function buildAddMember(req, res, next) {
  // let nav = await utilities.getNav()
  res.render("account/add-member", {
    title: "Add New Member",
    // nav,
    errors: null,
  })
}

/* ****************************************
 *  Deliver Members List View
 * *************************************** */
async function buildMembersView(req, res, next) {
  let nav = await utilities.getNav()
  const members = await memberModel.getAllMembers()

  res.render("members/view", {
    title: "Members List",
    nav,
    errors: null,
    messages: req.flash(),
    members,
  })
}

/* ****************************************
 *  Process Add Member Registration
 * *************************************** */
async function registerMember(req, res) {
  let nav = await utilities.getNav()
  const { first_name, last_name, email, phone, address } = req.body

  // Handle profile image
  let profile_image = "default-avatar.jpg"
  if (req.file) {
    profile_image = req.file.filename
  }

  // Check if email already exists
  const emailExists = await memberModel.checkExistingMemberEmail(email)
  if (emailExists > 0) {
    req.flash("notice", "That email address is already registered as a member.")
    return res.status(400).render("members/add", {
      title: "Add New Member",
      nav,
      errors: null,
      first_name,
      last_name,
      email,
      phone,
      address,
    })
  }

  const regResult = await memberModel.registerMember(
    first_name,
    last_name,
    email,
    phone,
    address,
    profile_image
  )

  if (regResult) {
    req.flash(
      "notice",
      `Congratulations! ${first_name} ${last_name} has been successfully added as a member.`
    )
    return res.redirect("/members")
  } else {
    req.flash("notice", "Sorry, adding the member failed.")
    return res.status(501).render("members/add", {
      title: "Add New Member",
      nav,
      errors: null,
      first_name,
      last_name,
      email,
      phone,
      address,
    })
  }
}

/* ****************************************
 *  Deliver Edit Member View
 * *************************************** */
async function buildEditMember(req, res, next) {
  let nav = await utilities.getNav()
  const member_id = parseInt(req.params.id)
  const memberData = await memberModel.getMemberById(member_id)

  if (!memberData) {
    req.flash("notice", "Member not found.")
    return res.redirect("/members")
  }

  res.render("members/edit", {
    title: "Edit Member",
    nav,
    errors: null,
    member_id: memberData.id,
    first_name: memberData.first_name,
    last_name: memberData.last_name,
    email: memberData.email,
    phone: memberData.phone,
    address: memberData.address,
    current_image: memberData.profile_image,
  })
}

/* ****************************************
 *  Process Member Update
 * *************************************** */
async function updateMember(req, res) {
  let nav = await utilities.getNav()
  const { member_id, first_name, last_name, email, phone, address, current_image } = req.body

  let profile_image = current_image // Keep old image if no new upload

  if (req.file) {
    profile_image = req.file.filename
  }

  const updateResult = await memberModel.updateMember(
    member_id,
    first_name,
    last_name,
    email,
    phone,
    address,
    profile_image
  )

  if (updateResult) {
    req.flash("notice", `Member information updated successfully.`)
    return res.redirect("/members")
  } else {
    req.flash("notice", "Sorry, the update failed.")
    return res.redirect(`/members/edit/${member_id}`)
  }
}

/* ****************************************
 *  Process Member Deletion
 * *************************************** */
async function deleteMember(req, res) {
  let nav = await utilities.getNav()
  const member_id = parseInt(req.params.id)

  const deleteResult = await memberModel.deleteMember(member_id)

  if (deleteResult) {
    req.flash("notice", "Member was successfully deleted.")
    return res.redirect("/members")
  } else {
    req.flash("notice", "Sorry, deleting the member failed.")
    return res.redirect("/members")
  }
}
module.exports={registerAccount,buildLogin,buildRegister,loginAccount,accountLogin,accountManagement,accountLogout,logoutaccount,buildAddMember,registerMember}