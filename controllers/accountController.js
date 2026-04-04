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
      login_id: ""
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
  const { login_id, account_password } = req.body;
  let accountData = await accountModel.getAccountByEmail(login_id);

  // If not found → try employee code
  if (!accountData) {
    accountData = await accountModel.getAccountByEmployeeCode(login_id);
  }
  if (!accountData) {
    req.flash("note", "Warning!! Invalid Employee ID / Email or password.");
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      login_id: req.body.login_id || "",
    });
  }
  try {
    const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);
    if (passwordMatch) {
      delete accountData.account_password;

      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 });

      res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 3600 * 1000,
      });
      const accountType = (accountData.account_type || '').trim().toLowerCase();
      const rawType = accountData.account_type || '(missing)';
      if (accountType === 'admin') {
        req.flash("notice", "Welcome Admin!");
        return res.redirect("/account/");
      } 
      else if (accountType === 'employee') {
        req.flash("notice", "Welcome back");
        return res.redirect("/account/dashboard_01/");
      } 
      else if (['citizen', 'student', 'member'].includes(accountType)) {
        req.flash("notice", "Welcome back!");
        return res.redirect("/account/dashboard/");
      } 
      else {
        req.flash("notice", `Unknown account type: "${rawType}" (contact support)`);
        return res.redirect("/account/login");
      }
    } 
    else {
      req.flash("note", "Warning!! Invalid Employee ID / Email or password.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        login_id: req.body.login_id || "",
      });
    }
  } catch (error) {
    req.flash("notice", "Access error. Please try again.");
    return res.redirect("/account/login");
  }
}

