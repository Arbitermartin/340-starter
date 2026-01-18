// module.exports = accountController
// controllers/accountController.js
const utilities = require("../utilities")
const jwt = require("jsonwebtoken")
const accountModel =require("../models/account-model")
const bcrypt = require("bcryptjs")
const multer = require("multer")
require("dotenv").config();
const pool = require("../database") 
const path = require("path");

// Save uploaded images to public/images/members folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images/site/");  // Create this folder if not exists
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    if (extOk && mimeOk) return cb(null, true);
    cb(new Error("Only image files allowed!"));
  }
});
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
/* ****************************************
*  Process Registration
* *************************************** */
async function registerAccount(req, res) {
  let nav = await utilities.getNav();
  const { 
    account_firstname, 
    account_lastname, 
    account_email, 
    account_password,
    account_type   // ← NEW: from form
  } = req.body;

  // Validate allowed types (security!)
  const allowedTypes = ['student', 'citizen', 'member'];
  if (!allowedTypes.includes(account_type)) {
    req.flash("notice", "Invalid account type selected.");
    return res.render("account/register", { title: "Register", nav, errors: null });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(account_password, 10);

  try {
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword,
      account_type   // ← Pass the selected type
    );

    if (regResult) {
      req.flash("notice", `Congratulations, you're registered as ${account_type}! Please log in.`);
      return res.redirect("/account/login");
    } else {
      req.flash("notice", "Registration failed.");
      return res.render("account/register", { title: "Register", nav, errors: null });
    }
  } catch (error) {
    req.flash("notice", error.message || "Registration failed.");
    return res.render("account/register", { title: "Register", nav, errors: null });
  }
}
async function userDashboard(req, res) {
  const accountData = res.locals.accountData || {};
  res.render("inventory/dashboard", {
    title: "UHWF Portal",
    layout: false,
    messages: req.flash(),
    account_firstname: accountData.account_firstname,
    account_email: accountData.account_email,
    account_type: accountData.account_type,
  });
}
/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav();
  const { account_email, account_password } = req.body;

  const accountData = await accountModel.getAccountByEmail(account_email);
  if (!accountData) {
    req.flash("message", "Please check your credentials and try again.");
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    });
  }

  try {
    if (await bcrypt.compare(account_password, accountData.account_password)) {
      delete accountData.account_password;

      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 });

      res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 3600 * 1000,
      });

      // Normalize account_type (trim spaces + lowercase) to avoid case issues
      const accountType = (accountData.account_type || '').trim().toLowerCase();

      if (accountType === 'admin') {
        req.flash("notice", "Welcome Admin!");
        return res.redirect("/account/management/");  // Admin dashboard (your management view)
      } else if (['citizen', 'student', 'member'].includes(accountType)) {
        req.flash("notice", "Welcome back!");
        return res.redirect("/account/dashboard/");  // User dashboard for citizen/student/member
      } else {
        // Debug: show what the actual value is
        req.flash("notice", `Unknown account type: "${accountData.account_type}" (contact support)`);
        return res.redirect("/account/login");
      }
    } else {
      req.flash("note", " Warning!! Please check your credentials and try again.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      });
    }
  } catch (error) {
    console.error("Login error:", error);
    req.flash("notice", "Access error. Please try again.");
    return res.redirect("/account/login");
  }
}
/* ****************************************
*  Deliver account management view
* *************************************** */
async function accountManagement(req, res) {
  const accountData = res.locals.accountData || {};
  const members = await accountModel.getAllMembers();  // ← Fetch all members
  const studentCountResult = await pool.query(
    "SELECT COUNT(*) AS count FROM public.account WHERE account_type = 'student'"
  );
  const studentCount = studentCountResult.rows[0].count;
  
  const memberCountResult = await pool.query(
    "SELECT COUNT(*) AS count FROM public.member WHERE account_type = 'member'"
  );
  const memberCount = memberCountResult.rows[0].count;
  // In your accountManagement controller function
const activeTotalResult = await pool.query(`
  SELECT (
    -- Students from account table
    (SELECT COUNT(*) 
     FROM public.account 
     WHERE LOWER(TRIM(account_type)) = 'student'
       -- AND is_active = true   <-- Uncomment if you have is_active column in account table
    ) +
    -- Members from member table
    (SELECT COUNT(*) 
     FROM public.member
       -- AND is_active = true   <-- Uncomment if you have is_active column in member table
    )
  ) AS total_active
`);

const activeCount = parseInt(activeTotalResult.rows[0].total_active, 10);
  res.render("inventory/management", {
    title: "UHWF Portal",
    layout: false,
    messages: req.flash(),
    account_firstname: accountData.account_firstname,
    account_email: accountData.account_email,
    account_type: accountData.account_type,
    showAccount: true,   // default dashboard view
    showMembers: false,
    members,  // ← Pass members to the view
    studentCount,
    memberCount,
    activeCount
  });
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
 *  Deliver Add Member form view
 * *************************************** */
async function buildAddMember(req, res, next) {
  res.render("inventory/add-member", {
    title: "Add New Member",
    layout:false,
    errors: null,
    messages: req.flash()
  })
}

async function addMember(req, res) {
  // Security check
  if (!res.locals.loggedin || res.locals.accountData?.account_type !== 'citizen') {
    req.flash("notice", "Access denied.")
    return res.redirect("/account/login")
  }

  // SAFETY: Check if req.body exists
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error("req.body is empty or undefined - likely missing enctype='multipart/form-data'")
    req.flash("notice", "Form submission failed. Please try again.")
    return res.redirect("/account")
  }

  const { first_name, last_name, email, phone, address, membership_number } = req.body
  let profile_image = null

  if (req.file) {
    // Save the image file and store only the URL path in DB
    profile_image = `/images/site/${req.file.filename}`;  // e.g., /images/members/123456789.jpg
    console.log("Image uploaded and saved:", profile_image);
  } else {
    profile_image = null;
  }

  try {
    const newMember = await accountModel.addMember(
      first_name?.trim(),
      last_name?.trim(),
      email?.trim(),
      phone?.trim() || null,
      address?.trim() || null,
      profile_image,
      membership_number?.trim() || null
    )

    req.flash("notice", `Member "${first_name} ${last_name}" added successfully!`)
    return res.redirect("/account/")
  } catch (error) {
    console.error("Add member error:", error)
    req.flash("notice", `Error: ${error.message || "Could not add member"}`)
    return res.redirect("/account/add-member")
  }
}

