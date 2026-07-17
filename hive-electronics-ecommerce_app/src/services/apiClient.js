const BASE_URL = process.env.REACT_APP_API_URL;

const GET_CACHE_TTL_MS = 60_000;
const getCache = new Map();

const apiClient = async (path, options = {}) => {
  const method = (options.method || "GET").toUpperCase();

  if (method === "GET") {
    const cached = getCache.get(path);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const token = localStorage.getItem("authToken");
  const headers = { "Content-Type": "application/json", ...options.headers };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 204) {
    return null;
  }

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    window.location.href = "/login";
    return;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  if (method === "GET") {
    getCache.set(path, { data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
  }

  return data;
};

export const clearApiCache = () => getCache.clear();

export default apiClient;