async function employeeDashboard(req, res) {
  console.log("EMPLOYEE DASHBOARD CONTROLLER REACHED");
  console.log("User:", res.locals.accountData?.account_email || "unknown");
  console.log("Account type:", res.locals.accountData?.account_type);

  try {
    const accountData = res.locals.accountData || {};

    res.render("inventory/dashboard_01", {   // ← confirm this view file exists!
      title: "Employee Dashboard",
      layout: false,
      messages: req.flash(),
      account_firstname: accountData.account_firstname || "Employee",
      account_email: accountData.account_email || "",
      account_type: accountData.account_type || "employee",
      // ... your stats object if any
    });
  } catch (err) {
    console.error("EMPLOYEE DASHBOARD CRASH:", err.message);
    console.error(err.stack);
    res.status(500).send("Error loading employee dashboard – check server logs");
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
 /****************************
  * Delivery employee view in admin dashboard
  */
 async function viewEmployees(req, res) {
  try {
    const  employees = await accountModel.viewEmployees(); // fetch from model

    res.render("inventory/management", {
      title: "Manage Employees",
      layout: false,
      showAccount: false,
      showMembers: false,
      showEmployees: true,
      employees,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    req.flash("notice", "Failed to load employees");
    res.redirect("/account/");
  }
}
// end here employee views

// GET: Show add employee form
async function buildaddEmployee(req, res) {
  try {
    res.render("inventory/management", {
      title: "Add Employee",
      layout: false,
      showAccount: false,
      showEmployee: true,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error loading add employee form:", error);
    req.flash("notice", "Failed to load form: " + error.message);
    res.redirect("/account/");
  }
}

// POST: Create account + employee with full checks
async function processAddEmployee(req, res) {
  try {
    const { 
      firstname, lastname, email, password, account_type, 
      phone_number, department, position, hire_date 
    } = req.body;

    const profile_image = req.file
      ? `/images/site/${req.file.filename}`
      : null;

    // Validate required fields
    if (!firstname || !lastname || !email || !password || !phone_number) {
      req.flash("notice", "Missing required fields.");
      return res.redirect("/account/inventory/add-employees");
    }

    // Check email uniqueness
    const existing = await accountModel.checkExistingEmail(email);
    if (existing > 0) {
      req.flash("notice", "Email already in use.");
      return res.redirect("/account/inventory/add-employees");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account
    const account = await accountModel.addAccount(
      firstname, lastname, email, hashedPassword, account_type
    );

    // Create employee (no employee_code — model generates it)
    await accountModel.addEmployee(
      account.account_id,
      phone_number, department, position, hire_date, profile_image
    );

    req.flash("notice", "Employee added successfully!");
    res.redirect("/account/");
  } catch (error) {
    console.error("Add employee error:", error.message);
    req.flash("notice", "Failed to add employee: " + error.message);
    res.redirect("/account/inventory/add-employees");
  }
}


/* ****************************************
 *  Delivering Build Edit Employee Form (GET)
 * *************************************** */
async function buildEditEmployee(req, res) {
  const employeeId = parseInt(req.params.employee_id);
  const accountData = res.locals.accountData || {};

  try {
    // Fetch full employee data (joined with account)
    const employee = await accountModel.getEmployeeById(employeeId);

    if (!employee) {
      req.flash("notice", "Employee not found");
      return res.redirect("/account/");
    }

    res.render("inventory/management", {
      title: "Edit Employee",
      layout: false,
      showAccount : false,
      showEditEmployee: true,
      messages: req.flash(),
      account_firstname: accountData.account_firstname,
      account_email: accountData.account_email,
      account_type: accountData.account_type,
      employee,           // ← pass the full employee object to pre-fill form
    });
  } catch (error) {
    console.error("Error loading edit employee form:", error);
    req.flash("notice", "Failed to load employee data");
    res.redirect("/account/");
  }
}

/* ****************************************
 *  Process Update Employee (POST)
 *  Uses multer middleware for optional new image
 * *************************************** */
// async function processUpdateEmployee(req, res) {
//   // const employee = parseInt(req.params.employee_id);
//   const employee = await accountModel.getEmployeeById(id);

//   console.log("UPDATE EMPLOYEE - Body:", req.body);
//   console.log("UPDATE EMPLOYEE - File:", req.file ? req.file.originalname : "No new file");

//   const {
//     firstname,
//     lastname,
//     email,
//     employee_code,
//     phone_number,
//     department,
//     position,
//     hire_date,
//     status,           // optional: allow changing status (active/inactive)
//   } = req.body;

//   let profile_image = null;

//   if (req.file) {
//     profile_image = `/images/site/${req.file.filename}`;   // match your multer folder
//   }
//   // If no new file → keep existing (null = don't update image column)

//   try {
//     // 1. Update account table (name + email)
//     await accountModel.updateAccountBasic(
//       employee.account_id,   // we get this from getEmployeeById
//       firstname?.trim() || "",
//       lastname?.trim() || "",
//       email?.trim() || ""
//     );

//     // 2. Update employee table
//     const updated = await accountModel.updateEmployee(
//       employee,
//       employee_code?.trim() || "",
//       phone_number?.trim() || null,
//       department?.trim() || null,
//       position?.trim() || null,
//       hire_date || null,
//       profile_image,          // null = keep old
//       status || "active"
//     );

//     if (updated) {
//       req.flash("notice", `Employee ${firstname} ${lastname} updated successfully!`);
//       return res.redirect("/account/");   // or "/account/inventory/employees"
//     } else {
//       req.flash("notice", "No changes made or employee not found.");
//       return res.redirect(`/account/inventory/edit-employee/${employeeId}`);
//     }
//   } catch (error) {
//     console.error("Update employee failed:", error);
//     req.flash("notice", `Error: ${error.message || "Update failed"}`);
//     return res.redirect(`/account/inventory/edit-employee/${employee}`);
//   }
// }
async function processUpdateEmployee(req, res) {
  const employeeId = parseInt(req.params.employee_id);

  console.log("UPDATE EMPLOYEE - ID:", employeeId);
  console.log("UPDATE EMPLOYEE - Body:", req.body);
  console.log("UPDATE EMPLOYEE - File:", req.file ? req.file.originalname : "No new file");

  let employee;
  try {
    employee = await accountModel.getEmployeeById(employeeId);
    if (!employee) {
      req.flash("notice", "Employee not found");
      return res.redirect("/account/inventory/employees");
    }
  } catch (err) {
    console.error("Failed to fetch employee:", err);
    req.flash("error", "Could not load employee data");
    return res.redirect("/account/inventory/employees");
  }

  const {
    firstname,
    lastname,
    email,
    employee_code,
    phone_number,
    department,
    position,
    hire_date,
    status
  } = req.body;

  let profile_image = null;
  if (req.file) {
    profile_image = `/images/site/${req.file.filename}`;
  }

  try {
    // 1. Update account table (name + email)
    await accountModel.updateAccountBasic(
      employee.account_id,
      firstname?.trim() || "",
      lastname?.trim() || "",
      email?.trim().toLowerCase() || ""
    );

    // 2. Update employee table
    const updated = await accountModel.updateEmployee({
      employee_id: employee.employee_id,          // ← FIXED: use the real ID
      employee_code: employee_code?.trim() || employee.employee_code || "",
      phone_number: phone_number?.trim() || null,
      department: department?.trim() || null,
      position: position?.trim() || null,
      hire_date: hire_date && hire_date.trim() !== '' ? hire_date.trim() : null,
      profile_image,                              // null = keep old
      status: status || employee.status || "active"
    });

    if (updated) {
      req.flash("notice", `Employee ${firstname} ${lastname} updated successfully!`);
      return res.redirect("/account/inventory/employees");  // better redirect
    } else {
      req.flash("notice", "No changes made or update failed.");
      return res.redirect(`/account/inventory/edit-employee/${employee.employee_id}`);
    }
  } catch (error) {
    console.error("Update employee failed:", error.message);
    console.error(error.stack);  // ← helps see full error
    req.flash("notice", `Error: ${error.message || "Update failed"}`);
    return res.redirect(`/account/inventory/edit-employee/${employee.employee_id}`);
  }
}



/* *****************************
 * Deliver employee dashboard
 * *************************** */
async function employeeDashboard(req, res) {
  const accountData = res.locals.accountData || {};

  // Optional: Fetch real stats from DB (dummy for now)
  const stats = {
    patients: 15,
    pendingTasks: 5,
    attendedHours: 32,
    nextPayday: "May 31, 2024"
  };

  res.render("inventory/dashboard_01", {     // ← confirm this file exists!
    title: "Employee Dashboard",
    layout: false,
    messages: req.flash(),
    account_firstname: accountData.account_firstname || "Employee",
    account_email: accountData.account_email || "",
    account_type: accountData.account_type || "employee",
     stats
  });
}

/******************************
 * 
 * Deliver delete Employee page
 */

async function deleteEmployee(req, res) {
  try {
    const employeeId = parseInt(req.params.employee_id);

    if (!employeeId || isNaN(employeeId)) {
      req.flash("notice", "Invalid employee ID");
      return res.redirect("/account/inventory/employees");
    }

    // Security: only admin can delete
    if (res.locals.accountData?.account_type !== 'admin') {
      req.flash("notice", "Only administrators can delete employees");
      return res.redirect("/account/inventory/employees");
    }

    const success = await accountModel.deleteEmployee(employeeId);

    if (success) {
      req.flash("notice", "Employee permanently deleted from the system.");
    } else {
      req.flash("notice", "Failed to delete employee. Please try again.");
    }

    res.redirect("/account/inventory/employees");
  } catch (error) {
    console.error("Delete controller error:", error);
    req.flash("notice", "Error occurred while deleting employee");
    res.redirect("/account/inventory/employees");
  }
}
// Home page - public view
async function buildHome(req, res) {
  try {
    const latestNews = await accountModel.getLatestNews(5);
    const upcomingEvents = await accountModel.getUpcomingEvents(5);

    let nav = await utilities.getNav();

    res.render("index", {
      title: "Home",
      nav,
      latestNews,
      upcomingEvents,
      messages: req.flash(),
      loggedin: res.locals.loggedin || false,
      accountData: res.locals.accountData || null
    });
  } catch (err) {
    console.error("Home page error:", err);
    res.render("index", {
      title: "Home",
      nav: await utilities.getNav(),
      latestNews: [],
      upcomingEvents: [],
      messages: req.flash()
    });
  }
}

// Admin: Show form to add news
async function buildAddNews(req, res) {
  if (!res.locals.loggedin || res.locals.accountData?.account_type !== 'admin') {
    req.flash("notice", "Only admins can post news.");
    return res.redirect("/account");
  }

  res.render("inventory/management", {
    title: "Post News",
    layout: false,
    showAccount : false,
    showAddNew: true,
    messages: req.flash()
  });
}

// Admin: Process news post
async function processAddNews(req, res) {
  if (!res.locals.loggedin || res.locals.accountData?.account_type !== 'admin') {
    req.flash("notice", "Only administrators can add news.");
    return res.redirect("/account");
  }

  const { title, description, news_date } = req.body;
  const profile_image = req.file 
    ? `/images/site/${req.file.filename}` 
    : null;

  try {
    if (!title?.trim() || !description?.trim()) {
      req.flash("notice", "Title and description are required.");
      return res.redirect("/account/inventory/add-new");
    }

    await accountModel.createNews({
      title,
      description,
      profile_image,
      news_date,
      created_by: res.locals.accountData.account_id
    });

    req.flash("success", "News published successfully!");
    res.redirect("/account/inventory/add-new");   // stay on form or change to "/" 

  } catch (err) {
    console.error("Process Add News Error:", err.message);
    req.flash("notice", "Failed to publish news: " + err.message);
    res.redirect("/account/inventory/add-new");
  }
}
// Same for events (copy & change names)
async function buildAddEvent(req, res) {
  // same auth check as above
  res.render("inventory/management", {
    title: "Add Event",
    layout: false,
    showAccount : false,
    showAddEvent: true,
    messages: req.flash()
  });
}
async function processAddEvent(req, res) {
  if (!res.locals.loggedin || res.locals.accountData?.account_type !== 'admin') {
    req.flash("notice", "Only administrators can add events.");
    return res.redirect("/account");
  }

  const { title, description, event_date, location } = req.body;
  const profile_image = req.file 
    ? `/images/site/${req.file.filename}` 
    : null;

  try {
    if (!title?.trim() || !event_date) {
      req.flash("notice", "Title and event date are required.");
      return res.redirect("/account/inventory/add-event");
    }

    await accountModel.createEvent({
      title,
      description,
      event_date,
      location,
      profile_image,
      created_by: res.locals.accountData.account_id
    });

    req.flash("success", "Event created successfully!");
    res.redirect("/account/inventory/add-event");   // or /account/ if you prefer

  } catch (err) {
    console.error("Process Add Event Error:", err.message);
    req.flash("notice", "Failed to create event: " + err.message);
    res.redirect("/account/inventory/add-event");
  }
}

/* ****************************************
 *   Build Event Read More / Detail Page
 * *************************************** */
async function buildEventDetail(req, res) {
  try {
    const eventId = parseInt(req.params.id);

    if (!eventId || isNaN(eventId)) {
      req.flash("notice", "Invalid event link.");
      return res.redirect("/");
    }

    const event = await accountModel.getEventById(eventId);

    if (!event || event.is_active === false) {
      req.flash("notice", "Event not found or no longer available.");
      return res.redirect("/");
    }

    let nav = await utilities.getNav();

    res.render("pages/details", {
      title: event.title || "Event Details",
      event: event,
      nav,
      messages: req.flash(),
      loggedin: res.locals.loggedin || false
    });

  } catch (err) {
    console.error("Event Detail Controller Error:", err.message);
    req.flash("notice", "Something went wrong.");
    res.redirect("/");
  }
}

/* ****************************************
 *   Process Event Registration (POST)
 * *************************************** */
async function processEventRegistration(req, res) {
  try {
    const {
      event_id,
      full_name,
      phone_number,
      email,
      course_of_study,
      university_name,
      date_of_birth,
      working_experience,
      company_name
    } = req.body;

    // Basic validation
    if (!event_id || !full_name || !phone_number || !email) {
      req.flash("notice", "Please fill all required fields.");
      return res.redirect(`/events/register/${event_id}`);
    }

    // Save to database
    await accountModel.addEventRegistration({
      event_id: parseInt(event_id),
      full_name: full_name.trim(),
      phone_number: phone_number.trim(),
      email: email.trim().toLowerCase(),
      course_of_study: course_of_study ? course_of_study.trim() : null,
      university_name: university_name ? university_name.trim() : null,
      date_of_birth: date_of_birth || null,
      working_experience: parseInt(working_experience) || 0,
      company_name: company_name ? company_name.trim() : null
    });

    req.flash("success", "Registration successful! Thank you for registering.");
    res.redirect("/");   // or redirect to a thank you page

  } catch (error) {
    console.error("Process Event Registration Error:", error.message);
    req.flash("notice", "Failed to register. Please try again.");
    res.redirect(`/events/register/${req.body.event_id || ''}`);
  }
}

/* ****************************************
 *   View All Event Registrations (Admin)
 * *************************************** */
async function viewEventRegistrations(req, res) {
  try {
    const registrations = await accountModel.getAllEventRegistrations();

    res.render("inventory/management", {
      title: "Event Registrations",
      layout: false,
      registrations: registrations,
      messages: req.flash(),
      account_firstname: res.locals.accountData?.account_firstname,
      account_type: res.locals.accountData?.account_type,
      // Hide default dashboard sections
      showAccount: false,
      showRegistrations: true
    });
  } catch (error) {
    console.error("View Event Registrations Error:", error.message);
    req.flash("notice", "Failed to load event registrations");
    res.redirect("/account/");
  }
}

// Export the middleware chain correctly
module.exports.addMemberMiddleware = [
  upload.single("profile_image"),
  utilities.handleErrors(processAddMember)  // ← wrap your actual handler
];
// Export the middleware chain correctly
module.exports.addEmployeeMiddleware = [
  upload.single("profile_image"),
  utilities.handleErrors(processAddEmployee)  // ← wrap your actual handler
];
module.exports.addEventMiddleware = [
  upload.single("profile_image"),
  utilities.handleErrors(processAddEvent)  // ← wrap your actual handler
];
module.exports.addNewMiddleware = [
  upload.single("profile_image"),
  utilities.handleErrors(processAddNews)  // ← wrap your actual handler
];

// Export middleware chain for update (with multer) for employee edit
module.exports.updateEmployeeMiddleware = [
  upload.single("profile_image"),
  utilities.handleErrors(processUpdateEmployee)
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
module.exports.viewEmployees=viewEmployees;
module.exports.buildaddEmployee =buildaddEmployee;
module.exports.employeeDashboard=employeeDashboard;
module.exports.buildEditEmployee=buildEditEmployee;
module.exports.deleteEmployee=deleteEmployee;
module.exports.buildHome=buildHome;
module.exports.buildAddEvent=buildAddEvent;
module.exports.processAddEvent=processAddEvent;
module.exports.buildAddNews=buildAddNews;
module.exports.processAddNews=processAddNews;
module.exports.buildEventDetail=buildEventDetail;
module.exports.processEventRegistration=processEventRegistration;
module.exports.viewEventRegistrations=viewEventRegistrations;



