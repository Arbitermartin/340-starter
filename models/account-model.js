// models/uhwf-model.js
const pool = require("../database")  // This assumes your database/index.js exports the pool

/* *****************************
 *   Get all documents (approved only for public view)
 * **************************** */
async function getApprovedDocuments() {
  try {
    const result = await pool.query(
      `SELECT d.*, u.full_name AS uploaded_by_name 
       FROM public.documents AS d
       LEFT JOIN public.users AS u ON d.uploaded_by = u.id
       WHERE d.status = 'APPROVED'
       ORDER BY d.created_at DESC`
    )
    return result.rows
  } catch (error) {
    console.error("getApprovedDocuments error: ", error)
    throw error
  }
}

/* *****************************
 *   Get document by ID (with uploader info)
 * **************************** */
async function getDocumentById(documentId) {
  try {
    const result = await pool.query(
      `SELECT d.*, u.full_name AS uploaded_by_name 
       FROM public.documents AS d
       LEFT JOIN public.users AS u ON d.uploaded_by = u.id
       WHERE d.id = $1`,
      [documentId]
    )
    return result.rows[0]
  } catch (error) {
    console.error("getDocumentById error: ", error)
    throw error
  }
}

/* *****************************
 *   Add new document (students & members)
 * **************************** */
async function addDocument(title, description, file_url, file_type, file_size, uploaded_by, category, tags = []) {
  try {
    const sql = `
      INSERT INTO public.documents 
        (title, description, file_url, file_type, file_size, uploaded_by, category, tags, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING_REVIEW')
      RETURNING *`
    const result = await pool.query(sql, [title, description, file_url, file_type, file_size, uploaded_by, category, tags])
    return result.rows[0]
  } catch (error) {
    console.error("addDocument error: ", error)
    throw error
  }
}

/* *****************************
 *   Get all forum threads (latest activity first)
 * **************************** */
async function getForumThreads() {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name AS category_name, u.full_name AS author_name
       FROM public.forum_threads AS t
       JOIN public.forum_categories AS c ON t.category_id = c.id
       JOIN public.users AS u ON t.author_id = u.id
       ORDER BY t.last_activity_at DESC`
    )
    return result.rows
  } catch (error) {
    console.error("getForumThreads error: ", error)
    throw error
  }
}

/* *****************************
 *   Get payments by user ID (for citizen/employee dashboard)
 * **************************** */
async function getPaymentsByUserId(userId) {
  try {
    const result = await pool.query(
      `SELECT * FROM public.payments 
       WHERE user_id = $1 
       ORDER BY initiated_at DESC`,
      [userId]
    )
    return result.rows
  } catch (error) {
    console.error("getPaymentsByUserId error: ", error)
    throw error
  }
}

/* *****************************
 *   Get all events (published only)
 * **************************** */
async function getPublishedEvents() {
  try {
    const result = await pool.query(
      `SELECT * FROM public.events 
       WHERE status = 'PUBLISHED'
       ORDER BY event_date ASC`
    )
    return result.rows
  } catch (error) {
    console.error("getPublishedEvents error: ", error)
    throw error
  }
}

/* *****************************
 *   Check if user is staff/admin (for protected routes)
 * **************************** */
async function getStaffPermissions(userId) {
  try {
    const result = await pool.query(
      `SELECT * FROM public.staff_members WHERE user_id = $1 AND is_active = true`,
      [userId]
    )
    return result.rows[0] || null
  } catch (error) {
    console.error("getStaffPermissions error: ", error)
    throw error
  }
}

/* *****************************
 *   Get pending documents (for admins & approvers)
 * **************************** */
async function getPendingDocuments() {
  try {
    const result = await pool.query(
      `SELECT d.*, u.full_name AS uploaded_by_name 
       FROM public.documents AS d
       LEFT JOIN public.users AS u ON d.uploaded_by = u.id
       WHERE d.status = 'PENDING_REVIEW'
       ORDER BY d.created_at ASC`
    )
    return result.rows
  } catch (error) {
    console.error("getPendingDocuments error: ", error)
    throw error
  }
}

/* *****************************
 *   Approve a document
 * **************************** */
async function approveDocument(documentId, approverId) {
  try {
    const sql = `
      UPDATE public.documents 
      SET status = 'APPROVED', approved_by = $2, approved_at = NOW()
      WHERE id = $1
      RETURNING *`
    const result = await pool.query(sql, [documentId, approverId])
    return result.rows[0]
  } catch (error) {
    console.error("approveDocument error: ", error)
    throw error
  }
}

module.exports = {
  getApprovedDocuments,
  getDocumentById,
  addDocument,
  getForumThreads,
  getPaymentsByUserId,
  getPublishedEvents,
  getStaffPermissions,
  getPendingDocuments,
  approveDocument
}