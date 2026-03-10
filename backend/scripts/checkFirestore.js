require("dotenv").config();

const { createDocument, setDocument } = require("../utils/firestoreRest");

async function checkFirestore() {
  const testId = `firestore-check-${Date.now()}`;

  try {
    await createDocument("_healthchecks", {
      status: "ok",
      created_at: new Date().toISOString(),
      source: "backend/scripts/checkFirestore.js",
    }, testId);

    await setDocument("_healthchecks", testId, {
      deleted_at: new Date().toISOString(),
      status: "deleted",
    });

    console.log("[CHECK] Firestore write/delete test passed");
    process.exit(0);
  } catch (err) {
    console.error("[CHECK] Firestore check failed:", err.message);

    if (String(err.message || "").includes("5 NOT_FOUND")) {
      console.error(
        "[CHECK] Firestore database was not found for this Firebase project. Create Firestore (Native mode) in Firebase Console for the same project_id as your service account."
      );
    }

    process.exit(1);
  }
}

checkFirestore();
