import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Ticket, ArrowRight, Star, TrendingUp } from 'lucide-react';
import { apiHelpers } from '../services/api';
import { Event, Slide } from '../types';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';

const Home: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [slidesResponse, eventsResponse] = await Promise.all([
          apiHelpers.getSlides(),
          apiHelpers.getFeaturedEvents()
        ]);

        if (slidesResponse.success) {
          setSlides(slidesResponse.data.slides);
        }

        if (eventsResponse.success) {
          setFeaturedEvents(eventsResponse.data.events);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (slides.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [slides.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('fr-FR')} ${currency}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section with Slides */}
      <section className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-400 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {slides.length > 0 ? (
          <div className="relative">
            {slides.map((slide, index) => (
              <div
                key={slide._id}
                className={`${
                  index === currentSlide ? 'block' : 'hidden'
                } relative min-h-[600px] flex items-center`}
                style={{
                  backgroundImage: slide.image.url ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${slide.image.url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                  <div className={`max-w-3xl ${slide.position === 'center' ? 'mx-auto text-center' : 
                    slide.position === 'right' ? 'ml-auto text-right' : ''}`}>
                    <h1 
                      className="text-4xl md:text-6xl font-bold mb-6"
                      style={{ color: slide.textColor }}
                    >
                      {slide.title}
                    </h1>
                    {slide.subtitle && (
                      <h2 
                        className="text-xl md:text-2xl mb-6"
                        style={{ color: slide.textColor }}
                      >
                        {slide.subtitle}
                      </h2>
                    )}
                    {slide.description && (
                      <p 
                        className="text-lg mb-8 leading-relaxed"
                        style={{ color: slide.textColor }}
                      >
                        {slide.description}
                      </p>
                    )}
                    {slide.buttonText && slide.buttonLink && (
                      <Link to={slide.buttonLink}>
                        <Button variant="primary" size="lg">
                          {slide.buttonText}
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Slide indicators */}
            {slides.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentSlide 
                        ? 'bg-white scale-110' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Default hero content when no slides
          <div className="relative min-h-[600px] flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                  Découvrez les événements
                  <span className="text-black"> extraordinaires</span>
                </h1>
                <p className="text-xl text-white mb-8 leading-relaxed">
                  La première plateforme sénégalaise de billetterie événementielle. 
                  Concerts, spectacles, festivals et bien plus encore !
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/events">
                    <Button variant="primary" size="lg">
                      Explorer les événements
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pourquoi choisir Kanzey.co ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une expérience de billetterie moderne et sécurisée adaptée au Sénégal
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Billets électroniques
              </h3>
              <p className="text-gray-600">
                Recevez vos billets instantanément par email avec un QR code unique et sécurisé
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Paiements locaux
              </h3>
              <p className="text-gray-600">
                Orange Money, Free Money, Wave - toutes vos solutions de paiement préférées
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Événements de qualité
              </h3>
              <p className="text-gray-600">
                Découvrez les meilleurs événements culturels et artistiques du Sénégal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {featuredEvents.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Événements à la une
                </h2>
                <p className="text-lg text-gray-600">
                  Ne manquez pas ces événements exceptionnels
                </p>
              </div>
              <Link to="/events">
                <Button variant="outline">
                  Voir tout
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.slice(0, 6).map((event) => (
                <div key={event._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="relative">
                    {event.primaryImage ? (
                      <img
                        src={event.primaryImage}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
                        <div className="text-4xl">🎭</div>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                        {event.category}
                      </span>
                    </div>
                    {event.availableTickets < 10 && event.availableTickets > 0 && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Plus que {event.availableTickets}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-600 text-sm">
                        <Calendar className="w-4 h-4 mr-2 text-yellow-500" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-2 text-yellow-500" />
                        {event.location.name}, {event.location.city}
                      </div>
                      <div className="flex items-center text-gray-600 text-sm">
                        <Users className="w-4 h-4 mr-2 text-yellow-500" />
                        {event.availableTickets} places disponibles
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(event.price, event.currency)}
                      </div>
                      <Link to={`/events/${event._id}`}>
                        <Button variant="primary" size="sm">
                          Voir détails
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-20 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">500+</div>
              <div className="text-gray-300">Événements organisés</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">50k+</div>
              <div className="text-gray-300">Billets vendus</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">10k+</div>
              <div className="text-gray-300">Utilisateurs actifs</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-500 mb-2">98%</div>
              <div className="text-gray-300">Satisfaction client</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 to-orange-400">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Prêt à vivre des expériences inoubliables ?
          </h2>
          <p className="text-lg text-black mb-8">
            Rejoignez la communauté Kanzey.co et découvrez les meilleurs événements du Sénégal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Créer un compte
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="lg">
                Explorer les événements
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;