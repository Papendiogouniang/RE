import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, Ticket, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';

const Header: React.FC = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Événements', path: '/events' },
    { name: 'Scanner QR', path: '/verify-ticket' },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Administration', path: '/admin' });
  }

  return (
    <header className="bg-white shadow-lg border-b-2 border-yellow-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="data:image/png;base64,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" 
              alt="Kanzey.co Logo" 
              className="w-8 h-8"
            />
              src="data:image/png;base64,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" 
              alt="Kanzey.co Logo" 
              className="w-8 h-8"
            />
            <div className="text-2xl font-bold">
              <span className="text-yellow-500">Kanzey</span>
              <span className="text-black">.co</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-gray-700 hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-yellow-500 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span>{user?.firstName}</span>
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Mon Profil
                    </Link>
                    <Link
                      to="/my-tickets"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Ticket className="w-4 h-4 mr-3" />
                      Mes Billets
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Administration
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Se connecter
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    S'inscrire
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-yellow-500 p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className="text-gray-700 hover:text-yellow-500 block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center px-3 py-2">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">
                        {user?.firstName} {user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-yellow-500"
                  >
                    <User className="w-5 h-5 mr-3" />
                    Mon Profil
                  </Link>
                  <Link
                    to="/my-tickets"
                    onClick={closeMobileMenu}
                    className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-yellow-500"
                  >
                    <Ticket className="w-5 h-5 mr-3" />
                    Mes Billets
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={closeMobileMenu}
                      className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:text-yellow-500"
                    >
                      <Settings className="w-5 h-5 mr-3" />
                      Administration
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-base font-medium text-gray-700 hover:text-yellow-500"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <Link to="/login" onClick={closeMobileMenu} className="block">
                    <Button variant="outline" fullWidth>
                      Se connecter
                    </Button>
                  </Link>
                  <Link to="/register" onClick={closeMobileMenu} className="block">
                    <Button variant="primary" fullWidth>
                      S'inscrire
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;