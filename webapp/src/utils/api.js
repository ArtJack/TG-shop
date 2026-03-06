// Shared API base URL for all fetch calls.
// Falls back to empty string (same-origin) when not set in .env
const API_URL = import.meta.env.VITE_API_URL || '';

export default API_URL;
