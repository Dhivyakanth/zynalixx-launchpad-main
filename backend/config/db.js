const admin = require("firebase-admin");

function initFirestore() {
  if (admin.apps.length) return admin.firestore();

  // 1) JSON string from env (production / Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  // 2) File path (local dev)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  // 3) Default credentials (CI, Cloud Run, etc.)
  else {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }

  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  console.log("[DB] Firestore initialized");
  return db;
}

module.exports = initFirestore();
