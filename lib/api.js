import axios from "axios";
import { getToken } from "./auth";
import { enqueueSnackbar } from "@/components/Snackbar";
const api = axios.create({
  baseURL: "https://alitinvoiceappapi.azurewebsites.net/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => {
    enqueueSnackbar("Request error", { variant: "error" });
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    if (["post", "put", "delete"].includes(response.config.method)) {
      enqueueSnackbar("Action successful", { variant: "success" });
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong!";
    enqueueSnackbar(message, { variant: "error" });
    return Promise.reject(error);
  }
);

export default api;