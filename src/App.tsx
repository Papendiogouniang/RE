import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import PaymentSuccess from './pages/PaymentSuccess';
import VerifyTicket from './pages/VerifyTicket';
import Profile from './pages/Profile';
import MyTickets from './pages/MyTickets';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import EventsList from './pages/Admin/Events/EventsList';
import CreateEvent from './pages/Admin/Events/CreateEvent';
import EditEvent from './pages/Admin/Events/EditEvent';
import UsersList from './pages/Admin/Users/UsersList';
import TicketsList from './pages/Admin/Tickets/TicketsList';
import SlidesList from './pages/Admin/Slides/SlidesList';
import CreateSlide from './pages/Admin/Slides/CreateSlide';
import EditSlide from './pages/Admin/Slides/EditSlide';
import Settings from './pages/Admin/Settings/Settings';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/verify-ticket" element={<VerifyTicket />} />
            <Route path="/verify-ticket/:id" element={<VerifyTicket />} />
            
            {/* Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="/my-tickets" element={
              <ProtectedRoute>
                <MyTickets />
              </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/events" element={
              <ProtectedRoute adminOnly>
                <EventsList />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/events/new" element={
              <ProtectedRoute adminOnly>
                <CreateEvent />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/events/:id/edit" element={
              <ProtectedRoute adminOnly>
                <EditEvent />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/users" element={
              <ProtectedRoute adminOnly>
                <UsersList />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/tickets" element={
              <ProtectedRoute adminOnly>
                <TicketsList />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/slides" element={
              <ProtectedRoute adminOnly>
                <SlidesList />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/slides/new" element={
              <ProtectedRoute adminOnly>
                <CreateSlide />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/slides/:id/edit" element={
              <ProtectedRoute adminOnly>
                <EditSlide />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/settings" element={
              <ProtectedRoute adminOnly>
                <Settings />
              </ProtectedRoute>
            } />
            {/* Fallback route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                  <p className="text-gray-600">Page non trouvée</p>
                </div>
              </div>
            } />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
};

export default App;