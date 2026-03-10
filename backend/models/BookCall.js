const { createDocument, setDocument } = require("../utils/firestoreRest");

const COLLECTION = "book_calls";

const BookCall = {
  /**
   * Save a new book-call submission.
   * @param {{ name: string, company?: string|null, email: string, phone: string, projectType: string, budget: string, timeline: string, description: string }} data
   * @returns {Promise<{ id: string, created_at: string }>}
   */
  async create(data) {
    const created_at = new Date().toISOString();
    const docRef = await createDocument(COLLECTION, {
      name: data.name,
      company: data.company || null,
      email: data.email,
      phone: data.phone,
      projectType: data.projectType,
      budget: data.budget,
      timeline: data.timeline,
      description: data.description,
      source: data.source || "website",
      request_meta: data.request_meta || null,
      email_status: "pending",
      email_error: null,
      email_message_id: null,
      created_at,
    });
    console.log(`[DB] Book call saved: ${docRef.id}`);
    return { id: docRef.id, created_at };
  },

  /**
   * Update email delivery status for a book call submission.
   * @param {string} id
   * @param {"pending"|"sent"|"failed"} status
   * @param {string|null} error
   * @param {{ messageId?: string|null, provider?: string, attempts?: number|null }} meta
   */
  async updateEmailStatus(id, status, error = null, meta = {}) {
    await setDocument(
      COLLECTION,
      id,
      {
        email_status: status,
        email_error: error,
        email_message_id: meta.messageId || null,
        email_provider: meta.provider || "resend",
        email_attempts: Number.isFinite(meta.attempts) ? meta.attempts : null,
        email_updated_at: new Date().toISOString(),
      },
      { merge: true }
    );
  },
};

module.exports = BookCall;
