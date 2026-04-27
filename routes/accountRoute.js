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

// View all members (management page)
router.get(
  "/inventory/members",
  utilities.handleErrors(accountController.viewMembers)
);

// Get single member (JSON for modal)
router.get(
  "/inventory/members/:id",
  utilities.handleErrors(accountController.getAllMembers)
);

// Delete member
router.delete(
  "/inventory/members/:id",
  utilities.handleErrors(accountController.deleteMember)
);

// for student route.
// ===============================
// Admin – Manage Students
// ===============================
router.get("/inventory/students", accountController.getAllStudents);
// router.get("/inventory/students", accountController.viewStudents);

/*************************
 *  employee routes.
 */
router.get("/inventory/employees",accountController.viewEmployees);

router.get("/inventory/add-employees", accountController.buildaddEmployee);

router.post(
  "/inventory/add-employees",
  accountController.addEmployeeMiddleware,
);

router.get(
  "/inventory/edit-employee/:employee_id",          // ← or your role check
  utilities.handleErrors(accountController.buildEditEmployee)
);

// POST: Process employee update
router.post(
  "/inventory/update-employee/:employee_id",
  accountController.updateEmployeeMiddleware   // ← [upload.single('profile_image'), processUpdateEmployee]
);

// ── Other Routes ──────────────────────────────────────────────────────────

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

// GET: User dashboard (citizen/student/member)
router.get("/dashboard",utilities.handleErrors(accountController.userDashboard))

// get employee dashboard
router.get("/dashboard_01"
  ,utilities.handleErrors(accountController.employeeDashboard))

  // GET - show delete confirmation page
router.get(
  "/inventory/employees/:employee_id/delete-confirm",
  utilities.handleErrors(async (req, res) => {
    const employeeId = parseInt(req.params.employee_id);

    try {
      // Fetch employee data (you can use your existing getEmployeeById)
      const employee = await accountModel.getEmployeeById(employeeId);

      if (!employee) {
        req.flash("notice", "Employee not found");
        return res.redirect("/account/inventory/employees");
      }

      res.render("inventory/delete-employee", {
        title: "Confirm Delete Employee",
        employee,
        messages: req.flash(),
      });
    } catch (err) {
      console.error("Error loading delete confirm:", err);
      req.flash("notice", "Error loading employee data");
      res.redirect("/account/inventory/employees");
    }
  })
);

// POST - actual delete (already from previous step)
router.post(
  "/inventory/delete-employee/:employee_id/delete",(accountController.deleteEmployee)
);

// POST: Submit contact form
// In accountRoute.js or new contactRoute.js
router.post("/contact/submit", utilities.handleErrors(accountController.submitContact));


/**********************
 * for news and events
 */

// Admin news
router.get("/inventory/add-new",utilities.handleErrors(accountController.buildAddNews));

router.post("/inventory/add-new",(accountController.addNewMiddleware));

// Admin events
router.get("/inventory/add-event",utilities.handleErrors(accountController.buildAddEvent));
router.post("/inventory/add-event",(accountController.addEventMiddleware));

// View All Event Registrations
// ====================== EVENT REGISTRATIONS (Admin) ======================
router.get(
  "/inventory/event-registrations",
 (accountController.viewEventRegistrations)
);

// ====================== DOWNLOAD EVENT REGISTRATIONS AS EXCEL ======================
router.get(
  "/inventory/event-registrations/download-excel",
  utilities.handleErrors(accountController.downloadEventRegistrationsExcel)
);
// Forgot Password Routes
router.get("/forgot-password", utilities.handleErrors(accountController.buildForgotPassword));
router.post("/forgot-password", utilities.handleErrors(accountController.sendResetLink));

// Reset Password Routes
router.get("/reset-password", utilities.handleErrors(accountController.buildResetPassword));
router.post("/reset-password", utilities.handleErrors(accountController.processResetPassword));

router.get("/inventory/add-job",utilities.handleErrors(accountController.buildAddJob));
router.post("/inventory/add-job",utilities.handleErrors(accountController.processAddJob));

// Admin only
router.get("/inventory/add-video",utilities.handleErrors (accountController.buildAddVideo))

router.post("/inventory/add-video",utilities.handleErrors (accountController.processAddVideo));

router.get("/inventory/videos", utilities.handleErrors (accountController.viewVideos));

router.post("/inventory/videos/:video_id/delete", utilities.handleErrors(accountController.deleteVideo));


// ─── ADMIN ──────────────────────────────────────────────
router.get( "/inventory/assign-task",utilities.handleErrors(accountController.buildAssignTask));
router.post("/inventory/assign-task",utilities.handleErrors (accountController.processAssignTask));
router.get( "/inventory/all-tasks",utilities.handleErrors (accountController.viewAllTasks));
router.post("/inventory/tasks/:task_id/delete",utilities.handleErrors(accountController.deleteTask));
// router.get( "/inventory/reports",                    utilities.checkLogin, taskController.viewAllReports);
// router.get( "/inventory/reports/:report_id",         utilities.checkLogin, taskController.viewReportDetail);
// router.post("/inventory/reports/:report_id/comment", utilities.checkLogin, taskController.processAddComment);
// router.get( "/inventory/reports/:report_id/pdf",     utilities.checkLogin, taskController.downloadReportPDF);

// // ─── EMPLOYEE ────────────────────────────────────────────
// router.get( "/tasks/my-tasks",                   utilities.checkLogin, taskController.employeeTaskList);
// router.get( "/tasks/submit-report/:task_id",     utilities.checkLogin, taskController.buildSubmitReport);
// router.post("/tasks/submit-report/:task_id",     utilities.checkLogin, taskController.processSubmitReport);
// router.get( "/tasks/my-report/:report_id",       utilities.checkLogin, taskController.viewMyReport);
// router.get( "/tasks/notifications",              utilities.checkLogin, taskController.viewNotifications);
// router.get( "/tasks/edit-profile",               utilities.checkLogin, taskController.buildEditProfile);
// router.post("/tasks/edit-profile",               utilities.checkLogin, taskController.editProfileMiddleware);



module.exports = router