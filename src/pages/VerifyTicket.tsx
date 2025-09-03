import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle, XCircle, Camera, Scan, User, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiHelpers } from '../services/api';
import { TicketValidationResult } from '../types';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const VerifyTicket: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualTicketId, setManualTicketId] = useState('');
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [scannerMounted, setScannerMounted] = useState(false);

  // Redirect non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès restreint</h1>
          <p className="text-gray-600 mb-6">
            Seuls les administrateurs peuvent accéder au scanner de billets
          </p>
          <Button onClick={() => window.history.back()}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  // Auto-verify if ticket ID in URL
  useEffect(() => {
    if (id) {
      verifyTicket(id);
    }
  }, [id]);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.log('Scanner cleanup error:', e);
        }
      }
    };
  }, []);

  const startScanning = () => {
    setScanning(true);
    setValidationResult(null);
    setScannerMounted(true);

    // Wait for DOM element to be available
    setTimeout(() => {
      const scannerElement = document.getElementById('qr-reader');
      if (!scannerElement) {
        toast.error('Erreur d\'initialisation du scanner');
        setScanning(false);
        setScannerMounted(false);
        return;
      }

      try {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        scanner.render(
          (decodedText) => {
            // Extract ticket ID from QR code
            const ticketId = extractTicketId(decodedText);
            if (ticketId) {
              verifyTicket(ticketId);
              stopScanning();
            } else {
              toast.error('QR Code invalide');
            }
          },
          (error) => {
            // Ignore scanning errors (they're frequent)
          }
        );

        scannerRef.current = scanner;
      } catch (error) {
        console.error('Scanner initialization error:', error);
        toast.error('Erreur d\'initialisation du scanner');
        setScanning(false);
        setScannerMounted(false);
      }
    }, 100);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.log('Scanner stop error:', e);
      }
      scannerRef.current = null;
    }
    setScanning(false);
    setScannerMounted(false);
  };

  const extractTicketId = (qrData: string): string | null => {
    // Extract ticket ID from various QR code formats
    if (qrData.includes('/verify-ticket/')) {
      return qrData.split('/verify-ticket/')[1];
    }
    if (qrData.startsWith('TKT-')) {
      return qrData;
    }
    // Try to match ticket ID pattern
    const match = qrData.match(/TKT-\d+-[A-Z0-9]+/);
    return match ? match[0] : null;
  };

  const verifyTicket = async (ticketId: string) => {
    try {
      setLoading(true);
      console.log('🔍 Vérification ticket:', ticketId);
      
      const response = await apiHelpers.verifyTicket(ticketId);
      
      console.log('📋 Réponse vérification:', response);
      
      if (response.success && response.validationResult) {
        setValidationResult(response.validationResult);
        
        if (response.validationResult.isValid) {
          toast.success('✅ Billet valide - Entrée autorisée');
        } else {
          toast.error('❌ ' + response.validationResult.message);
        }
      } else {
        setValidationResult({
          isValid: false,
          status: 'error',
          isScanned: false,
          ticketId,
          message: response.message || 'Erreur de vérification'
        });
        toast.error('Erreur lors de la vérification');
      }
    } catch (error: any) {
      console.error('❌ Verify ticket error:', error);
      setValidationResult({
        isValid: false,
        status: 'error',
        isScanned: false,
        ticketId,
        message: 'Erreur de connexion'
      });
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTicketId.trim()) {
      verifyTicket(manualTicketId.trim());
    }
  };

  const resetValidation = () => {
    setValidationResult(null);
    setManualTicketId('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🎟️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vérification de billets
          </h1>
          <p className="text-gray-600">
            Scannez le QR code ou saisissez l'ID du billet pour vérifier sa validité
          </p>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              👨‍💼 Connecté en tant qu'administrateur : {user?.firstName} {user?.lastName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Scanner QR Code
            </h2>

            {!scanning ? (
              <div className="text-center">
                <div className="w-64 h-64 mx-auto mb-6 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Scan className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Cliquez pour activer la caméra</p>
                  </div>
                </div>
                
                <Button variant="primary" onClick={startScanning}>
                  <Camera className="w-4 h-4 mr-2" />
                  Activer le scanner
                </Button>
              </div>
            ) : (
              <div>
                {scannerMounted && <div id="qr-reader" className="mb-4"></div>}
                <div className="text-center">
                  <Button variant="outline" onClick={stopScanning}>
                    Arrêter le scanner
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Vérification manuelle
            </h2>

            <form onSubmit={handleManualVerification} className="space-y-4">
              <div>
                <label htmlFor="ticketId" className="block text-sm font-medium text-gray-700 mb-2">
                  ID du billet
                </label>
                <input
                  type="text"
                  id="ticketId"
                  value={manualTicketId}
                  onChange={(e) => setManualTicketId(e.target.value)}
                  placeholder="TKT-1234567890-ABCDEF"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                fullWidth
                disabled={!manualTicketId.trim() || loading}
                loading={loading}
              >
                Vérifier le billet
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Format accepté :</h3>
              <p className="text-sm text-gray-600">
                • ID complet : TKT-1234567890-ABCDEF<br/>
                • URL : https://kanzey.co/verify-ticket/TKT-...<br/>
                • QR Code scanné depuis l'application
              </p>
            </div>
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className="mt-8">
            <div className={`bg-white rounded-xl shadow-sm border-2 ${
              validationResult.isValid 
                ? 'border-green-200' 
                : 'border-red-200'
            } p-6`}>
              <div className="text-center mb-6">
                {validationResult.isValid ? (
                  <div>
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-700 mb-2">
                      ✅ Billet Valide
                    </h3>
                    <p className="text-green-600">
                      Entrée autorisée
                    </p>
                  </div>
                ) : (
                  <div>
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-red-700 mb-2">
                      ❌ Billet Invalide
                    </h3>
                    <p className="text-red-600">
                      {validationResult.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Ticket Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">ID BILLET</div>
                    <div className="font-mono text-lg text-gray-900">
                      {validationResult.ticketId}
                    </div>
                  </div>

                  {validationResult.holderName && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">DÉTENTEUR</div>
                      <div className="flex items-center text-gray-900">
                        <User className="w-4 h-4 mr-2 text-yellow-500" />
                        {validationResult.holderName}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-gray-500">STATUT</div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      validationResult.isValid
                        ? 'bg-green-100 text-green-800'
                        : validationResult.isScanned
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {validationResult.isScanned 
                        ? '🔄 Déjà utilisé' 
                        : validationResult.isValid 
                        ? '✅ Valide' 
                        : '❌ Invalide'
                      }
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {validationResult.eventTitle && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">ÉVÉNEMENT</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {validationResult.eventTitle}
                      </div>
                    </div>
                  )}

                  {validationResult.eventDate && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">DATE</div>
                      <div className="flex items-center text-gray-900">
                        <Calendar className="w-4 h-4 mr-2 text-yellow-500" />
                        {formatDate(validationResult.eventDate)}
                      </div>
                    </div>
                  )}

                  {validationResult.eventLocation && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">LIEU</div>
                      <div className="flex items-center text-gray-900">
                        <MapPin className="w-4 h-4 mr-2 text-yellow-500" />
                        {validationResult.eventLocation}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Scan History */}
              {validationResult.isScanned && validationResult.scannedAt && (
                <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm">
                    <strong>Déjà scanné le :</strong> {formatDate(validationResult.scannedAt)}
                    {validationResult.scannedBy && (
                      <span> par {validationResult.scannedBy}</span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <Button variant="outline" onClick={resetValidation}>
                  Vérifier un autre billet
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Instructions d'utilisation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📱 Scanner QR Code</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Activez la caméra en cliquant sur "Activer le scanner"</li>
                <li>• Pointez la caméra vers le QR code du billet</li>
                <li>• La vérification se fait automatiquement</li>
                <li>• Assurez-vous d'avoir un bon éclairage</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">⌨️ Saisie manuelle</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Saisissez l'ID du billet (format TKT-...)</li>
                <li>• Ou collez l'URL complète du billet</li>
                <li>• Cliquez sur "Vérifier le billet"</li>
                <li>• Utile si le QR code est illisible</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyTicket;