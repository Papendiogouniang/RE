import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Search, Filter, SortAsc } from 'lucide-react';
import { apiHelpers } from '../services/api';
import { Event, EventFilters } from '../types';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EventFilters>({
    page: 1,
    limit: 12,
    category: 'all',
    search: '',
    sortBy: 'date',
    sortOrder: 'asc'
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const categories = [
    { value: 'all', label: 'Toutes les catégories' },
    { value: 'concert', label: 'Concert' },
    { value: 'theatre', label: 'Théâtre' },
    { value: 'sport', label: 'Sport' },
    { value: 'conference', label: 'Conférence' },
    { value: 'festival', label: 'Festival' },
    { value: 'exposition', label: 'Exposition' },
    { value: 'spectacle', label: 'Spectacle' }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'price', label: 'Prix' },
    { value: 'title', label: 'Titre' },
    { value: 'popularity', label: 'Popularité' }
  ];

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (params.category === 'all') {
        delete params.category;
      }

      const response = await apiHelpers.getEvents(params);
      if (response.success) {
        setEvents(response.data.events);
        setTotalPages(response.data.pagination.totalPages);
        setTotalEvents(response.data.pagination.totalEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof EventFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page when other filters change
    }));
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchEvents();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('fr-FR')} ${currency}`;
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      concert: '🎵',
      theatre: '🎭',
      sport: '⚽',
      conference: '🎤',
      festival: '🎪',
      exposition: '🖼️',
      spectacle: '🎨',
      autre: '🎯'
    };
    return emojis[category] || '🎯';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Tous les Événements
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez les meilleurs événements culturels et artistiques du Sénégal
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </form>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 appearance-none"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 appearance-none"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    Trier par {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <select
              value={filters.sortOrder}
              onChange={(e) => updateFilter('sortOrder', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 appearance-none"
            >
              <option value="asc">Croissant</option>
              <option value="desc">Décroissant</option>
            </select>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            {totalEvents} événement{totalEvents !== 1 ? 's' : ''} trouvé{totalEvents !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Chargement des événements..." />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun événement trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button 
              variant="primary"
              onClick={() => setFilters(prev => ({ ...prev, search: '', category: 'all', page: 1 }))}
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {events.map((event) => (
                <div key={event._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <div className="relative">
                    {event.primaryImage ? (
                      <img
                        src={event.primaryImage}
                        alt={event.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
                        <div className="text-4xl">{getCategoryEmoji(event.category)}</div>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                        {getCategoryEmoji(event.category)} {event.category}
                      </span>
                    </div>
                    {event.availableTickets < 10 && event.availableTickets > 0 && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                          Plus que {event.availableTickets}
                        </span>
                      </div>
                    )}
                    {event.availableTickets === 0 && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          Complet
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-yellow-600 transition-colors">
                      {event.title}
                    </h3>
                    
                    {event.shortDescription && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.shortDescription}
                      </p>
                    )}
                    
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
                        {event.availableTickets > 0 
                          ? `${event.availableTickets} places disponibles`
                          : 'Complet'
                        }
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(event.price, event.currency)}
                      </div>
                      <Link to={`/events/${event._id}`}>
                        <Button 
                          variant={event.availableTickets > 0 ? "primary" : "outline"}
                          size="sm"
                        >
                          {event.availableTickets > 0 ? 'Acheter' : 'Voir détails'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => updateFilter('page', Math.max(1, filters.page! - 1))}
                  disabled={filters.page === 1}
                >
                  Précédent
                </Button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={filters.page === page ? "primary" : "outline"}
                        size="sm"
                        onClick={() => updateFilter('page', page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  
                  {totalPages > 5 && (
                    <>
                      {totalPages > 6 && <span className="px-2">...</span>}
                      <Button
                        variant={filters.page === totalPages ? "primary" : "outline"}
                        size="sm"
                        onClick={() => updateFilter('page', totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => updateFilter('page', Math.min(totalPages, filters.page! + 1))}
                  disabled={filters.page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default EventsPage;