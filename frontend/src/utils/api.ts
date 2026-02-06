export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function apiRequest(
  endpoint: string,
  method: string = "GET",
  body?: any,
  token?: string
) {
  // Memastikan endpoint selalu dimulai dengan '/' agar tidak double atau kurang garis miring
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${cleanEndpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Cek apakah response kososng (204 No Content) sebelum parse JSON
    if (response.status === 204) {
      return { ok: true, status: 204, data: null };
    }

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
    
  } catch (error) {
    // Menangani error jaringan atau JSON yang tidak valid
    console.error("API Request Error:", error);
    return { 
      ok: false, 
      status: 500, 
      data: { message: "Gagal terhubung ke server atau respon tidak valid." } 
    };
  }
}