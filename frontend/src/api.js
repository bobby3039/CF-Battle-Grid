import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Codeforces API client
const cfApi = axios.create({
  baseURL: 'https://codeforces.com/api',
  timeout: 5000
});

api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Function to validate Codeforces handle
export const validateCodeforcesHandle = async (handle) => {
  try {
    const response = await cfApi.get(`/user.info?handles=${handle}`);
    return {
      isValid: true,
      user: response.data.result[0]
    };
  } catch (error) {
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
