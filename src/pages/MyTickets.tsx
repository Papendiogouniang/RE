import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Download, 
  QrCode,
  Filter,
  Search,
  Eye,
  Mail
} from 'lucide-react';
import { apiHelpers } from '../services/api';
import { Ticket as TicketType } from '../types';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import toast from 'react-hot-toast';

const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTickets();
  }, [filter, currentPage]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        status: filter === 'all' ? undefined : filter
      };

      const response = await apiHelpers.getUserTickets(params);
      if (response.success) {
        setTickets(response.data.tickets);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Erreur lors du chargement des billets');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async (ticketId: string) => {
    try {
      const response = await apiHelpers.resendTicketEmail(ticketId);
      if (response.success) {
        toast.success('Email renvoyé avec succès');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du renvoi');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      paid: { color: 'bg-green-100 text-green-800', label: 'Confirmé' },
      used: { color: 'bg-blue-100 text-blue-800', label: 'Utilisé' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Annulé' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: 'Remboursé' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('fr-FR')} ${currency}`;
  };

  const filteredTickets = tickets.filter(ticket => 
    searchTerm === '' || 
    ticket.eventId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Billets</h1>
          <p className="text-gray-600">Gérez tous vos billets d'événements</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un billet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 appearance-none"
              >
                <option value="all">Tous</option>
                <option value="paid">Confirmés</option>
                <option value="pending">En attente</option>
                <option value="used">Utilisés</option>
                <option value="cancelled">Annulés</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={fetchTickets}>
                Actualiser
              </Button>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Chargement des billets..." />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun billet trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore acheté de billets.
            </p>
            <Link to="/events">
              <Button variant="primary">
                Découvrir les événements
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6 mb-8">
              {filteredTickets.map((ticket) => (
                <div key={ticket._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      {/* Ticket Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {ticket.eventId?.title || 'Événement supprimé'}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-yellow-500" />
                                {ticket.eventId?.date && formatDate(ticket.eventId.date)}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1 text-yellow-500" />
                                {ticket.eventId?.location?.name}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(ticket.status)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">ID Billet:</span>
                            <p className="font-mono text-gray-900">{ticket.ticketId}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Quantité:</span>
                            <p className="text-gray-900">{ticket.quantity} billet(s)</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Prix total:</span>
                            <p className="font-semibold text-gray-900">
                              {formatPrice(ticket.totalPrice, ticket.currency)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Acheté le:</span>
                            <p className="text-gray-900">
                              {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
                        {ticket.status === 'paid' && (
                          <>
                            <Button variant="primary" size="sm">
                              <QrCode className="w-4 h-4 mr-2" />
                              Voir QR Code
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Télécharger PDF
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResendEmail(ticket.ticketId)}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Renvoyer email
                            </Button>
                          </>
                        )}
                        
                        <Link to={`/events/${ticket.eventId?._id}`}>
                          <Button variant="outline" size="sm" fullWidth>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir événement
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* QR Code Section for paid tickets */}
                    {ticket.status === 'paid' && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                              <QrCode className="w-16 h-16 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 text-center mt-2">
                              Code QR de validation
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
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

export default MyTickets;