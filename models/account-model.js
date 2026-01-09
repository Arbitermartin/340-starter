// models/uhwf-model.js
const pool = require("../database")  // This assumes your database/index.js exports the pool
/* *****************************
 *   Register new account
 * *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
  try {
    const sql = `
      INSERT INTO public.account 
        (account_firstname, account_lastname, account_email, account_password, account_type) 
      VALUES ($1, $2, $3, $4, 'citizen') 
      RETURNING account_id, account_firstname, account_lastname, account_email, account_type
    `;

    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_password
    ]);

    return result.rows[0]; // Return the newly created account
  } catch (error) {
    console.error("registerAccount ERROR:", error); // This will show in terminal
    throw new Error(error.message || "Failed to register account");
    // ↑ IMPORTANT: Throw, don't return string
  }
}

/* *****************************
 *   Add new member to member table
 * *************************** */
async function addMember(
  first_name,
  last_name,
  email,
  phone = null,
  address = null,
  profile_image = null
) {
  try {
    // Auto-generate membership number: UHWF-0001, UHWF-0002, etc.
    const countResult = await pool.query("SELECT COUNT(*) FROM public.member");
    const nextNumber = parseInt(countResult.rows[0].count) + 1;
    const membership_number = `UHWF-${nextNumber.toString().padStart(4, '0')}`;

  // In addMember
const sql = `
INSERT INTO public.member (
  member_firstname, member_lastname, member_email,
  member_phone, member_address, member_profile_image,
  membership_number
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *
`;

// $6 is now the URL string (or null)

    const result = await pool.query(sql, [
      first_name, last_name, email, phone, address, profile_image, membership_number
    ]);

    console.log("Member added with ID:", membership_number);
    return result.rows[0];
  } catch (error) {
    console.error("addMember error:", error);
    throw error;
  }
}
/* *****************************
 *   Get all members
 * *************************** */
async function getAllMembers() {
  try {
    const sql = "SELECT * FROM public.member ORDER BY member_firstname";
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("getAllMembers error:", error);
    throw error;
  }
}
/* *****************************
 *   Get member by ID (for edit)
 * *************************** */
async function getMemberById(member_id) {
  try {
    const sql = "SELECT * FROM public.member WHERE member_id = $1";
    const result = await pool.query(sql, [member_id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("getMemberById error:", error);
    throw error;
  }
}

/* *****************************
 *   Update member
 * *************************** */
async function updateMember(
  member_id,
  member_firstname,
  member_lastname,
  member_email,
  member_phone,
  member_address,
  member_profile_image = null
) {
  try {
    let sql, values;

    if (member_profile_image) {
      sql = `
        UPDATE public.member 
        SET member_firstname = $1, member_lastname = $2, member_email = $3,
            member_phone = $4, member_address = $5, member_profile_image = $6
        WHERE member_id = $7
        RETURNING *
      `;
      values = [member_firstname, member_lastname, member_email, member_phone, member_address, member_profile_image, member_id];
    } else {
      sql = `
        UPDATE public.member 
        SET member_firstname = $1, member_lastname = $2, member_email = $3,
            member_phone = $4, member_address = $5
        WHERE member_id = $6
        RETURNING *
      `;
      values = [member_firstname, member_lastname, member_email, member_phone, member_address, member_id];
    }

    const result = await pool.query(sql, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("updateMember error:", error);
    throw new Error(error.message);
  }
}

/* *****************************
 *   Get member by ID for editing
 * *************************** */
async function getMemberById(member_id) {
  try {
    const sql = "SELECT * FROM public.member WHERE member_id = $1";
    const result = await pool.query(sql, [member_id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("getMemberById error:", error.message);
    throw error;
  }
}

/* *****************************
 *   Update existing member
 * *************************** */
async function updateMember(
  member_id,
  first_name,
  last_name,
  email,
  phone = null,
  address = null,
  profile_image = null  // null = keep existing, Buffer = replace
) {
  try {
    let sql, values;

    if (profile_image) {
      // Replace image
      sql = `
        UPDATE public.member 
        SET member_firstname = $1, member_lastname = $2, member_email = $3,
            member_phone = $4, member_address = $5, member_profile_image = $6
        WHERE member_id = $7
        RETURNING *
      `;
      values = [first_name, last_name, email, phone, address, profile_image, member_id];
    } else {
      // Keep existing image
      sql = `
        UPDATE public.member 
        SET member_firstname = $1, member_lastname = $2, member_email = $3,
            member_phone = $4, member_address = $5
        WHERE member_id = $6
        RETURNING *
      `;
      values = [first_name, last_name, email, phone, address, member_id];
    }

    const result = await pool.query(sql, values);
    return result.rows[0] || null;
  } catch (error) {
    console.error("updateMember error:", error.message);
    throw error;
  }
}
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
module.exports={registerAccount,checkExistingEmail,getAccountByEmail,addMember,updateMember,getMemberById,getAllMembers}