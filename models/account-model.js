// models/account-model.js
const pool = require("../database")  //database accountModel
async function registerAccount(account_firstname, account_lastname, account_email, account_password, account_type) {
  try {
    const sql = `
      INSERT INTO public.account 
        (account_firstname, account_lastname, account_email, account_password, account_type) 
      VALUES ($1, $2, $3, $4, $5)
      RETURNING account_id, account_firstname, account_lastname, account_email, account_type
    `;

    const result = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_password,
      account_type  // ← New parameter
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("registerAccount ERROR:", error);
    throw new Error(error.message || "Failed to register account");
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

// for contact form.
async function saveContactMessage(firstname, lastname, email, message) {
  try {
    const sql = `
      INSERT INTO public.contact_messages 
        (firstname, lastname, email, message) 
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    const result = await pool.query(sql, [
      firstname.trim(),
      lastname.trim(),
      email.trim(),
      message.trim()
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("Contact save error:", error);
    throw error;
  }
}
// for delete member
async function deleteMember(memberId) {
  const result = await db.query(
      'DELETE FROM members WHERE member_id = $1 RETURNING *',
      [memberId]
  );
  return result.rowCount > 0; // true if a row was deleted


}

/* *****************************
 *   Get all students (Admin View)
 * *************************** */
async function getAllStudents() {
  try {
    const sql = `
      SELECT 
        s.student_id,
        s.registration_no,
        s.programme,
        s.phone,
        s.year_level,
        s.status,
        s.profile_image,
        a.account_id,
        a.account_firstname,
        a.account_lastname,
        a.account_email
      FROM public.students s
      INNER JOIN public.account a 
        ON s.account_id = a.account_id
      ORDER BY a.account_firstname, a.account_lastname
    `;

    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("getAllStudents error:", error);
    throw error;
  }
}

/***************************
 * Delivery fetch employee data from database.
 */

async function viewEmployees() {
  try {
    const sql = `
    SELECT 
      e.employee_id,
      e.employee_code,
      e.phone_number,
      e.department,
      e.position,
      e.hire_date,
      e.profile_image,
      e.status,
      a.account_id,
      a.account_firstname,
      a.account_lastname,
      a.account_email
   FROM public.employees e
      INNER JOIN public.account a 
        ON e.account_id = a.account_id
      ORDER BY a.account_firstname, a.account_lastname
  `;
  const result = await pool.query(sql);
  return result.rows;
} catch (error) {
  console.error("viewEmployees error:", error);
  throw error;
}
}

/*************************
 * Deliver registration for add employee
 */
async function addAccount(firstname, lastname, email, password, account_type) {  // password is now already hashed
  try {
    const sql = `
      INSERT INTO public.account (
        account_firstname,
        account_lastname,
        account_email,
        account_password,
        account_type
      ) VALUES ($1,$2,$3,$4,$5)
      RETURNING account_id;
    `;
    const values = [firstname, lastname, email, password, account_type];  // Use password as-is (hashed)
    const result = await pool.query(sql, values);
    return result.rows[0];
  } catch (error) {
    console.error("addAccount error:", error.message);
    throw error;
  }
}
async function addEmployee(account_id, phone_number, department, position, hire_date, profile_image) {
  try {
    // Generate employee_code automatically: EMP-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const countRes = await pool.query("SELECT COUNT(*) FROM public.employees");
    const nextNumber = parseInt(countRes.rows[0].count) + 1;
    const paddedNumber = nextNumber.toString().padStart(4, '0');
    const employee_code = `EMP-${currentYear}-${paddedNumber}`;

    console.log("Generated employee_code:", employee_code); // For debug

    const sql = `
      INSERT INTO public.employees (
        account_id, employee_code, phone_number, department, 
        position, hire_date, profile_image
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      account_id,
      employee_code,
      phone_number,
      department,
      position,
      hire_date,
      profile_image
    ];
    const result = await pool.query(sql, values);
    return result.rows[0];
  } catch (error) {
    console.error("addEmployee error:", error.message);
    throw error;
  }
}

// end here

/* ****************************************
 *   Get full employee data by employee_id (joined with account) for editing
 * *************************************** */
async function getEmployeeById(employee_id) {
  try {
    const sql = `
      SELECT 
        e.employee_id,
        e.account_id,
        e.employee_code,
        e.phone_number,
        e.department,
        e.position,
        e.hire_date,
        e.profile_image,
        e.status,
        a.account_firstname AS firstname,
        a.account_lastname AS lastname,
        a.account_email AS email
      FROM public.employees e
      INNER JOIN public.account a ON e.account_id = a.account_id
      WHERE e.employee_id = $1
    `;
    const result = await pool.query(sql, [employee_id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("getEmployeeById error:", error);
    throw error;
  }
}

/***********************************************************
 * *************** Deliver employee login by employee code
 */
async function getAccountByEmployeeCode(employee_code) {
  try {
    console.log(`[MODEL] Looking up employee by code: "${employee_code}"`);

    const sql = `
      SELECT 
        a.account_id, a.account_firstname, a.account_lastname, 
        a.account_email, a.account_type, a.account_password
      FROM public.account a
      INNER JOIN public.employees e ON a.account_id = e.account_id
      WHERE e.employee_code = $1
    `;

    const result = await pool.query(sql, [employee_code.trim()]);

    console.log(`[MODEL] Employee code query rows found: ${result.rowCount}`);

    if (result.rowCount === 0) {
      console.log(`[MODEL] No match for employee_code "${employee_code}"`);
      return null;
    }

    console.log(`[MODEL] Found account: ID=${result.rows[0].account_id}, email=${result.rows[0].account_email}`);

    return result.rows[0];
  } catch (error) {
    console.error("[MODEL getAccountByEmployeeCode ERROR]:", error.message);
    throw error;
  }
}

// end here


/* ****************************************
 *   Update basic account info (firstname, lastname, email)
 * *************************************** */
async function updateAccountBasic(account_id, firstname, lastname, email) {
  try {
    const sql = `
      UPDATE public.account
      SET 
        account_firstname = $1,
        account_lastname = $2,
        account_email = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE account_id = $4
      RETURNING account_id
    `;
    const result = await pool.query(sql, [firstname, lastname, email, account_id]);
    return result.rowCount > 0;
  } catch (error) {
    console.error("updateAccountBasic error:", error);
    throw error;
  }
}

/* ****************************************
 *   Update employee-specific fields
 *   (profile_image = null → keep existing)
 * *************************************** */
async function updateEmployee(
  employee_id,
  employee_code,
  phone_number,
  department,
  position,
  hire_date,
  profile_image = null,
  status = 'active'
) {
  try {
    let sql = `
      UPDATE public.employees
      SET 
        employee_code = $1,
        phone_number = $2,
        department = $3,
        position = $4,
        hire_date = $5,
        status = $6,
        --updated_at = CURRENT_TIMESTAMP
    `;
    let values = [employee_code, phone_number, department, position, hire_date, status];

    if (profile_image !== null) {
      sql += `, profile_image = $7`;
      values.push(profile_image);
    }

    sql += ` WHERE employee_id = $${values.length + 1} RETURNING employee_id`;
    values.push(employee_id);

    const result = await pool.query(sql, values);
    return result.rowCount > 0;
  } catch (error) {
    console.error("updateEmployee error:", error);
    throw error;
  }
}

/*******************
 * Delivery delete employee
 */
// Delete employee + linked account (permanent)
async function deleteEmployee(employeeId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get account_id first
    const emp = await client.query(
      `SELECT account_id FROM public.employees WHERE employee_id = $1`,
      [employeeId]
    );

    if (emp.rowCount === 0) {
      throw new Error("Employee not found");
    }

    const accountId = emp.rows[0].account_id;

    // Delete employee record
    await client.query(
      `DELETE FROM public.employees WHERE employee_id = $1`,
      [employeeId]
    );

    // Delete account record
    await client.query(
      `DELETE FROM public.account WHERE account_id = $1`,
      [accountId]
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Delete employee failed:", err.message);
    return false;
  } finally {
    client.release();
  }
}
/****************************
 * Delivery for events
 */
// Get latest 5 news items for home page
async function getLatestNews(limit = 5) {
  try {
    const sql = `
      SELECT * FROM public.news 
      WHERE is_active = true 
      ORDER BY news_date DESC, created_at DESC 
      LIMIT $1
    `;
    const result = await pool.query(sql, [limit]);
    return result.rows;
  } catch (err) {
    console.error("getLatestNews error:", err);
    return [];
  }
}

// Get upcoming 5 events for home page
async function getUpcomingEvents(limit = 5) {
  try {
    const sql = `
      SELECT * FROM public.events 
      WHERE is_active = true 
        AND event_date >= CURRENT_DATE 
      ORDER BY event_date ASC 
      LIMIT $1
    `;
    const result = await pool.query(sql, [limit]);
    return result.rows;
  } catch (err) {
    console.error("getUpcomingEvents error:", err);
    return [];
  }
}
// Admin: Create news.
async function createNews({ title, description, profile_image, news_date, created_by }) {
  try {
    if (!title?.trim()) throw new Error("News title is required");
    if (!description?.trim()) throw new Error("Description is required");

    const sql = `
      INSERT INTO public.news 
        (title, description, profile_image, news_date, created_by, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `;

    const result = await pool.query(sql, [
      title.trim(),
      description.trim(),
      profile_image || null,
      news_date || new Date().toISOString().split('T')[0],
      created_by
    ]);

    return result.rows[0];
  } catch (err) {
    console.error("createNews ERROR:", err.message);
    throw err;
  }
}

// Admin: Create event
async function createEvent({ title, description, event_date, location, profile_image, created_by }) {
  try {
    if (!title?.trim()) throw new Error("Event title is required");
    if (!event_date) throw new Error("Event date is required");

    const sql = `
      INSERT INTO public.events 
        (title, description, profile_image, event_date, location, created_by, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING *
    `;

    const result = await pool.query(sql, [
      title.trim(),
      description?.trim() || null,
      profile_image || null,        // ← maps to image_url column
      event_date,
      location?.trim() || null,
      created_by
    ]);

    return result.rows[0];
  } catch (err) {
    console.error("createEvent ERROR:", err.message);
    throw err;
  }
}
/* ****************************************
 *   Get single event by ID for Read More page
 * *************************************** */
async function getEventById(event_id) {
  try {
    const sql = `
      SELECT * FROM public.events 
      WHERE event_id = $1 
        AND is_active = true
    `;
    const result = await pool.query(sql, [event_id]);
    return result.rows[0] || null;
  } catch (err) {
    console.error("getEventById error:", err);
    throw err;
  }
}
/* ****************************************
 *   Save Event Registration
 * *************************************** */
async function addEventRegistration(registrationData) {
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
    } = registrationData;

    const sql = `
      INSERT INTO public.event_registrations 
        (event_id, full_name, phone_number, email, course_of_study, 
         university_name, date_of_birth, working_experience, company_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING registration_id
    `;

    const result = await pool.query(sql, [
      event_id,
      full_name,
      phone_number,
      email,
      course_of_study || null,
      university_name || null,
      date_of_birth || null,
      working_experience || 0,
      company_name || null
    ]);

    return result.rows[0];
  } catch (error) {
    console.error("addEventRegistration error:", error);
    throw error;
  }
}
/* ****************************************
 *   Get All Event Registrations (for Admin)
 * *************************************** */
async function getAllEventRegistrations() {
  try {
    const sql = `
      SELECT 
        er.registration_id,
        er.full_name,
        er.phone_number,
        er.email,
        er.course_of_study,
        er.university_name,
        er.date_of_birth,
        er.working_experience,
        er.company_name,
        er.registered_at,
        er.status,
        e.title AS event_title,
        e.event_date
      FROM public.event_registrations er
      LEFT JOIN public.events e ON er.event_id = e.event_id
      ORDER BY er.registered_at DESC
    `;
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("getAllEventRegistrations error:", error);
    throw error;
  }
}
/* ****************************************
 *   Create New Video (Admin)
 * *************************************** */
async function createVideo(videoData) {
  try {
    const { title, description, youtube_url, category, created_by } = videoData;

    // Extract YouTube ID
    let youtube_id = null;
    const match = youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube.com\/embed\/)([^&\n?#]+)/);
    if (match) youtube_id = match[1];

    const sql = `
      INSERT INTO public.videos (title, description, youtube_url, youtube_id, category, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(sql, [title, description, youtube_url, youtube_id, category || 'General', created_by]);
    return result.rows[0];
  } catch (err) {
    console.error("createVideo error:", err);
    throw err;
  }
}

/* ****************************************
 *   Get All Active Videos for Gallery
 * *************************************** */

// Extract YouTube ID from any URL format
function extractYoutubeId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([^?&\s]{11})/,
    /youtube\.com\/watch\?v=([^?&\s]{11})/,
    /youtube\.com\/embed\/([^?&\s]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get all active videos
async function getAllVideos() {
  const result = await pool.query(
    `SELECT * FROM public.videos WHERE is_active = TRUE ORDER BY created_at DESC`
  );
  return result.rows;
}

// Create new video (auto-extracts youtube_id)
async function createVideo({ title, description, youtube_url, category, created_by }) {
  const youtube_id = extractYoutubeId(youtube_url);
  const result = await pool.query(
    `INSERT INTO public.videos 
      (title, description, youtube_url, youtube_id, category, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, description, youtube_url, youtube_id, category || 'General', created_by]
  );
  return result.rows[0];
}

// Soft delete video (sets is_active = FALSE)
async function softDeleteVideo(video_id) {
  const result = await pool.query(
    `UPDATE public.videos SET is_active = FALSE WHERE video_id = $1 RETURNING *`,
    [video_id]
  );
  return result.rows[0];
}
/* Save Reset Token */
async function saveResetToken(email, token) {
  try {
    const sql = `
      INSERT INTO public.password_resets (email, token, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '1 hour')
      ON CONFLICT (email) DO UPDATE 
      SET token = $2, expires_at = NOW() + INTERVAL '1 hour'
    `;
    await pool.query(sql, [email, token]);
  } catch (error) {
    console.error("saveResetToken error:", error);
    throw error;
  }
}

/* Verify Reset Token */
async function verifyResetToken(token) {
  try {
    const sql = `SELECT * FROM public.password_resets WHERE token = $1 AND expires_at > NOW()`;
    const result = await pool.query(sql, [token]);
    return result.rows[0];
  } catch (error) {
    console.error("verifyResetToken error:", error);
    return null;
  }
}

/* Update Password - Works for ALL user types */
async function updatePassword(email, newHashedPassword) {
  try {
    const sql = `UPDATE public.account SET account_password = $1 WHERE account_email = $2`;
    const result = await pool.query(sql, [newHashedPassword, email]);
    return result.rowCount > 0;
  } catch (error) {
    console.error("updatePassword error:", error);
    throw error;
  }
}
async function getAllJobs() {
  try {
    const sql = `
      SELECT 
        j.id,
        j.department_name,
        j.job_title,
        j.number_of_positions,
        j.qualifications,
        j.experience,
        j.status,
        j.posted_at,
        a.account_firstname AS posted_by_name
      FROM public.job_openings j
      LEFT JOIN public.account a ON j.posted_by = a.account_id
      WHERE j.status = 'active'
      ORDER BY j.posted_at DESC
    `;
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("getAllJobs error:", error);
    throw error;
  }
}

async function createJob({ department_name, job_title, number_of_positions, qualifications, experience, posted_by }) {
  try {
    const sql = `
      INSERT INTO public.job_openings 
        (department_name, job_title, number_of_positions, qualifications, experience, posted_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(sql, [
      department_name,
      job_title,
      number_of_positions,
      JSON.stringify(qualifications),
      experience,
      posted_by
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("createJob error:", error);
    throw error;
  }
}


// ─── TASKS ──────────────────────────────────────────────

async function createTask({ title, description, assigned_to, assigned_by, priority, due_date }) {
  const result = await pool.query(
    `INSERT INTO public.tasks (title, description, assigned_to, assigned_by, priority, due_date)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [title, description, assigned_to, assigned_by, priority || 'medium', due_date || null]
  );
  return result.rows[0];
}

async function getAllTasks() {
  const result = await pool.query(
    `SELECT t.*,
            ae.account_firstname||' '||ae.account_lastname AS employee_name,
            ae.account_email AS employee_email,
            ab.account_firstname||' '||ab.account_lastname AS assigned_by_name
     FROM public.tasks t
     JOIN public.account ae ON t.assigned_to = ae.account_id
     JOIN public.account ab ON t.assigned_by = ab.account_id
     ORDER BY t.created_at DESC`
  );
  return result.rows;
}

async function getTasksByEmployee(account_id) {
  const result = await pool.query(
    `SELECT t.*,
            ab.account_firstname||' '||ab.account_lastname AS assigned_by_name
     FROM public.tasks t
     JOIN public.account ab ON t.assigned_by = ab.account_id
     WHERE t.assigned_to = $1
     ORDER BY t.created_at DESC`,
    [account_id]
  );
  return result.rows;
}

async function getTaskById(task_id) {
  const result = await pool.query(
    `SELECT t.*,
            ae.account_firstname||' '||ae.account_lastname AS employee_name,
            ab.account_firstname||' '||ab.account_lastname AS assigned_by_name
     FROM public.tasks t
     JOIN public.account ae ON t.assigned_to = ae.account_id
     JOIN public.account ab ON t.assigned_by = ab.account_id
     WHERE t.task_id = $1`,
    [task_id]
  );
  return result.rows[0] || null;
}

async function updateTaskStatus(task_id, status) {
  const result = await pool.query(
    `UPDATE public.tasks SET status=$1 WHERE task_id=$2 RETURNING *`,
    [status, task_id]
  );
  return result.rows[0];
}

async function deleteTask(task_id) {
  const result = await pool.query(
    `DELETE FROM public.tasks WHERE task_id=$1 RETURNING *`,
    [task_id]
  );
  return result.rows[0];
}

// ─── REPORTS ────────────────────────────────────────────

async function submitReport({ task_id, submitted_by, report_text }) {
  const result = await pool.query(
    `INSERT INTO public.task_reports (task_id, submitted_by, report_text)
     VALUES ($1,$2,$3) RETURNING *`,
    [task_id, submitted_by, report_text]
  );
  await pool.query(
    `UPDATE public.tasks SET status='submitted' WHERE task_id=$1`,
    [task_id]
  );
  return result.rows[0];
}

async function getReportByTaskId(task_id) {
  const result = await pool.query(
    `SELECT r.*, a.account_firstname||' '||a.account_lastname AS submitted_by_name
     FROM public.task_reports r
     JOIN public.account a ON r.submitted_by = a.account_id
     WHERE r.task_id=$1 ORDER BY r.submitted_at DESC LIMIT 1`,
    [task_id]
  );
  return result.rows[0] || null;
}

async function getAllReports() {
  const result = await pool.query(
    `SELECT r.*,
            t.title AS task_title, t.priority, t.due_date,
            a.account_firstname||' '||a.account_lastname AS employee_name,
            a.account_email AS employee_email
     FROM public.task_reports r
     JOIN public.tasks t ON r.task_id = t.task_id
     JOIN public.account a ON r.submitted_by = a.account_id
     ORDER BY r.submitted_at DESC`
  );
  return result.rows;
}

async function getReportById(report_id) {
  const result = await pool.query(
    `SELECT r.*,
            t.title AS task_title, t.description AS task_description,
            t.due_date, t.priority, t.task_id,
            a.account_firstname||' '||a.account_lastname AS employee_name,
            a.account_email AS employee_email,
            a.account_id AS employee_account_id
     FROM public.task_reports r
     JOIN public.tasks t ON r.task_id = t.task_id
     JOIN public.account a ON r.submitted_by = a.account_id
     WHERE r.report_id=$1`,
    [report_id]
  );
  return result.rows[0] || null;
}

// ─── COMMENTS ───────────────────────────────────────────

async function addComment({ report_id, commented_by, comment_text }) {
  const result = await pool.query(
    `INSERT INTO public.report_comments (report_id, commented_by, comment_text)
     VALUES ($1,$2,$3) RETURNING *`,
    [report_id, commented_by, comment_text]
  );
  return result.rows[0];
}

async function getCommentsByReportId(report_id) {
  const result = await pool.query(
    `SELECT c.*, a.account_firstname||' '||a.account_lastname AS commenter_name, a.account_type
     FROM public.report_comments c
     JOIN public.account a ON c.commented_by = a.account_id
     WHERE c.report_id=$1 ORDER BY c.created_at ASC`,
    [report_id]
  );
  return result.rows;
}

// ─── NOTIFICATIONS ──────────────────────────────────────

async function createNotification({ user_id, message, link }) {
  const result = await pool.query(
    `INSERT INTO public.notifications (user_id, message, link)
     VALUES ($1,$2,$3) RETURNING *`,
    [user_id, message, link || null]
  );
  return result.rows[0];
}

async function getNotificationsByUser(user_id) {
  const result = await pool.query(
    `SELECT * FROM public.notifications WHERE user_id=$1
     ORDER BY is_read ASC, created_at DESC`,
    [user_id]
  );
  return result.rows;
}

async function countUnreadNotifications(user_id) {
  const result = await pool.query(
    `SELECT COUNT(*) AS count FROM public.notifications
     WHERE user_id=$1 AND is_read=FALSE`,
    [user_id]
  );
  return parseInt(result.rows[0].count);
}

async function markNotificationsRead(user_id) {
  await pool.query(
    `UPDATE public.notifications SET is_read=TRUE WHERE user_id=$1`,
    [user_id]
  );
}

// ─── PROFILE ────────────────────────────────────────────

async function getEmployeeProfile(account_id) {
  const result = await pool.query(
    `SELECT a.account_id, a.account_firstname, a.account_lastname,
            a.account_email, a.account_type,
            e.employee_id, e.employee_code, e.phone_number,
            e.department, e.position, e.hire_date, e.profile_image, e.status
     FROM public.account a
     LEFT JOIN public.employee e ON a.account_id = e.account_id
     WHERE a.account_id=$1`,
    [account_id]
  );
  return result.rows[0] || null;
}

async function updateEmployeeProfile({ account_id, firstname, lastname, phone_number, profile_image }) {
  await pool.query(
    `UPDATE public.account SET account_firstname=$1, account_lastname=$2 WHERE account_id=$3`,
    [firstname, lastname, account_id]
  );
  if (profile_image) {
    await pool.query(
      `UPDATE public.employee SET phone_number=$1, profile_image=$2 WHERE account_id=$3`,
      [phone_number, profile_image, account_id]
    );
  } else {
    await pool.query(
      `UPDATE public.employee SET phone_number=$1 WHERE account_id=$2`,
      [phone_number, account_id]
    );
  }
}

async function getAllEmployees() {
  const result = await pool.query(
    `SELECT a.account_id, a.account_firstname, a.account_lastname, a.account_email,
            e.department, e.position
     FROM public.account a
     JOIN public.employees e ON a.account_id = e.account_id
     WHERE LOWER(TRIM(a.account_type)) = 'employee'
     ORDER BY a.account_firstname ASC`
  );
  return result.rows;
}
module.exports={registerAccount,checkExistingEmail,getAccountByEmail,addMember,updateMember,getMemberById,getAllMembers,deleteMember,getAllStudents,viewEmployees,addAccount,addEmployee,getEmployeeById,getAccountByEmployeeCode,deleteEmployee,updateAccountBasic,updateEmployee,saveContactMessage,getLatestNews,getUpcomingEvents,createNews,createEvent,getEventById,addEventRegistration,getAllEventRegistrations,createVideo,getAllVideos,saveResetToken,verifyResetToken,updatePassword,getAllJobs,createJob,softDeleteVideo,createTask, getAllTasks, getTasksByEmployee, getTaskById,updateTaskStatus, deleteTask,submitReport, getReportByTaskId, getAllReports, getReportById,addComment, getCommentsByReportId,createNotification, getNotificationsByUser,countUnreadNotifications, markNotificationsRead,
  getEmployeeProfile, updateEmployeeProfile, getAllEmployees,}

