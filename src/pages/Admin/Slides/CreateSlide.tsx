import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Upload, 
  ArrowLeft,
  Save,
  X,
  Image as ImageIcon,
  Palette,
  Link as LinkIcon
} from 'lucide-react';
import { api, apiHelpers } from '../../../services/api';
import { Event } from '../../../types';
import Button from '../../../components/UI/Button';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateSlide: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [events, setEvents] = useState<Event[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      order: 0,
      isActive: true,
      backgroundColor: '#FFD700',
      textColor: '#000000',
      position: 'center',
      buttonText: 'Découvrir',
      buttonLink: '/events'
    }
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await apiHelpers.getAdminEvents();
      if (response.success) {
        setEvents(response.data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

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
    if (!selectedImage) {
      toast.error('Une image est requise');
      return;
    }

    try {
      setLoading(true);
      console.log('📝 Création slide - Données:', data);

      const formData = new FormData();
      
      // Champs obligatoires
      formData.append('title', data.title);
      formData.append('order', data.order.toString());
      formData.append('backgroundColor', data.backgroundColor);
      formData.append('textColor', data.textColor);
      formData.append('position', data.position);
      formData.append('isActive', data.isActive ? 'true' : 'false');
      
      // Champs optionnels
      if (data.subtitle) formData.append('subtitle', data.subtitle);
      if (data.description) formData.append('description', data.description);
      if (data.buttonText) formData.append('buttonText', data.buttonText);
      if (data.buttonLink) formData.append('buttonLink', data.buttonLink);
      if (data.eventId) formData.append('eventId', data.eventId);

      // Image
      formData.append('image', selectedImage);

      console.log('📤 Envoi vers API slides...');

      const response = await api.post('/slides', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('✅ Réponse API:', response.data);

      if (response.data.success) {
        toast.success('Slide créé avec succès !');
        navigate('/admin/slides');
      } else {
        toast.error(response.data.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      console.error('❌ Create slide error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création du slide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/slides')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nouveau slide</h1>
              <p className="text-gray-600">Créez un nouveau slide pour la page d'accueil</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Image Upload */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              Image du slide *
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
                  <p className="text-sm text-gray-500">Image requise pour créer un nouveau slide</p>
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

          {/* Contenu */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Contenu du slide
            </h2>

            <div className="space-y-6">
              {/* Titre */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titre principal *
                </label>
                <input
                  {...register('title', { required: 'Titre requis' })}
                  type="text"
                  id="title"
                  placeholder="Titre accrocheur du slide"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Sous-titre */}
              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Sous-titre
                </label>
                <input
                  {...register('subtitle')}
                  type="text"
                  id="subtitle"
                  placeholder="Sous-titre ou catégorie"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={3}
                  placeholder="Description détaillée du slide"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Bouton et lien */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <LinkIcon className="w-5 h-5 mr-2" />
              Bouton d'action
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 mb-2">
                  Texte du bouton
                </label>
                <input
                  {...register('buttonText')}
                  type="text"
                  id="buttonText"
                  placeholder="Découvrir"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label htmlFor="buttonLink" className="block text-sm font-medium text-gray-700 mb-2">
                  Lien du bouton
                </label>
                <input
                  {...register('buttonLink')}
                  type="text"
                  id="buttonLink"
                  placeholder="/events"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Design */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Palette className="w-5 h-5 mr-2" />
              Design et position
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="backgroundColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur de fond
                </label>
                <input
                  {...register('backgroundColor')}
                  type="color"
                  id="backgroundColor"
                  className="w-full h-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 mb-2">
                  Couleur du texte
                </label>
                <input
                  {...register('textColor')}
                  type="color"
                  id="textColor"
                  className="w-full h-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                  Position du texte
                </label>
                <select
                  {...register('position')}
                  id="position"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="left">Gauche</option>
                  <option value="center">Centre</option>
                  <option value="right">Droite</option>
                </select>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                  Ordre d'affichage
                </label>
                <input
                  {...register('order', { required: 'Ordre requis' })}
                  type="number"
                  id="order"
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Plus le nombre est petit, plus le slide apparaît en premier
                </p>
                {errors.order && (
                  <p className="mt-1 text-sm text-red-600">{errors.order.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-2">
                  Événement lié (optionnel)
                </label>
                <select
                  {...register('eventId')}
                  id="eventId"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="">Aucun événement</option>
                  {events.map(event => (
                    <option key={event._id} value={event._id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/slides')}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={loading || !selectedImage}
            >
              {loading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
              Créer le slide
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSlide;