// import axios from "axios"

// export const api = axios.create({
//   baseURL: "/api",
//   withCredentials: true,
//   timeout: 10000,
// })

// api.interceptors.response.use(
//   (res: any) => res,
//   (err: any) => {
//     console.error("API ERROR:", err.response?.data || err.message)
//     return Promise.reject(err)
//   }
// )

export const API_ENDPOINTS = {
    // development:
    //   "https://api-dev.proofofskill.org/v1.0.0/api/public/action-records",
    production: "http://localhost:3000/api",
  };

  export const getApiUrl = () => {
    const env = process.env.NODE_ENV;
    return (
      API_ENDPOINTS[env as keyof typeof API_ENDPOINTS] || API_ENDPOINTS.production
    );
  };
