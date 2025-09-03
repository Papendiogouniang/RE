import axios from 'axios';
import toast from 'react-hot-toast';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth-specific API instance
export const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
const addAuthInterceptor = (axiosInstance: typeof axios) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('kanzey_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Response interceptor for error handling
const addResponseInterceptor = (axiosInstance: typeof axios) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('kanzey_token');
        delete axiosInstance.defaults.headers.common['Authorization'];
        
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
          toast.error('Session expirée, veuillez vous reconnecter');
        }
      } else if (error.response?.status === 403) {
        toast.error('Accès interdit');
      } else if (error.response?.status >= 500) {
        toast.error('Erreur serveur, veuillez réessayer');
      } else if (!error.response) {
        toast.error('Problème de connexion réseau');
      }
      
      return Promise.reject(error);
    }
  );
};

// Add interceptors
addAuthInterceptor(api);
addAuthInterceptor(authApi);
addResponseInterceptor(api);
addResponseInterceptor(authApi);

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  me: '/auth/me',
  updateProfile: '/auth/profile',
  changePassword: '/auth/change-password',
  logout: '/auth/logout',
  
  // Events
  events: '/events',
  featuredEvents: '/events/featured',
  eventById: (id: string) => `/events/${id}`,
  categoryStats: '/events/categories/stats',
  
  // Tickets
  tickets: '/tickets',
  ticketById: (id: string) => `/tickets/${id}`,
  verifyTicket: (id: string) => `/tickets/verify/${id}`,
  verifyQRTicket: (id: string) => `/tickets/verify-qr/${id}`,
  resendTicketEmail: (id: string) => `/tickets/${id}/resend-email`,
  ticketQR: (id: string) => `/tickets/${id}/qr`,
  
  // Payments
  purchase: '/payments/purchase',
  paymentCallback: '/payments/callback',
  verifyPayment: (id: string) => `/payments/verify/${id}`,
  paymentMethods: '/payments/methods',
  
  // Admin
  adminDashboard: '/admin/dashboard',
  adminEvents: '/admin/events',
  adminUsers: '/admin/users',
  adminTickets: '/admin/tickets',
  updateUserRole: (id: string) => `/admin/users/${id}/role`,
  updateUserStatus: (id: string) => `/admin/users/${id}/status`,
  adminAnalytics: '/admin/analytics',
  
  // Slides
  slides: '/slides',
  slidesAdmin: '/slides/admin',
  slideById: (id: string) => `/slides/${id}`,
  toggleSlide: (id: string) => `/slides/${id}/toggle`,
  reorderSlides: '/slides/reorder',
  
  // Users
  userProfile: '/users/profile',
  userTickets: '/users/tickets',
  userDashboard: '/users/dashboard'
};

// Helper functions for common API calls
export const apiHelpers = {
  // Events
  async getEvents(params?: any) {
    const response = await api.get(endpoints.events, { params });
    return response.data;
  },
  
  async getFeaturedEvents() {
    const response = await api.get(endpoints.featuredEvents);
    return response.data;
  },
  
  async getEventById(id: string) {
    const response = await api.get(endpoints.eventById(id));
    return response.data;
  },
  
  // Tickets
  async getUserTickets(params?: any) {
    const response = await api.get(endpoints.tickets, { params });
    return response.data;
  },
  
  async getTicketById(id: string) {
    const response = await api.get(endpoints.ticketById(id));
    return response.data;
  },
  
  async verifyTicket(id: string) {
    const response = await api.get(endpoints.verifyQRTicket(id));
    return response.data;
  },
  
  async verifyQRTicket(id: string) {
    const response = await api.get(endpoints.verifyQRTicket(id));
    return response.data;
  },
  
  // Payments
  async purchaseTicket(data: any) {
    const response = await api.post(endpoints.purchase, data);
    return response.data;
  },
  
  async getPaymentMethods() {
    const response = await api.get(endpoints.paymentMethods);
    return response.data;
  },
  
  async verifyPayment(transactionId: string) {
    const response = await api.get(endpoints.verifyPayment(transactionId));
    return response.data;
  },
  
  // Slides
  async getSlides() {
    const response = await api.get(endpoints.slides);
    return response.data;
  },
  
  // Admin
  async getDashboardStats() {
    const response = await api.get(endpoints.adminDashboard);
    return response.data;
  },
  
  async getAdminEvents(params?: any) {
    const response = await api.get(endpoints.adminEvents, { params });
    return response.data;
  },
  
  async getAdminUsers(params?: any) {
    const response = await api.get(endpoints.adminUsers, { params });
    return response.data;
  },
  
  async getAdminTickets(params?: any) {
    const response = await api.get(endpoints.adminTickets, { params });
    return response.data;
  },
  
  async updateUserRole(userId: string, role: string) {
    const response = await api.put(endpoints.updateUserRole(userId), { role });
    return response.data;
  },

  async updateUserStatus(userId: string, isActive: boolean) {
    const response = await api.put(endpoints.updateUserStatus(userId), { isActive });
    return response.data;
  },

  async getAdminSlides() {
    const response = await api.get(endpoints.slidesAdmin);
    return response.data;
  },

  async toggleSlide(slideId: string) {
    const response = await api.put(endpoints.toggleSlide(slideId));
    return response.data;
  },

  async deleteSlide(slideId: string) {
    const response = await api.delete(endpoints.slideById(slideId));
    return response.data;
  },

  async resendTicketEmail(ticketId: string) {
    const response = await api.post(endpoints.resendTicketEmail(ticketId));
    return response.data;
  },

  // User
  async getUserProfile() {
    const response = await api.get(endpoints.userProfile);
    return response.data;
  },
  
  async updateUserProfile(data: any) {
    const response = await api.put(endpoints.userProfile, data);
    return response.data;
  },
  
  async getUserDashboard() {
    const response = await api.get(endpoints.userDashboard);
    return response.data;
  }
};

export default api;