/* -------------------------------------------------
   Process Add Member - Save to database with image as URL
   ------------------------------------------------- */
   async function processAddMember(req, res) {
    // Log for debugging
    console.log("Add Member - Body:", req.body);
    console.log("Add Member - File:", req.file ? req.file.originalname : "No file");
  
    const { first_name, last_name, email, phone, address } = req.body;
  
    // Image path (URL) - null if no file uploaded
    const profile_image_path = req.file 
      ? `/images/site/${req.file.filename}` 
      : null;
  
    try {
      const newMember = await accountModel.addMember(
        first_name?.trim() || "",
        last_name?.trim() || "",
        email?.trim() || "",
        phone?.trim() || null,
        address?.trim() || null,
        profile_image_path  // ← Now a string URL (or null), safe for VARCHAR
      );
  
      req.flash("notice", `Member "${first_name} ${last_name}" added successfully!`);
      return res.redirect("/account/");
    } catch (error) {
      console.error("Add member failed:", error);
      req.flash("notice", `Error: ${error.message || "Could not add member"}`);
      return res.redirect("/account/"); // or back to form if you have one
    }
  }

/* ****************************************
 *  Deliver Edit Member view (with data)
 * *************************************** */
async function buildEditMember(req, res) {
  const member_id = parseInt(req.params.id);
  const nav = await utilities.getNav();

  try {
    const member = await accountModel.getMemberById(member_id);
    if (!member) {
      req.flash("notice", "Member not found");
      return res.redirect("/account/");
    }

    res.render("inventory/edit-member", {
      title: "Edit Member",
      nav,
      member,  // ← data passed to view
      messages: req.flash()
    });
  } catch (error) {
    req.flash("notice", "Error loading member");
    res.redirect("/account/");
  }
}
/* ****************************************
 *  Process Edit Member update
 * *************************************** */
