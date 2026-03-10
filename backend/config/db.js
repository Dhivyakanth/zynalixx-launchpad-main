const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { Firestore } = require("@google-cloud/firestore");

function initFirestore() {
  let credentialSource = "application-default";
  let configuredProjectId = null;
  let serviceAccount = null;
  const preferRest = String(process.env.FIRESTORE_PREFER_REST || "true").toLowerCase() !== "false";

  // 1) JSON string from env (production / Render)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    credentialSource = "env:FIREBASE_SERVICE_ACCOUNT_KEY";
    configuredProjectId = serviceAccount.project_id || null;
  }
  // 2) File path (local dev)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH.trim();
    const absolutePath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Firebase service account file not found at: ${absolutePath}`);
    }

    serviceAccount = require(absolutePath);
    credentialSource = `file:${absolutePath}`;
    configuredProjectId = serviceAccount.project_id || null;
  }

  // Prefer explicit Firestore client in local/dev to avoid gRPC transport edge-cases.
  if (serviceAccount) {
    const db = new Firestore({
      projectId: configuredProjectId || undefined,
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      preferRest,
      ignoreUndefinedProperties: true,
    });

    console.log(
      `[DB] Firestore initialized (project=${configuredProjectId || "unknown"}, source=${credentialSource}, preferRest=${preferRest}, client=google-cloud-firestore)`
    );
    return db;
  }

  // 3) Fallback to Admin SDK default credentials (CI, Cloud Run, etc.)
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  }

  const db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  console.log(
    `[DB] Firestore initialized (project=${configuredProjectId || "unknown"}, source=${credentialSource}, client=firebase-admin)`
  );

  if (!configuredProjectId) {
    console.warn(
      "[DB] Project ID not resolved from credentials. Ensure Firebase service account credentials are configured correctly."
    );
  }

  return db;
}

module.exports = initFirestore();
