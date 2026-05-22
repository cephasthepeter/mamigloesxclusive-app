// API Configuration
// Update the IP address to match your backend server address
// For development: Use your machine's local IP address (not localhost)
// For production: Use your deployed server URL

export const API_BASE_URL = 'http://192.168.1.100:5000'; // Update this to your backend server IP/URL

export const API_ENDPOINTS = {
  UPLOADS: `${API_BASE_URL}/api/uploads`,
  PRODUCTS: `${API_BASE_URL}/api/products`,
  AUTH: `${API_BASE_URL}/api/auth`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  USERS: `${API_BASE_URL}/api/users`,
};

export default API_ENDPOINTS;
