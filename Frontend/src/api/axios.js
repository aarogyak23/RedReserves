import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 422) {
        const errors = error.response.data.errors;
        if (errors) {
          const errorMessage = Object.values(errors).flat().join(", ");
          error.message = errorMessage;
        }
      } else if (error.response.data.message) {
        error.message = error.response.data.message;
      }
    } else if (error.request) {
      error.message = "No response received from server. Please try again.";
    } else {
      error.message = "Error setting up the request. Please try again.";
    }
    return Promise.reject(error);
  }
);
