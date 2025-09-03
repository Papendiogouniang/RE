import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Share2, 
  Heart,
  ArrowLeft,
  Ticket,
  Star,
  Phone,
  Mail,
  Globe
} from 'lucide-react';
import { apiHelpers } from '../services/api';
import { paymentService } from '../services/paymentService';
import { Event, PurchaseData } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import toast from 'react-hot-toast';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [recipientNumber, setRecipientNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('orange_money');

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await apiHelpers.getEventById(id!);
      if (response.success) {
        setEvent(response.data.event);
      } else {
        toast.error('Événement non trouvé');
        navigate('/events');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error('Erreur lors du chargement de l\'événement');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Veuillez vous connecter pour acheter un billet');
      navigate('/login');
      return;
    }

    if (!recipientNumber) {
      toast.error('Veuillez saisir votre numéro de téléphone');
      return;
    }

    if (!event) return;

    try {
      setPurchasing(true);

      const purchaseData: PurchaseData = {
        eventId: event._id,
        quantity,
        recipientNumber,
        paymentMethod
      };

      const result = await paymentService.purchaseTicket(purchaseData);

      if (result.success && result.data) {
        toast.success('Commande créée ! Redirection vers le paiement...');
        
        // Rediriger vers InTouch avec les données de paiement
        const paymentData = {
          transactionId: result.data.payment.transactionId,
          totalPrice: result.data.ticket.totalPrice,
          eventTitle: result.data.event.title,
          quantity: quantity,
          recipientNumber,
          recipientFirstName: user?.firstName || '',
          recipientLastName: user?.lastName || '',
          recipientEmail: user?.email || ''
        };

        // Ouvrir la page de paiement InTouch
        paymentService.openInTouchPayment(paymentData);
        
      } else {
        toast.error(result.message || 'Erreur lors de la création de la commande');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error('Erreur lors de l\'achat du billet');
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price.toLocaleString('fr-FR')} ${currency}`;
  };

  const shareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.shortDescription || event?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement de l'événement..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Événement non trouvé</h1>
          <Button onClick={() => navigate('/events')}>
            Retour aux événements
          </Button>
        </div>
      </div>
    );
  }

  const eventDate = formatDate(event.date);
  const isEventPassed = new Date(event.date) < new Date();
  const isSoldOut = event.availableTickets === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/events')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour aux événements
            </button>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={shareEvent}>
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Image */}
            <div className="relative">
              {event.primaryImage ? (
                <img
                  src={event.primaryImage}
                  alt={event.title}
                  className="w-full h-96 object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                  <div className="text-6xl">🎭</div>
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex space-x-2">
                <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                  {event.category}
                </span>
                {event.isFeatured && (
                  <span className="bg-black text-yellow-500 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    À la une
                  </span>
                )}
              </div>

              {/* Status Badge */}
              {(isEventPassed || isSoldOut) && (
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isEventPassed 
                      ? 'bg-gray-500 text-white' 
                      : 'bg-red-500 text-white'
                  }`}>
                    {isEventPassed ? 'Terminé' : 'Complet'}
                  </span>
                </div>
              )}
            </div>

            {/* Event Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {event.title}
              </h1>

              {event.shortDescription && (
                <p className="text-lg text-gray-600 mb-6">
                  {event.shortDescription}
                </p>
              )}

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{eventDate.date}</p>
                    <p className="text-sm text-gray-600">à {eventDate.time}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{event.location.name}</p>
                    <p className="text-sm text-gray-600">
                      {event.location.address && `${event.location.address}, `}
                      {event.location.city}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {event.availableTickets} places disponibles
                    </p>
                    <p className="text-sm text-gray-600">
                      sur {event.capacity} au total
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatPrice(event.price, event.currency)}
                    </p>
                    <p className="text-sm text-gray-600">par billet</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Description
                </h2>
                <div className="prose max-w-none text-gray-700">
                  {event.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Organizer Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Organisateur
              </h2>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-600" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {event.organizer.name}
                  </h3>
                  
                  <div className="space-y-2">
                    {event.organizer.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <a 
                          href={`mailto:${event.organizer.email}`}
                          className="hover:text-yellow-600"
                        >
                          {event.organizer.email}
                        </a>
                      </div>
                    )}
                    
                    {event.organizer.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        <a 
                          href={`tel:${event.organizer.phone}`}
                          className="hover:text-yellow-600"
                        >
                          {event.organizer.phone}
                        </a>
                      </div>
                    )}
                    
                    {event.organizer.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Globe className="w-4 h-4 mr-2" />
                        <a 
                          href={event.organizer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-yellow-600"
                        >
                          Site web
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - Purchase */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatPrice(event.price, event.currency)}
                </div>
                <p className="text-gray-600">par billet</p>
              </div>

              {!isEventPassed && !isSoldOut ? (
                <div className="space-y-4">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de billets
                    </label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    >
                      {Array.from({ length: Math.min(10, event.availableTickets) }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} billet{i > 0 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      value={recipientNumber}
                      onChange={(e) => setRecipientNumber(e.target.value)}
                      placeholder="77 123 45 67"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Numéro pour le paiement mobile
                    </p>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Méthode de paiement
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod('orange_money')}
                        className={`p-3 border rounded-lg text-center ${
                          paymentMethod === 'orange_money'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <div className="text-orange-500 text-lg mb-1">🟠</div>
                        <div className="text-xs">Orange Money</div>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('free_money')}
                        className={`p-3 border rounded-lg text-center ${
                          paymentMethod === 'free_money'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <div className="text-blue-500 text-lg mb-1">🔵</div>
                        <div className="text-xs">Free Money</div>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('wave')}
                        className={`p-3 border rounded-lg text-center ${
                          paymentMethod === 'wave'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <div className="text-blue-400 text-lg mb-1">💙</div>
                        <div className="text-xs">Wave</div>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod('touch_point')}
                        className={`p-3 border rounded-lg text-center ${
                          paymentMethod === 'touch_point'
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <div className="text-gray-600 text-lg mb-1">💳</div>
                        <div className="text-xs">Touch Point</div>
                      </button>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-medium">Total</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(event.price * quantity, event.currency)}
                      </span>
                    </div>

                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handlePurchase}
                      loading={purchasing}
                      disabled={!recipientNumber}
                    >
                      <Ticket className="w-4 h-4 mr-2" />
                      Acheter maintenant
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    🔒 Paiement sécurisé par InTouch
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-gray-500 mb-4">
                    {isEventPassed ? '⏰ Événement terminé' : '🎫 Billets épuisés'}
                  </div>
                  <Button variant="outline" fullWidth disabled>
                    {isEventPassed ? 'Événement passé' : 'Complet'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;