const db = require("../config/db");

const COLLECTION = "book_calls";

const BookCall = {
  /**
   * Save a new book-call submission.
   * @param {{ name: string, company?: string|null, email: string, phone: string, projectType: string, budget: string, timeline: string, description: string }} data
   * @returns {Promise<{ id: string, created_at: string }>}
   */
  async create(data) {
    const created_at = new Date().toISOString();
    const docRef = await db.collection(COLLECTION).add({
      name: data.name,
      company: data.company || null,
      email: data.email,
      phone: data.phone,
      projectType: data.projectType,
      budget: data.budget,
      timeline: data.timeline,
      description: data.description,
      created_at,
    });
    console.log(`[DB] Book call saved: ${docRef.id}`);
    return { id: docRef.id, created_at };
  },
};

module.exports = BookCall;
