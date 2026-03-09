const db = require("../config/db");

const COLLECTION = "contacts";

const Contact = {
  /**
   * Save a new contact submission.
   * @param {{ name: string, email: string, phone?: string, message: string }} data
   * @returns {Promise<{ id: string, created_at: string }>}
   */
  async create(data) {
    const created_at = new Date().toISOString();
    const docRef = await db.collection(COLLECTION).add({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      created_at,
    });
    console.log(`[DB] Contact saved: ${docRef.id}`);
    return { id: docRef.id, created_at };
  },
};

module.exports = Contact;
