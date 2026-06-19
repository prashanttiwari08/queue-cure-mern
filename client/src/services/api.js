import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}/api`
  : 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

export const patientApi = {
  getPatients: () => api.get('/patients'),
  addPatient: (data) => api.post('/patients', data),
  updateStatus: (id, status) => api.put(`/patients/${id}/status`, { status }),
  resetQueue: () => api.delete('/patients/reset'),
};

export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (averageConsultationTime) => api.put('/settings', { averageConsultationTime }),
};

export default api;
