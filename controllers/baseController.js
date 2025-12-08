// controllers/baseController.js
const utilities = require("../utilities/")
const baseController = {}

baseController.buildHome = async function(req, res){
  const nav = await utilities.getNavWithActive(req.originalUrl)
  const stats = await utilities.getPortalStats()

  res.render("index", {
    title: "UHWF Research & Community Portal",
    nav,
    stats,
    errors: null
  })
}

baseController.buildAbout = async function(req, res){
  const nav = await utilities.getNavWithActive(req.originalUrl)
  res.render("about", { 
    title: "About Us | UHWF", 
    nav, 
    errors: null 
  })
}

baseController.buildContact = async function(req, res){
  const nav = await utilities.getNavWithActive(req.originalUrl)
  res.render("contact", { 
    title: "Contact Us | UHWF", 
    nav, 
    errors: null 
  })
}

module.exports = baseController