import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('justexa_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const registerUser = (data) => api.post('/api/auth/register/user', data);
export const registerAdvocate = (data) => api.post('/api/auth/register/advocate', data);
export const loginUser = (data) => api.post('/api/auth/login', data);
export const googleLogin = (userInfo) => api.post('/api/auth/google', userInfo);
export const forgotPassword = (email) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (data) => api.post('/api/auth/reset-password', data);

// Admin Auth (uses API_URL constant)
export const adminLogin = (data) => axios.post(`${API_URL}/api/admin/login`, data, { headers: { 'Content-Type': 'application/json' } });

// Profile API
export const getProfile = () => api.get('/api/profile');
export const updateProfile = (data) => api.put('/api/profile', data);

// Cases API
export const getCaseByCNR = (cnr) => api.get(`/api/cases/${cnr}`);
export const getCases = () => api.get('/api/cases');
export const seedCases = () => api.post('/api/cases/seed');


// Marketplace API
export const getAdvocates = (specialization = '', minFee = null, maxFee = null) => {
    const params = {};
    if (specialization) params.specialization = specialization;
    if (minFee !== null) params.min_fee = minFee;
    if (maxFee !== null) params.max_fee = maxFee;
    return api.get('/api/marketplace', { params });
}
export const getAdvocateById = (id) => api.get(`/api/marketplace/${id}`);
export const sendAdvocateRequest = (data) => api.post('/api/marketplace/send-request', data);

// Petition API (Groq AI)
export const generatePetition = (description, language = '') => api.post('/api/petition/generate', { description, language });
export const getPetitionHistory = () => api.get('/api/petition/history');
export const transcribeAudio = (blob, lang = 'en-IN', filename = 'recording.wav') =>
    api.post(
        `/api/petition/transcribe?lang=${encodeURIComponent(lang)}&filename=${encodeURIComponent(filename)}`,
        blob,
        { headers: { 'Content-Type': blob.type || 'audio/wav' } }
    );

// Holidays API (Google Calendar)
export const getHolidays = (year) => api.get('/api/holidays', { params: { year } });

// Seed data (dev only)
export const seedAdvocates = () => api.post('/api/marketplace/seed');

// Admin Approval API
export const getPendingAdvocates = () => api.get('/api/admin/pending-advocates');
export const approveAdvocate = (id) => api.put(`/api/admin/advocates/${id}/approve`);
export const rejectAdvocate = (id) => api.put(`/api/admin/advocates/${id}/reject`);

// Messaging API
export const getMessages = (otherPartyId) => api.get(`/api/messages/${otherPartyId}`);
export const sendMessage = (otherPartyId, text) => api.post(`/api/messages/${otherPartyId}`, { text });
export const getConversations = () => api.get('/api/messages/conversations');

// Message Request API
export const sendMessageRequest = (advocateId, message) => api.post('/api/message-requests', { advocateId, message });
export const checkMessageRequestStatus = (advocateId) => api.get(`/api/message-requests/my-status/${advocateId}`);
export const getIncomingMessageRequests = () => api.get('/api/message-requests/incoming');
export const acceptMessageRequest = (id) => api.put(`/api/message-requests/${id}/accept`);
export const rejectMessageRequest = (id) => api.put(`/api/message-requests/${id}/reject`);

export default api;
