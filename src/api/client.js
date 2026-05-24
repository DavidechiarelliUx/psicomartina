export async function apiFetch(path, options = {}) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("dashboard_token") : null;
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const response = await fetch(path, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Errore durante la richiesta al server.");
  }

  return data;
}
