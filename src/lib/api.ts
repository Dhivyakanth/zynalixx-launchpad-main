const API_BASE_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_URL || "";

function getNetworkErrorMessage(err: unknown) {
  const defaultMessage =
    err instanceof Error ? err.message : "Unable to reach server";

  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return import.meta.env.DEV
      ? "Unable to reach local backend. Start backend on http://localhost:5000 and verify Vite proxy is running."
      : "Unable to reach backend. Check VITE_API_URL, CORS allowlist, and backend deployment status.";
  }

  return defaultMessage;
}

async function parseApiResponse(res: Response) {
  const rawText = await res.text();
  let json: any = null;

  try {
    json = rawText ? JSON.parse(rawText) : null;
  } catch {
    if (!res.ok) {
      throw new Error(
        "Server returned a non-JSON response. Check VITE_API_URL and backend deployment."
      );
    }
  }

  if (!res.ok) {
    throw new Error(
      json?.errors?.join(", ") || json?.message || "Something went wrong"
    );
  }

  return json;
}

export async function submitContactForm(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return parseApiResponse(res);
  } catch (err) {
    throw new Error(getNetworkErrorMessage(err));
  }
}

export async function submitBookCallForm(data: {
  name: string;
  company?: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  timeline: string;
  description: string;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/book-calls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return parseApiResponse(res);
  } catch (err) {
    throw new Error(getNetworkErrorMessage(err));
  }
}
