// models/uhwf-model.js
const pool = require("../database")  // This assumes your database/index.js exports the pool

/* *****************************
*   Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password){
  try {
    const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Citizen') RETURNING *"
    return await pool.query(sql, [account_firstname, account_lastname, account_email, account_password])
  } catch (error) {
    return error.message
  }
}

/* *****************************
 *   Register/Add new member
 * *************************** */
async function registerMember(
  first_name, 
  last_name, 
  email, 
  phone, 
  address, 
  profile_image = 'default-avatar.jpg'
) {
  try {
    const sql = `
      INSERT INTO members 
        (first_name, last_name, email, phone, address, profile_image) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *
    `
    return await pool.query(sql, [first_name, last_name, email, phone, address, profile_image])
  } catch (error) {
    return error.message
  }
}
// register member end here.

/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email){
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const email = await pool.query(sql, [account_email])
    return email.rowCount
  } catch (error) {
    return error.message
  }
}

/* *****************************
* Return account data using email address
* ***************************** */
async function getAccountByEmail (account_email) {
  try {
    const result = await pool.query(
      'SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_email = $1',
      [account_email])
    return result.rows[0]
  } catch (error) {
    return new Error("No matching email found")
  }
}
module.exports={registerAccount,checkExistingEmail,getAccountByEmail,registerMember}