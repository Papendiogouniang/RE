// User Types
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'agent';
  avatar?: string;
  address?: {
    street?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
    language: 'fr' | 'wo' | 'en';
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fullName: string;
}

// Event Types
export interface Event {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  date: string;
  endDate?: string;
  location: {
    name: string;
    address?: string;
    city: string;
    region?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  capacity: number;
  price: number;
  currency: string;
  category: 'concert' | 'theatre' | 'sport' | 'conference' | 'festival' | 'exposition' | 'spectacle' | 'autre';
  tags: string[];
  images: {
    url: string;
    alt?: string;
    isPrimary: boolean;
  }[];
  organizer: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isVirtualEvent: boolean;
  virtualEventDetails?: {
    platform?: string;
    link?: string;
    accessCode?: string;
  };
  ticketsSold: number;
  revenue: number;
  isActive: boolean;
  isFeatured: boolean;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
  availableTickets: number;
  primaryImage?: string;
}

// Ticket Types
export interface Ticket {
  _id: string;
  ticketId: string;
  userId: string | User;
  eventId: string | Event;
  paymentId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded' | 'used';
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  qrCode: {
    data: string;
    imageUrl?: string;
    scanned: boolean;
    scannedAt?: string;
    scannedBy?: string | User;
  };
  holderInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  isEmailSent: boolean;
  emailSentAt?: string;
  notes?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    paymentMethod?: string;
    deviceType?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Slide Types
export interface Slide {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: {
    url: string;
    alt?: string;
  };
  buttonText?: string;
  buttonLink?: string;
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  backgroundColor: string;
  textColor: string;
  position: 'left' | 'center' | 'right';
  eventId?: string | Event;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginationResponse<T> extends ApiResponse<T> {
  data: T & {
    pagination: {
      currentPage: number;
      totalPages: number;
      totalEvents?: number;
      totalUsers?: number;
      totalTickets?: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

// Auth Types
export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

// Payment Types
export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  isActive: boolean;
}

export interface PurchaseData {
  eventId: string;
  quantity: number;
  recipientNumber: string;
  paymentMethod: string;
}

export interface PaymentResult {
  success: boolean;
  data?: {
    ticket: {
      ticketId: string;
      status: string;
      paymentStatus: string;
      totalPrice: number;
      currency: string;
      qrCode: string;
    };
    payment: {
      transactionId: string;
      status: string;
      paymentUrl?: string;
      redirectUrl?: string;
    };
    event: {
      title: string;
      date: string;
      location: any;
    };
  };
  error?: any;
  message?: string;
}

// Admin Dashboard Types
export interface DashboardStats {
  overview: {
    totalEvents: number;
    totalUsers: number;
    totalTicketsSold: number;
    totalRevenue: number;
  };
  recentEvents: Event[];
  recentTickets: Ticket[];
  monthlyStats: Array<{
    _id: { year: number; month: number };
    totalTickets: number;
    totalRevenue: number;
    count: number;
  }>;
  categoryStats: Array<{
    _id: string;
    count: number;
  }>;
  topEvents: Event[];
}

// Validation Types
export interface TicketValidationResult {
  isValid: boolean;
  status: string;
  isScanned: boolean;
  scannedAt?: string;
  scannedBy?: string;
  ticketId: string;
  holderName?: string;
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;
  message: string;
}

// Filter Types
export interface EventFilters {
  page?: number;
  limit?: number;
  category?: string;
  city?: string;
  search?: string;
  sortBy?: 'date' | 'price' | 'title' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface UserStats {
  totalTickets: number;
  paidTickets: number;
  pendingTickets: number;
  totalSpent: number;
  upcomingEvents: number;
}

export interface CategoryStats {
  _id: string;
  count: number;
  totalSpent: number;
}

// Form Types
export interface EventFormData {
  title: string;
  description: string;
  shortDescription?: string;
  date: string;
  endDate?: string;
  location: {
    name: string;
    address?: string;
    city: string;
    region?: string;
  };
  capacity: number;
  price: number;
  category: string;
  tags: string[];
  organizer: {
    name: string;
    email?: string;
    phone?: string;
    website?: string;
  };
  status: string;
  isVirtualEvent: boolean;
  virtualEventDetails?: {
    platform?: string;
    link?: string;
    accessCode?: string;
  };
  isFeatured: boolean;
  images?: FileList;
}

export interface SlideFormData {
  title: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  backgroundColor: string;
  textColor: string;
  position: string;
  eventId?: string;
  image?: File;
}

// Navigation Types
export interface NavItem {
  name: string;
  path: string;
  icon?: string;
  adminOnly?: boolean;
  agentOnly?: boolean;
}