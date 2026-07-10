import apiClient from "./apiClient";

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

export async function login(email, password) {
  try {
    const data = await apiClient("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    const { token, refreshToken } = data;
    const payload = decodeToken(token);

    const userData = {
      userId: payload?.userId,
      displayName: payload?.name,
      role: payload?.role,
      email,
      loginDate: new Date().toISOString(),
    };

    localStorage.setItem("authToken", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("userData", JSON.stringify(userData));

    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function register(displayName, email, password) {
  try {
    const data = await apiClient("/register", {
      method: "POST",
      body: JSON.stringify({ displayName, email, password }),
    });
    return { success: true, user: data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");
}

export function getCurrentUser() {
  const userData = localStorage.getItem("userData");
  return userData ? JSON.parse(userData) : null;
}

export function isAuthenticated() {
  const token = localStorage.getItem("authToken");
  return token !== null;
}
