import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Download, Mail, Calendar, MapPin, Ticket } from 'lucide-react';
import { apiHelpers } from '../services/api';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const transactionId = searchParams.get('transaction');

  useEffect(() => {
    if (transactionId) {
      verifyPayment();
    }
  }, [transactionId]);

  const verifyPayment = async () => {
    try {
      const response = await apiHelpers.verifyPayment(transactionId!);
      if (response.success && response.data) {
        setTicketData(response.data);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Vérification du paiement..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-400 to-green-600 px-8 py-12 text-center">
            <CheckCircle className="w-20 h-20 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              Paiement réussi !
            </h1>
            <p className="text-green-100 text-lg">
              Votre billet a été généré avec succès
            </p>
          </div>

          {/* Ticket Information */}
          {ticketData && (
            <div className="px-8 py-8">
              <div className="border-2 border-dashed border-yellow-300 rounded-xl p-6 mb-8">
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    🎟️ Billet Électronique
                  </div>
                  <div className="text-lg text-gray-600">
                    ID: {ticketData.ticket?.ticketId}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">ÉVÉNEMENT</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {ticketData.event?.title}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">DATE & HEURE</div>
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-yellow-500" />
                        {ticketData.event?.date && formatDate(ticketData.event.date)}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">LIEU</div>
                      <div className="flex items-center text-gray-900">
                        <MapPin className="w-4 h-4 mr-2 text-yellow-500" />
                        {ticketData.event?.location?.name}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">QUANTITÉ</div>
                      <div className="flex items-center text-gray-900">
                        <Ticket className="w-4 h-4 mr-2 text-yellow-500" />
                        {ticketData.ticket?.quantity} billet(s)
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">PRIX TOTAL</div>
                      <div className="text-2xl font-bold text-green-600">
                        {ticketData.ticket && formatPrice(
                          ticketData.ticket.totalPrice, 
                          ticketData.ticket.currency
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-500">STATUT</div>
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✅ Payé
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="text-center mb-8">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Code QR de validation
                  </h3>
                  {ticketData.ticket?.qrCode && (
                    <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                      <img 
                        src={`/api/tickets/${ticketData.ticket.ticketId}/qr`}
                        alt="QR Code"
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-4">
                    Présentez ce code QR à l'entrée de l'événement
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-blue-500 mr-3" />
                    <div>
                      <div className="font-medium text-blue-900">
                        Billet envoyé par email
                      </div>
                      <div className="text-sm text-blue-700">
                        Vous recevrez votre billet PDF avec le code QR par email dans quelques minutes
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="primary" fullWidth>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger le billet
                  </Button>
                  
                  <Link to="/my-tickets" className="block">
                    <Button variant="outline" fullWidth>
                      <Ticket className="w-4 h-4 mr-2" />
                      Mes billets
                    </Button>
                  </Link>
                </div>

                <div className="text-center">
                  <Link to="/events">
                    <Button variant="outline">
                      Découvrir d'autres événements
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Important Notes */}
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">
                  📱 Instructions importantes
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Arrivez au moins 30 minutes avant le début de l'événement</li>
                  <li>• Présentez votre QR code (sur téléphone ou imprimé) à l'entrée</li>
                  <li>• Ce billet est personnel et ne peut être utilisé qu'une seule fois</li>
                  <li>• Conservez votre email de confirmation jusqu'à l'événement</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;