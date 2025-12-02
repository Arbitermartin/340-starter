/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/
/* ***********************
 * Require Statements
 *************************/
const path = require("path")
const express = require("express")
const expressLayouts = require("express-ejs-layouts")
const env = require("dotenv").config()
const app = express()
const accountRoute = require("./routes/accountRoute")
// const utilities = require("./utilities/")
const static = require("./routes/static")
const staticRoute = require("./routes/staticRoute")

/* ***********************
 * Routes
 *************************/
app.use(express.static('public'))
app.use(expressLayouts)

// account route
// app.use("/account",accountRoute);
app.set('view engine', 'ejs')
app.set('views', './views')           // usually default, but safe
app.set('layout', 'layouts/layout')   

app.use(require("./routes/static"))



// ... later in the Routes section (add with other app.use routes)
app.use("/account", accountRoute)

// static routes
app.use("/",staticRoute)

//index route
app.get("/", function(req, res){
  res.render("index", {title: "Home"})
})

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT
const host = process.env.HOST

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`app listening on ${host}:${port}`)
})
