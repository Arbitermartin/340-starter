// routes/staticRoute.js
const express = require("express")
const router = express.Router()
const utilities = require("../utilities/index")
const accountController = require("../controllers/accountController")
const accountModel = require("../models/account-model");
/* **************************************
*   Deliver About Us page
* ************************************** */
async function buildAboutUs(req, res) {
  let nav = await utilities.getNav()
  res.render("about", {
    title: "About Us",
    nav,
  })
}
  // Render the team page from views/pages/team.ejs
router.get("/team", utilities.handleErrors(async (req, res) => {
  let nav = await utilities.getNav()
  res.render("pages/team", { 
    title: "Our Team", 
    nav 
  })
}))
 router.get("/contact", utilities.handleErrors(async (req, res) => {
  let nav = await utilities.getNav()
  res.render("pages/contact", { 
    title: "Contact Us", 
    nav 
  })
}))
router.get("/land", utilities.handleErrors(async (req, res) => {
  let nav = await utilities.getNav()
  res.render("pages/land", { 
    title: "Land Planning", 
    nav 
  })
}))

router.get("/wildlife", utilities.handleErrors(async (req, res) => {
  let nav = await utilities.getNav()
  res.render("pages/wildlife", { 
    title: "Wildlife Conservation", 
    nav 
  })
}))

router.get("/community", utilities.handleErrors(async (req, res) => {
  let nav = await utilities.getNav()
  res.render("pages/community", { 
    title: "Community Engagement", 
    nav 
  })
}))
router.get("/help", utilities.handleErrors(async (req, res) => {
  let nav = await utilities.getNav()
  res.render("pages/help", { 
    title: "Help Center", 
    nav 
  })
}))
router.get("/career", async (req, res) => {
  try {
    const jobs = await accountModel.getAllJobs()
    let nav = await utilities.getNav()
    res.render("pages/career", {
      title: "Career Opportunities",
      nav,
      jobs,
      messages: req.flash()
    })
  } catch (err) {
    console.error(err)
    res.render("pages/career", { title: "Career Opportunities", nav: await utilities.getNav(), jobs: [], messages: req.flash() })
  }
})
// router.get("/career", utilities.handleErrors(async (req, res) => {
//   let nav = await utilities.getNav()
//   res.render("pages/Career", { 
//     title: "Career Center", 
//     nav 
//   })
// }))

// ====================== EVENT READ MORE PAGE ======================
router.get("/events/:id", 
  utilities.handleErrors(accountController.buildEventDetail)
);

router.get("/about", utilities.handleErrors(buildAboutUs))
router.get("/", utilities.handleErrors(accountController.buildHome))

router.get(
  "/video-gallery",
  utilities.handleErrors(accountController.buildVideoGallery)
);
// ====================== EVENT REGISTRATION FORM PAGE ======================
router.get("/events/register/:event_id", utilities.handleErrors(async (req, res) => {
  try {
    const eventId = parseInt(req.params.event_id);

    if (!eventId || isNaN(eventId)) {
      req.flash("notice", "Invalid event link.");
      return res.redirect("/");
    }

    const event = await accountModel.getEventById(eventId);

    if (!event) {
      req.flash("notice", "Event not found.");
      return res.redirect("/");
    }

    res.render("pages/event-register", { 
      title: `Register - ${event.title}`,
      event: event 
    });

  } catch (err) {
    console.error("Event registration form error:", err.message);
    req.flash("notice", "Something went wrong.");
    res.redirect("/");
  }
}));
// ====================== PROCESS EVENT REGISTRATION (POST) ======================
router.post("/events/register", 
  utilities.handleErrors(accountController.processEventRegistration)
);

// ====================== DOWNLOAD EVENT REGISTRATIONS AS PDF (Using only pdfkit) ======================
router.get("/inventory/event-registrations/download-pdf", utilities.handleErrors(async (req, res) => {
  try {
    const registrations = await accountModel.getAllEventRegistrations();

    if (registrations.length === 0) {
      req.flash("notice", "No registrations found.");
      return res.redirect("/account/inventory/event-registrations");
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="UHWF_Event_Registrations.pdf"');

    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('UHWF TANZANIA', { align: 'center' });
    doc.fontSize(16).text('Event Registrations Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });
    doc.moveDown(2);

    // Table Headers
    const startY = doc.y;
    doc.fontSize(11).font('Helvetica-Bold');

    doc.text('#', 50, startY);
    doc.text('Full Name', 80, startY);
    doc.text('Phone', 220, startY);
    doc.text('Email', 320, startY);
    doc.text('University', 480, startY);
    doc.text('Experience', 680, startY);

    doc.moveTo(50, startY + 15).lineTo(750, startY + 15).stroke();

    // Table Rows
    doc.font('Helvetica').fontSize(10);
    let y = startY + 35;

    registrations.forEach((reg, index) => {
      if (y > 750) {
        doc.addPage();
        y = 50;
      }

      doc.text((index + 1).toString(), 50, y);
      doc.text(reg.full_name || '', 80, y, { width: 130 });
      doc.text(reg.phone_number || '', 220, y);
      doc.text(reg.email || '', 320, y, { width: 150 });
      doc.text(reg.university_name || '-', 480, y, { width: 190 });
      doc.text(`${reg.working_experience || 0} years`, 680, y);

      y += 22;
    });

    doc.end();

  } catch (err) {
    console.error("PDF Download Error:", err.message);
    req.flash("notice", "Failed to generate PDF. Please try again.");
    res.redirect("/account/inventory/event-registrations");
  }
}));


module.exports = router