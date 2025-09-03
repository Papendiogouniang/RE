import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Calendar, 
  MapPin, 
  Upload, 
  Star,
  ArrowLeft,
  Save,
  X
} from 'lucide-react';
import { api, apiHelpers } from '../../../services/api';
import { Event } from '../../../types';
import Button from '../../../components/UI/Button';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const schema = yup.object({
  title: yup.string().min(3).max(200).required('Titre requis'),
  description: yup.string().min(10).max(2000).required('Description requise'),
  date: yup.string().required('Date requise'),
  locationName: yup.string().required('Nom du lieu requis'),
  locationCity: yup.string().required('Ville requise'),
  capacity: yup.number().min(1).required('Capacité requise'),
  price: yup.number().min(0).required('Prix requis'),
  category: yup.string().required('Catégorie requise'),
  organizerName: yup.string().required('Nom de l\'organisateur requis')
});

const EditEvent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await apiHelpers.getEventById(id!);
      if (response.success) {
        const eventData = response.data.event;
        setEvent(eventData);
        
        // Reset form with event data
        reset({
          title: eventData.title,
          description: eventData.description,
          shortDescription: eventData.shortDescription || '',
          date: new Date(eventData.date).toISOString().slice(0, 16),
          locationName: eventData.location.name,
          locationCity: eventData.location.city,
          locationAddress: eventData.location.address || '',
          locationRegion: eventData.location.region || '',
          capacity: eventData.capacity,
          price: eventData.price,
          category: eventData.category,
          organizerName: eventData.organizer.name,
          organizerEmail: eventData.organizer.email || '',
          organizerPhone: eventData.organizer.phone || '',
          organizerWebsite: eventData.organizer.website || '',
          tags: eventData.tags?.join(', ') || '',
          isFeatured: eventData.isFeatured
        });

        if (eventData.primaryImage) {
          setImagePreview(eventData.primaryImage);
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement de l\'événement');
      navigate('/admin/events');
    } finally {
      setFetchLoading(false);
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
    try {
      setLoading(true);

      const formData = new FormData();
      
      // Basic fields
      Object.keys(data).forEach(key => {
        if (key.startsWith('location') || key.startsWith('organizer')) {
          return; // Handle separately
        }
        formData.append(key, data[key]?.toString() || '');
      });

      // Location object
      const location = {
        name: data.locationName,
        address: data.locationAddress || '',
        city: data.locationCity,
        region: data.locationRegion || ''
      };
      formData.append('location', JSON.stringify(location));

      // Organizer object
      const organizer = {
        name: data.organizerName,
        email: data.organizerEmail || '',
        phone: data.organizerPhone || '',
        website: data.organizerWebsite || ''
      };
      formData.append('organizer', JSON.stringify(organizer));

      // Tags
      if (data.tags) {
        const tags = data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        tags.forEach((tag: string) => formData.append('tags', tag));
      }

      // Image
      if (selectedImage) {
        formData.append('images', selectedImage);
      }

      const response = await api.put(`/events/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Événement mis à jour avec succès !');
        navigate('/admin/events');
      } else {
        toast.error(response.data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Update event error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement de l'événement..." />
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Modifier l'événement</h1>
              <p className="text-gray-600">{event?.title}</p>
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-yellow-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Choisir une nouvelle image</p>
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

          {/* Rest of the form - same as CreateEvent */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Informations principales
            </h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'événement *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  id="title"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  {...register('category')}
                  id="category"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
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
              Mettre à jour
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEvent;