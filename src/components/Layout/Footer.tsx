import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin,
  Heart
} from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-yellow-500">🎟️</div>
              <div className="text-2xl font-bold">
                <span className="text-yellow-500">Kanzey</span>
                <span className="text-white">.co</span>
              </div>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed">
              La première plateforme sénégalaise de billetterie événementielle. 
              Découvrez et participez aux meilleurs événements culturels et artistiques du Sénégal.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://facebook.com/kanzeyco" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-500 transition-colors duration-200"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="https://twitter.com/kanzeyco" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-500 transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://instagram.com/kanzeyco" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-500 transition-colors duration-200"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-500">Liens rapides</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/events" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  Tous les événements
                </Link>
              </li>
              <li>
                <Link 
                  to="/events?category=concert" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  Concerts
                </Link>
              </li>
              <li>
                <Link 
                  to="/events?category=theatre" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  Théâtre
                </Link>
              </li>
              <li>
                <Link 
                  to="/events?category=sport" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  Sport
                </Link>
              </li>
              <li>
                <Link 
                  to="/events?category=festival" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  Festivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-500">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/help" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  Centre d'aide
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  Nous contacter
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  to="/refund-policy" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  Politique de remboursement
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-yellow-500">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  Dakar, Sénégal
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <a 
                  href="tel:+221777123456" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  +221 77 712 34 56
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                <a 
                  href="mailto:contact@kanzey.co" 
                  className="text-gray-300 hover:text-yellow-500 transition-colors duration-200 text-sm"
                >
                  contact@kanzey.co
                </a>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="pt-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Paiements acceptés</h4>
              <div className="flex items-center space-x-3">
                <div className="text-orange-500 text-lg" title="Orange Money">🟠</div>
                <div className="text-blue-500 text-lg" title="Free Money">🔵</div>
                <div className="text-blue-400 text-lg" title="Wave">💙</div>
                <div className="text-gray-300 text-lg" title="Touch Point">💳</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-gray-400 text-sm">
                © {currentYear} Kanzey.co. Tous droits réservés.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <Link 
                  to="/privacy" 
                  className="text-gray-400 hover:text-yellow-500 transition-colors duration-200"
                >
                  Confidentialité
                </Link>
                <Link 
                  to="/terms" 
                  className="text-gray-400 hover:text-yellow-500 transition-colors duration-200"
                >
                  Conditions d'utilisation
                </Link>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 text-gray-400 text-sm">
              <span>Fait avec</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>au Sénégal 🇸🇳</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-full shadow-lg transition-all duration-300 z-50"
        aria-label="Scroll to top"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </footer>
  );
};

export default Footer;