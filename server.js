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
require("dotenv").config()
const app = express()
const baseController = require("./controllers/baseController")
const bodyParser = require("body-parser")
const accountRoute = require("./routes/accountRoute")
const utilities = require("./utilities/")
const static = require("./routes/static")
const session = require("express-session")
const pool = require('./database/')
const staticRoute = require("./routes/staticRoute")

/* ***********************
 * Routes
 *************************/
app.use(express.static('public'))
app.use(expressLayouts)

// account route
// app.use("/account",accountRoute);
app.set('view engine', 'ejs')
// app.set("views", path.join(__dirname, "views"));
app.set('views', './views')           // usually default, but safe
app.set('layout', 'layouts/layout')   

app.use(require("./routes/static"))

/* ***********************
 * Middleware
 * ************************/
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
}))
// Express Messages Middleware
app.use(require('connect-flash')())
app.use(function(req, res, next){
  res.locals.messages = require('express-messages')(req, res)
  next()
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded




// ... later in the Routes section (add with other app.use routes)
app.use("/account", accountRoute)


// static routes
app.use("/",staticRoute)

//index route
// app.get("/", function(req, res){
//   res.render("index", {title: "Home"})
// })
app.get("/",baseController.buildHome)

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