async function processUpdateMember(req, res) {
  const member_id = parseInt(req.params.id);

  console.log("UPDATE MEMBER - Body:", req.body);
  console.log("UPDATE MEMBER - File:", req.file ? "Yes" : "No");

  const { first_name, last_name, email, phone, address } = req.body;
  const profile_image = req.file ? req.file.buffer : null; // null = keep old

  try {
    const updatedMember = await accountModel.updateMember(
      member_id,
      first_name?.trim() || "",
      last_name?.trim() || "",
      email?.trim() || "",
      phone?.trim() || null,
      address?.trim() || null,
      profile_image
    );

    if (updatedMember) {
      req.flash("notice", `Member "${first_name} ${last_name}" updated successfully!`);
      return res.redirect("/account/?updated=true");
    } else {
      req.flash("notice", "Member not found or no changes made.");
    }

    return res.redirect("/account/");
  } catch (error) {
    console.error("Update member failed:", error);
    req.flash("notice", `Error: ${error.message}`);
    return res.redirect(`/account/edit-member/${member_id}`);
  }
}

// contact
async function submitContact(req, res) {
  const { firstname, lastname, email, message } = req.body;

  // Basic validation
  if (!firstname || !lastname || !email || !message) {
    req.flash("error", "All fields are required.");
    return res.redirect("/contact");
  }

  try {
    await accountModel.saveContactMessage(firstname, lastname, email, message);

    req.flash("success", "Your message has been sent successfully! We will get back to you within 24 hours.");
    res.redirect("/contact");
  } catch (error) {
    req.flash("error", "Sorry, there was an error sending your message. Please try again.");
    res.redirect("/contact");
  }
}
// member page to be getted in admin dashboard.
async function viewMembers(req, res) {
  try {
    const members = await accountModel.getAllMembers(); // Use your existing model method
    res.render("inventory/management", {
      title: "View All Members",
      layout: false, // or your dashboard layout
       members,
       showMembers: true,
       showAccount: false,
      messages: req.flash()
    });
  } catch (error) {
    console.error("View members error:", error);
    req.flash("error", "Failed to load members");
    res.redirect("/account/");
  }
}

/**
 * Get single member details (JSON for AJAX modal)
 */
async function getMemberDetail(req, res) {
  try {
    const memberId = parseInt(req.params.id);
    const member = await accountModel.getMemberById(memberId); // Assume this exists in model

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.json(member);
  } catch (error) {
    console.error("Get member detail error:", error);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Delete member
 */
async function deleteMember(req, res) {
  try {
    const memberId = parseInt(req.params.id);
    const deleted = await accountModel.deleteMember(memberId); // Assume model has this

    if (!deleted) {
      return res.status(404).json({ error: "Member not found" });
    }

    req.flash("notice", "Member deleted successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Delete member error:", error);
    res.status(500).json({ error: "Failed to delete member" });
  }
}
// for get student in management view.
async function getAllStudents(req, res) {
  try {
    const students = await accountModel.getAllStudents(); // fetch from model

    res.render("inventory/management", {
      title: "Manage Students",
      layout: false,
      showAccount: false,
      showMembers: false,
      showStudents: true,
      students,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    req.flash("notice", "Failed to load students");
    res.redirect("/account/");
  }
}
// Export the middleware chain correctly
module.exports.addMemberMiddleware = [
  upload.single("profile_image"),
  utilities.handleErrors(processAddMember)  // ← wrap your actual handler
];

module.exports.updateMemberMiddleware = [
  upload.single("profile_image"),
  utilities.handleErrors(processUpdateMember)
];

// Export everything else
module.exports.buildLogin = buildLogin;
module.exports.buildRegister = buildRegister;
module.exports.registerAccount = registerAccount;
module.exports.accountLogin = accountLogin;
module.exports.logoutaccount = logoutaccount;
module.exports.accountManagement = accountManagement;
module.exports.buildAddMember = buildAddMember;
module.exports.addMember =addMember;
module.exports.buildEditMember =buildEditMember;
module.exports.userDashboard=userDashboard;
module.exports.submitContact=submitContact;
module.exports.viewMembers=viewMembers;
module.exports.getAllMembers=getMemberDetail;
module.exports.deleteMember=deleteMember;
module.exports.getAllStudents=getAllStudents;
