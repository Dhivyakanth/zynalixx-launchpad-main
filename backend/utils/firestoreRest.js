const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { GoogleAuth } = require("google-auth-library");

const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";

let cachedConfig = null;
let cachedAuthClient = null;

function getServiceAccountConfig() {
  if (cachedConfig) return cachedConfig;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    cachedConfig = {
      projectId: key.project_id,
      credentials: {
        client_email: key.client_email,
        private_key: key.private_key,
      },
    };
    return cachedConfig;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const configuredPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH.trim();
    const absolutePath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.resolve(process.cwd(), configuredPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Firebase service account file not found at: ${absolutePath}`);
    }

    const key = JSON.parse(fs.readFileSync(absolutePath, "utf8"));
    cachedConfig = {
      projectId: key.project_id,
      credentials: {
        client_email: key.client_email,
        private_key: key.private_key,
      },
    };
    return cachedConfig;
  }

  throw new Error(
    "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_PATH."
  );
}

async function getAuthToken() {
  const cfg = getServiceAccountConfig();
  if (!cachedAuthClient) {
    const auth = new GoogleAuth({
      credentials: cfg.credentials,
      scopes: [FIRESTORE_SCOPE],
    });
    cachedAuthClient = await auth.getClient();
  }

  const token = await cachedAuthClient.getAccessToken();
  return token.token;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };

  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };

  if (typeof value === "number") {
    if (Number.isInteger(value)) return { integerValue: String(value) };
    return { doubleValue: value };
  }

  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map((item) => toFirestoreValue(item)) } };
  }

  if (typeof value === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }

  return { stringValue: String(value) };
}

function toFirestoreFields(data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toFirestoreValue(v);
  }
  return fields;
}

async function firestoreRequest(method, requestPath, body) {
  const token = await getAuthToken();
  const url = `https://firestore.googleapis.com/v1/${requestPath}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await res.text();
  let json = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg = json?.error?.message || raw || "Firestore REST request failed";
    throw new Error(msg);
  }

  return json;
}

function getProjectPath() {
  const cfg = getServiceAccountConfig();
  return `projects/${cfg.projectId}/databases/default/documents`;
}

async function createDocument(collection, data, explicitId = null) {
  const documentId = explicitId || crypto.randomUUID();
  const path = `${getProjectPath()}/${encodeURIComponent(collection)}?documentId=${encodeURIComponent(documentId)}`;

  await firestoreRequest("POST", path, { fields: toFirestoreFields(data) });
  return { id: documentId };
}

async function setDocument(collection, id, data, options = { merge: true }) {
  const basePath = `${getProjectPath()}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  let requestPath = basePath;

  if (options?.merge) {
    const keys = Object.keys(data);
    if (keys.length) {
      const mask = keys
        .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
        .join("&");
      requestPath = `${basePath}?${mask}`;
    }
  }

  await firestoreRequest("PATCH", requestPath, { fields: toFirestoreFields(data) });
}

module.exports = {
  createDocument,
  setDocument,
};
