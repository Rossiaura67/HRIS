export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiRequest(
  endpoint: string,
  method: string = "GET",
  body?: any,
  token?: string
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data;
  try {
    // coba parse JSON
    data = await response.json();
  } catch {
    // kalau bukan JSON (misalnya HTML error page), ambil raw text
    const text = await response.text();
    data = { message: "Invalid JSON response", raw: text };
  }

  return { ok: response.ok, status: response.status, data };
}
