import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'https://synapse-ai-4dcd.onrender.com'}/api`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('synapse_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const vaultUnlocked = localStorage.getItem('vaultUnlocked');
  if (vaultUnlocked) {
    config.headers['X-Vault-Unlocked'] = 'true';
  }
  return config;
});

export default api;
