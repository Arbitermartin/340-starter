// utilities/index.js
// const pool = require("../database/")

/* ************************
 *  Get navigation data
 * *********************** */
async function getNav() {
  try {
    const data = await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
    let navLinks = '<ul class="navigation">\n'
    navLinks += '<li><a href="/" title="Home">Home</a></li>\n'
    data.rows.forEach(row => {
      navLinks += `  <li><a href="/inv/type/${row.classification_id}" title="See our inventory of ${row.classification_name} vehicles">${row.classification_name}</a></li>\n`
    })
    navLinks += '</ul>'
    return navLinks
  } catch (error) {
    console.error("getNav error: " + error)
    return '<ul class="navigation"><li><a href="/">Home</a></li></ul>'
  }
}

/* ****************************************
 * Middleware For Handling Errors
 * Wraps other function in a try-catch block
 * *************************************** */
function handleErrors(fn) {
  return async function (req, res, next) {
    try {
      return await fn(req, res, next)
    } catch (error) {
      console.error("Server Error:", error)
      res.status(500).render("errors/error", {
        title: "Server Error",
        message: "Something went wrong on the server.",
        error
      })
    }
  }
}

module.exports = { getNav, handleErrors }