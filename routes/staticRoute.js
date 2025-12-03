// routes/staticRoute.js
const express = require("express")
const router = express.Router()
const utilities = require("../utilities/index")

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

/* **************************************
*   Deliver Home page
* ************************************** */
async function buildHome(req, res) {
    let nav = await utilities.getNav()
    res.render("index", {
      title: "Home",
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

router.get("/about", utilities.handleErrors(buildAboutUs))
router.get("/index", utilities.handleErrors(buildHome))

module.exports = router