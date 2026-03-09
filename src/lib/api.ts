const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "");

export async function submitContactForm(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  const res = await fetch(`${API_BASE_URL}/api/contacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json.errors?.join(", ") || json.message || "Something went wrong"
    );
  }

  return json;
}
