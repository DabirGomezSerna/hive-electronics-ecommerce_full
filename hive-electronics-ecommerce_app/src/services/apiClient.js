import logger from "./logger";

const BASE_URL = process.env.REACT_APP_API_URL;

const GET_CACHE_TTL_MS = 60_000;
const getCache = new Map();

export class ApiError extends Error {
  constructor(message, { status = 0, path, method, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    this.method = method;
    this.body = body;
  }
}

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

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (cause) {
    logger.error("Network request failed", { path, method, error: cause });
    throw new ApiError("Network error. Check your connection and try again.", {
      status: 0,
      path,
      method,
    });
  }

  if (response.status === 204) {
    return null;
  }

  if (response.status === 401) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    logger.warn("Session expired, redirecting to login", { path, method });
    window.location.href = "/login";
    throw new ApiError("Your session expired. Please log in again.", {
      status: 401,
      path,
      method,
    });
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = data?.message || "Request failed";
    logger.warn("API request failed", { path, method, status: response.status });
    throw new ApiError(message, { status: response.status, path, method, body: data });
  }

  if (method === "GET") {
    getCache.set(path, { data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
  }

  return data;
};

export const clearApiCache = () => getCache.clear();

export default apiClient;
