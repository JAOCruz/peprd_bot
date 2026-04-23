import axios from "axios";

export const getAPIUrl = () => {
  // In development, use localhost; in production, use current hostname
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8889";
  }
  // For remote access, use the current hostname with port 3000
  return `http://${window.location.hostname}:8889`;
};

const API_URL = import.meta.env.VITE_API_URL || (getAPIUrl() + "/api");

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),

  getCurrentUser: () => api.get("/auth/me"),
};
export const servicesAPI = {
  getServices: (startDate?: string, endDate?: string) =>
    api.get("/services", { params: { startDate, endDate } }),

  createService: (data: {
    username: string;
    serviceName: string;
    client?: string;
    earnings: number;
    date?: string;
  }) => api.post("/services", data), // Removed 'time' from interface

  getUserStats: (userId?: number) =>
    api.get(`/services/stats/user/${userId || ""}`),

  getAdminStats: () => api.get("/services/stats/admin"),

  deleteService: (id: number) => api.delete(`/services/${id}`),

  updateComment: (id: number, comment: string) =>
    api.put(`/services/${id}/comment`, { comment }),
};

export const settingsAPI = {
  getCurrentPercentage: () => api.get("/settings/current"),

  getPercentageForDate: (date?: string) =>
    api.get("/settings/percentage", { params: { date } }),

  getHistory: () => api.get("/settings/history"),

  updateEmployeePercentage: (percentage: number, effectiveDate: string) =>
    api.post("/settings/percentage", { percentage, effectiveDate }),

  deleteSetting: (id: number) => api.delete(`/settings/${id}`),
};

export default api;
