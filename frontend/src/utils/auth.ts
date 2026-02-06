const isBrowser = () => typeof window !== "undefined";

/* ============================
   SAVE AUTH DATA
============================ */
export const setAuthData = (token: string, role: string) => {
  if (!isBrowser()) return;
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
};

/* ============================
   GET TOKEN
============================ */
export const getToken = () => {
  if (!isBrowser()) return null;
  return localStorage.getItem("token");
};

/* ============================
   GET USER ROLE
============================ */
export const getRole = () => {
  if (!isBrowser()) return null;
  return localStorage.getItem("role");
};

/* ============================
   CHECK AUTH STATUS
============================ */
export const isAuthenticated = () => {
  if (!isBrowser()) return false;
  return Boolean(localStorage.getItem("token"));
};

/* ============================
   LOGOUT HANDLER
============================ */
export const logout = () => {
  if (!isBrowser()) return;

  localStorage.removeItem("token");
  localStorage.removeItem("role");

  // redirect ke login setelah logout
  window.location.href = "/login";
};
