import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Calendar, 
  MapPin, 
  Upload, 
  Star,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';
import { api } from '../../../services/api';
import Button from '../../../components/UI/Button';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      isFeatured: false,
      category: 'concert'
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      console.log('📝 Données formulaire:', data);

      const formData = new FormData();
      
      // Champs obligatoires
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('date', data.date);
      formData.append('capacity', data.capacity.toString());
      formData.append('price', data.price.toString());
      formData.append('category', data.category);
      formData.append('locationName', data.locationName);
      formData.append('locationCity', data.locationCity);
      formData.append('organizerName', data.organizerName);
      
      // Champs optionnels
      if (data.shortDescription) formData.append('shortDescription', data.shortDescription);
      if (data.locationAddress) formData.append('locationAddress', data.locationAddress);
      if (data.locationRegion) formData.append('locationRegion', data.locationRegion);
      if (data.organizerEmail) formData.append('organizerEmail', data.organizerEmail);
      if (data.organizerPhone) formData.append('organizerPhone', data.organizerPhone);
      if (data.organizerWebsite) formData.append('organizerWebsite', data.organizerWebsite);
      if (data.tags) formData.append('tags', data.tags);
      
      formData.append('isFeatured', data.isFeatured ? 'true' : 'false');

      // Image
      if (selectedImage) {
        formData.append('images', selectedImage);
      }

      console.log('📤 Envoi vers API...');

      const response = await api.post('/events', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Réponse API:', response.data);

      if (response.data.success) {
        toast.success('Événement créé avec succès !');
        navigate('/admin/events');
      } else {
        toast.error(response.data.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      console.error('❌ Create event error:', error);
      console.log('📋 Erreurs de validation:', error.response?.data?.errors);
      
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(err.msg || err.message);
        });
      } else {
        toast.error(error.response?.data?.message || 'Erreur lors de la création de l\'événement');
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'concert', label: 'Concert' },
    { value: 'theatre', label: 'Théâtre' },
    { value: 'sport', label: 'Sport' },
    { value: 'conference', label: 'Conférence' },
    { value: 'festival', label: 'Festival' },
    { value: 'exposition', label: 'Exposition' },
    { value: 'spectacle', label: 'Spectacle' },
    { value: 'autre', label: 'Autre' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/events')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nouvel événement</h1>
              <p className="text-gray-600">Créez un nouvel événement sur la plateforme</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Image Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Image de l'événement
            </h2>

            <div className="relative">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-yellow-400 transition-colors relative">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Choisir une image</p>
                  <p className="text-sm text-gray-500">PNG, JPG jusqu'à 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Informations principales */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Informations principales
            </h2>

            <div className="space-y-6">
              {/* Titre */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'événement *
                </label>
                <input
                  {...register('title', { required: 'Titre requis' })}
                  type="text"
                  id="title"
                  placeholder="Ex: Concert de Youssou N'Dour"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description', { required: 'Description requise' })}
                  id="description"
                  rows={4}
                  placeholder="Décrivez votre événement en détail..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Description courte */}
              <div>
                <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Description courte
                </label>
                <input
                  {...register('shortDescription')}
                  type="text"
                  id="shortDescription"
                  placeholder="Résumé en une ligne..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              {/* Catégorie */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  {...register('category', { required: 'Catégorie requise' })}
                  id="category"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (séparés par des virgules)
                </label>
                <input
                  {...register('tags')}
                  type="text"
                  id="tags"
                  placeholder="musique, concert, live, dakar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Date et heure */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Date et heure
            </h2>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date et heure *
              </label>
              <input
                {...register('date', { required: 'Date requise' })}
                type="datetime-local"
                id="date"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>
          </div>

          {/* Lieu */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Lieu
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du lieu *
                </label>
                <input
                  {...register('locationName', { required: 'Nom du lieu requis' })}
                  type="text"
                  placeholder="Ex: Grand Théâtre National"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {errors.locationName && (
                  <p className="mt-1 text-sm text-red-600">{errors.locationName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="locationCity" className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  {...register('locationCity', { required: 'Ville requise' })}
                  type="text"
                  placeholder="Ex: Dakar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {errors.locationCity && (
                  <p className="mt-1 text-sm text-red-600">{errors.locationCity.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse complète
                </label>
                <input
                  {...register('locationAddress')}
                  type="text"
                  placeholder="Ex: Avenue Léopold Sédar Senghor, Dakar"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Prix et capacité */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Prix et capacité
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Prix (FCFA) *
                </label>
                <input
                  {...register('price', { 
                    required: 'Prix requis',
                    min: { value: 0, message: 'Le prix ne peut pas être négatif' }
                  })}
                  type="number"
                  id="price"
                  min="0"
                  placeholder="5000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
                  Capacité *
                </label>
                <input
                  {...register('capacity', { 
                    required: 'Capacité requise',
                    min: { value: 1, message: 'La capacité doit être d\'au moins 1' }
                  })}
                  type="number"
                  id="capacity"
                  min="1"
                  placeholder="500"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Organisateur */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Organisateur
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="organizerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'organisateur *
                </label>
                <input
                  {...register('organizerName', { required: 'Nom de l\'organisateur requis' })}
                  type="text"
                  placeholder="Ex: Productions Kanzey"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {errors.organizerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.organizerName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="organizerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  {...register('organizerEmail')}
                  type="email"
                  placeholder="contact@organizer.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label htmlFor="organizerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  {...register('organizerPhone')}
                  type="tel"
                  placeholder="+221 77 123 45 67"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label htmlFor="organizerWebsite" className="block text-sm font-medium text-gray-700 mb-2">
                  Site web
                </label>
                <input
                  {...register('organizerWebsite')}
                  type="url"
                  placeholder="https://organizer.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Options
            </h2>

            <div className="flex items-center">
              <input
                {...register('isFeatured')}
                type="checkbox"
                id="isFeatured"
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
              />
              <label htmlFor="isFeatured" className="ml-2 flex items-center text-sm text-gray-700">
                <Star className="w-4 h-4 mr-1 text-yellow-500" />
                Mettre à la une (affichage en bannière sur la page d'accueil)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/events')}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
              Créer l'événement
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;