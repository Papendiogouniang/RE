import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Ticket, 
  DollarSign, 
  TrendingUp, 
  Eye,
  Plus,
  Settings,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { apiHelpers } from '../../services/api';
import { DashboardStats } from '../../types';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Button from '../../components/UI/Button';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiHelpers.getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement du tableau de bord..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord administrateur
          </h1>
          <p className="text-gray-600">
            Vue d'ensemble de la plateforme Kanzey.CO
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Événements</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.overview.totalEvents || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.overview.totalUsers || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Billets vendus</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.overview.totalTicketsSold || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Ticket className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenus</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(stats?.overview.totalRevenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Événements récents
                </h2>
                <Link to="/admin/events">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir tout
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-6">
              {stats?.recentEvents && stats.recentEvents.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentEvents.slice(0, 5).map((event) => (
                    <div key={event._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(event.date)} • {event.location.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {event.ticketsSold}/{event.capacity}
                        </p>
                        <p className="text-xs text-gray-500">billets vendus</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucun événement récent
                </p>
              )}
            </div>
          </div>

          {/* Recent Tickets */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Ventes récentes
                </h2>
                <Link to="/admin/tickets">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Voir tout
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-6">
              {stats?.recentTickets && stats.recentTickets.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentTickets.slice(0, 5).map((ticket) => (
                    <div key={ticket._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {ticket.eventId?.title || 'Événement supprimé'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {ticket.userId?.firstName} {ticket.userId?.lastName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(ticket.totalPrice)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {ticket.quantity} billet(s)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Aucune vente récente
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Actions rapides
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link to="/admin/events/new">
                <Button variant="primary" fullWidth>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel événement
                </Button>
              </Link>
              
              <Link to="/admin/events">
                <Button variant="outline" fullWidth>
                  <Calendar className="w-4 h-4 mr-2" />
                  Gérer les événements
                </Button>
              </Link>
              
              <Link to="/admin/users">
                <Button variant="outline" fullWidth>
                  <Users className="w-4 h-4 mr-2" />
                  Gérer les utilisateurs
                </Button>
              </Link>
              
              <Link to="/admin/tickets">
                <Button variant="outline" fullWidth>
                  <Ticket className="w-4 h-4 mr-2" />
                  Voir les billets
                </Button>
              </Link>
              
              <Link to="/admin/slides">
                <Button variant="outline" fullWidth>
                  <Settings className="w-4 h-4 mr-2" />
                  Gérer les slides
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {stats?.categoryStats && stats.categoryStats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Événements par catégorie
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.categoryStats.map((category, index) => (
                    <div key={category._id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ 
                            backgroundColor: `hsl(${index * 45}, 70%, 50%)` 
                          }}
                        />
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {category._id}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {category.count} événement{category.count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Top événements
                </h2>
              </div>
              <div className="p-6">
                {stats?.topEvents && stats.topEvents.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topEvents.slice(0, 5).map((event, index) => (
                      <div key={event._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-bold text-yellow-600">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {event.title}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {event.location.city}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {event.ticketsSold} billets
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(event.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    Aucune donnée disponible
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;