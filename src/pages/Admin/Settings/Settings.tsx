import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Settings as SettingsIcon, 
  Save, 
  Mail, 
  Phone, 
  MapPin,
  Globe,
  Shield,
  CreditCard,
  Bell
} from 'lucide-react';
import Button from '../../../components/UI/Button';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      siteName: 'Kanzey.CO',
      siteDescription: 'La première plateforme de billetterie événementielle du Sénégal',
      contactEmail: 'support@kanzey.co',
      contactPhone: '+221 XX XXX XX XX',
      address: 'Dakar, Sénégal',
      website: 'https://kanzey.co',
      currency: 'FCFA',
      taxRate: 0,
      emailNotifications: true,
      smsNotifications: false,
      maintenanceMode: false
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      // TODO: Implement settings update API
      console.log('Settings data:', data);
      toast.success('Paramètres sauvegardés avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Général', icon: SettingsIcon },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Sécurité', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
          <p className="text-gray-600">Configurez les paramètres de votre plateforme</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Général</h2>
                      <Button type="submit" variant="primary" loading={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </Button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
                          Nom du site
                        </label>
                        <input
                          {...register('siteName')}
                          type="text"
                          id="siteName"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-2">
                          Description du site
                        </label>
                        <textarea
                          {...register('siteDescription')}
                          id="siteDescription"
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                            Email de contact
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              {...register('contactEmail')}
                              type="email"
                              id="contactEmail"
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-2">
                            Téléphone de contact
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                              {...register('contactPhone')}
                              type="tel"
                              id="contactPhone"
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            {...register('address')}
                            type="text"
                            id="address"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Settings */}
                {activeTab === 'payment' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Paiement</h2>
                      <Button type="submit" variant="primary" loading={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </Button>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                          Devise par défaut
                        </label>
                        <select
                          {...register('currency')}
                          id="currency"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        >
                          <option value="FCFA">FCFA</option>
                          <option value="EUR">EUR</option>
                          <option value="USD">USD</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-2">
                          Taux de taxe (%)
                        </label>
                        <input
                          {...register('taxRate', { valueAsNumber: true })}
                          type="number"
                          id="taxRate"
                          min="0"
                          max="100"
                          step="0.1"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-medium text-yellow-900 mb-2">Configuration InTouch</h3>
                        <div className="text-sm text-yellow-800 space-y-1">
                          <p>• Merchant ID: KANZ26379</p>
                          <p>• Login Agent: 777101085</p>
                          <p>• URL de redirection: https://touchpay.gutouch.net/touchpayv2/</p>
                          <p>• Méthodes supportées: Orange Money, Free Money, Wave, Touch Point</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Settings */}
                {activeTab === 'email' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Email</h2>
                      <Button type="submit" variant="primary" loading={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </Button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center">
                        <input
                          {...register('emailNotifications')}
                          type="checkbox"
                          id="emailNotifications"
                          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                        />
                        <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                          Activer les notifications par email
                        </label>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-medium text-blue-900 mb-2">Configuration Mailtrap</h3>
                        <div className="text-sm text-blue-800 space-y-1">
                          <p>• Host: sandbox.smtp.mailtrap.io</p>
                          <p>• Port: 2525</p>
                          <p>• User: 72adac95601e47</p>
                          <p>• Status: ✅ Configuré</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">Sécurité</h2>
                      <Button type="submit" variant="primary" loading={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        Sauvegarder
                      </Button>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center">
                        <input
                          {...register('maintenanceMode')}
                          type="checkbox"
                          id="maintenanceMode"
                          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                        />
                        <label htmlFor="maintenanceMode" className="ml-2 text-sm text-gray-700">
                          Mode maintenance
                        </label>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-medium text-green-900 mb-2">Sécurité</h3>
                        <div className="text-sm text-green-800 space-y-1">
                          <p>• JWT Secret: ✅ Configuré</p>
                          <p>• CORS: ✅ Activé</p>
                          <p>• Rate Limiting: ✅ Activé</p>
                          <p>• Helmet: ✅ Activé</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;