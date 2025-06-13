import axios from 'axios';

// Main API client for your backend
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Codeforces API client
const cfApi = axios.create({
  baseURL: 'https://codeforces.com/api',
  timeout: 5000
});

// API interceptors for better error handling
api.interceptors.request.use(
  config => {
    console.log('Making API request to:', config.baseURL + config.url);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log('API response received:', response.status, response.data);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error config:', error.config);
    return Promise.reject(error);
  }
);

// Function to validate Codeforces handle
export const validateCodeforcesHandle = async (handle) => {
  try {
    console.log('Validating Codeforces handle:', handle);
    const response = await cfApi.get(`/user.info?handles=${handle}`);
    return {
      isValid: true,
      user: response.data.result[0]
    };
  } catch (error) {
    console.error('Codeforces validation error:', error);
    if (error.response?.status === 400) {
      // Handle doesn't exist
      return {
        isValid: false,
        error: 'Invalid Codeforces handle'
      };
    }
    // Other errors (network, etc.)
    return {
      isValid: false,
      error: 'Failed to validate handle. Please try again.'
    };
  }
};

export default api;
