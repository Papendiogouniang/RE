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
              <img 
                src="data:image/png;base64,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" 
                alt="Kanzey.co Logo" 
                className="w-8 h-8"
              />
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