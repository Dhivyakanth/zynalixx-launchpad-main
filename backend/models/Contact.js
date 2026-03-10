const { createDocument, setDocument } = require("../utils/firestoreRest");

const COLLECTION = "contacts";

const Contact = {
  /**
   * Save a new contact submission.
   * @param {{ name: string, email: string, phone?: string, message: string }} data
   * @returns {Promise<{ id: string, created_at: string }>}
   */
  async create(data) {
    const created_at = new Date().toISOString();
    const docRef = await createDocument(COLLECTION, {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      source: data.source || "website",
      request_meta: data.request_meta || null,
      email_status: "pending",
      email_error: null,
      email_message_id: null,
      created_at,
    });
    console.log(`[DB] Contact saved: ${docRef.id}`);
    return { id: docRef.id, created_at };
  },

  /**
   * Update email delivery status for a contact submission.
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

module.exports = Contact;
